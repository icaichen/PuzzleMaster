import { AssetManifest } from '../models/PuzzleData';

/**
 * SceneRenderer.ts — 通用 2D 资产渲染引擎 (Layer 3)
 *
 * 抛弃了基于数学代码的硬编码绘制（如 bezierCurveTo 画天鹅），
 * 转而使用基于大模型生成的图片（背景 + 切图）进行拼贴渲染。
 * 它可以通杀所有能在 2D 平面上用坐标描述的谜题（拼图、华容道、倒水、分猪圈等）。
 */

export class SceneRenderer {
  private bgImage: HTMLImageElement | null = null;
  private spriteImages: Map<string, HTMLImageElement | HTMLCanvasElement> = new Map();
  private loaded = false;

  /**
   * 预加载所有 AI 生成的资产
   */
  public async loadAssets(manifest: AssetManifest): Promise<void> {
    this.loaded = false;
    this.spriteImages.clear();

    const loadImg = (url: string, isSprite: boolean) => {
      return new Promise<HTMLCanvasElement | HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (isSprite) {
            try {
              const processed = this.removeBackground(img);
              resolve(processed);
            } catch (e) {
              console.warn('Failed to remove background, using original image:', e);
              resolve(img);
            }
          } else {
            resolve(img);
          }
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    };

    try {
      const promises: Promise<any>[] = [];
      
      // Load background
      if (manifest.background_url) {
        promises.push(
          loadImg(manifest.background_url, false).then(img => {
            this.bgImage = img as HTMLImageElement;
          })
        );
      }

      // Load sprites
      for (const sprite of manifest.sprites) {
        promises.push(
          loadImg(sprite.url, true).then(img => {
            this.spriteImages.set(sprite.id, img);
          })
        );
      }

      await Promise.all(promises);
      this.loaded = true;
    } catch (err) {
      console.error('SceneRenderer failed to load assets:', err);
    }
  }

  /**
   * Automatically key out the solid background of an image (e.g. pure white or pure black).
   * It samples the corner pixels to detect the background color, then sets its alpha to 0.
   */
  private removeBackground(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(img, 0, 0);
    
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample top-left pixel as background color
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      // Threshold for color similarity (Manhattan distance in RGB space)
      // Higher threshold = more aggressive removal
      const threshold = 45;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (dist < threshold) {
          data[i + 3] = 0; // Set alpha to 0 (fully transparent)
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // getImageData might throw if cross-origin (though should be safe on same-origin)
      console.error('Error processing image transparency:', e);
    }

    return canvas;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 渲染整个场景
   * @param ctx Canvas 上下文
   * @param w 画布宽度
   * @param h 画布高度
   * @param elements 当前帧需要渲染的元素数组 (包含 id, x, y, width, height)
   */
  public drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.loaded) {
      ctx.fillStyle = '#1a1428';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '14px sans-serif';
      ctx.fillText('Loading Assets...', w / 2, h / 2);
      return;
    }

    // 1. 绘制背景 (Cover)
    if (this.bgImage) {
      const imgRatio = this.bgImage.width / this.bgImage.height;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
      } else {
        drawH = w / imgRatio;
        drawY = (h - drawH) / 2;
      }

      ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, w, h);
    }

    // 暗角/滤镜效果，增加雷顿风质感
    const grad = ctx.createRadialGradient(w/2, h/2, w * 0.3, w/2, h/2, w);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  public drawSprites(
    ctx: CanvasRenderingContext2D,
    elements: { id: string; x: number; y: number; w: number; h: number; alpha?: number; scale?: number; glow?: boolean; isTarget?: boolean }[]
  ): void {
    if (!this.loaded) return;

    // 2. 绘制每个切图 (Sprite)
    for (const el of elements) {
      const img = this.spriteImages.get(el.id);
      
      // Compute scaling
      const scale = el.scale ?? 1.0;
      const scaledW = el.w * scale;
      const scaledH = el.h * scale;
      const offsetX = el.x - (scaledW - el.w) / 2;
      const offsetY = el.y - (scaledH - el.h) / 2;

      if (img) {
        ctx.save();
        if (el.alpha !== undefined) {
          ctx.globalAlpha = el.alpha;
        }
        
        // 特效：拖拽高亮 (Glow) 或 目标角色聚光灯
        if (el.glow) {
          ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'; // Golden glow
          ctx.shadowBlur = 15;
          ctx.shadowOffsetY = 0;
        } else {
          // 普通阴影
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 4;
        }
        
        // 特效：目标角色聚光灯底座
        if (el.isTarget && !el.glow) {
           ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
           ctx.shadowBlur = 20;
        }

        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
        ctx.restore();
      } else {
        // Fallback
        ctx.fillStyle = el.glow ? 'rgba(255, 200, 100, 0.8)' : 'rgba(255, 100, 100, 0.5)';
        ctx.fillRect(offsetX, offsetY, scaledW, scaledH);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(offsetX, offsetY, scaledW, scaledH);
      }
    }
  }
}
