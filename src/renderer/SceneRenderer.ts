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
  private spriteImages: Map<string, HTMLImageElement> = new Map();
  private loaded = false;

  /**
   * 预加载所有 AI 生成的资产
   */
  public async loadAssets(manifest: AssetManifest): Promise<void> {
    this.loaded = false;
    this.spriteImages.clear();

    const loadImg = (url: string) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    };

    try {
      const promises: Promise<any>[] = [];
      
      // Load background
      if (manifest.background_url) {
        promises.push(
          loadImg(manifest.background_url).then(img => {
            this.bgImage = img;
          })
        );
      }

      // Load sprites
      for (const sprite of manifest.sprites) {
        promises.push(
          loadImg(sprite.url).then(img => {
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
  public draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    elements: { id: string; x: number; y: number; w: number; h: number; alpha?: number }[]
  ): void {
    if (!this.loaded) {
      // 资产未加载完毕时的占位符
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
      // 按比例拉伸覆盖整个区域，或者居中裁剪
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
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. 绘制每个切图 (Sprite)
    for (const el of elements) {
      const img = this.spriteImages.get(el.id);
      if (img) {
        ctx.save();
        if (el.alpha !== undefined) {
          ctx.globalAlpha = el.alpha;
        }
        
        // 简单增加一点下拉阴影以增加立体感
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        
        ctx.drawImage(img, el.x, el.y, el.w, el.h);
        ctx.restore();
      } else {
        // Fallback，如果没有找到图片，画一个占位方块
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.fillRect(el.x, el.y, el.w, el.h);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      }
    }
  }
}
