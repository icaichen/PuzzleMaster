/**
 * KlotskiView.ts — 华容道 Canvas 渲染视图
 *
 * 负责棋盘绘制、方块拖拽交互（鼠标 + 触屏）、滑动动画以及胜利特效。
 * 纯视图层，通过 onBlockMove 回调将玩家操作传递给控制器。
 */

import { Direction, KlotskiBlock, AssetManifest, VisualElement } from '../models/PuzzleData';
import { KlotskiModel } from '../models/KlotskiModel';
import { SceneRenderer } from '../renderer/SceneRenderer';

// ─── Constants ────────────────────────────────────────────────
const CELL_SIZE = 80;
const PADDING = 16;
const BLOCK_GAP = 2;
const CORNER_RADIUS = 4;
const EXIT_INDICATOR_HEIGHT = 20;

// ─── Colors ───────────────────────────────────────────────────
const BOARD_BG = '#1a1a2e';
const GRID_LINE = '#2a2a4a';
const BOARD_FRAME = '#3a3a5e';
const EXIT_COLOR = '#ff6b6b';

/** Block label mapping: blockId → Chinese character */
const BLOCK_LABELS: Record<string, string> = {
  'cao_cao':    '曹',
  'guan_yu':    '关',
  'zhang_fei':  '张',
  'zhao_yun':   '赵',
  'ma_chao':    '马',
  'huang_zhong': '黄',
  'zu1':        '卒',
  'zu2':        '卒',
  'zu3':        '卒',
  'zu4':        '卒',
};

/** Fallback labels by block type */
function getBlockLabel(block: KlotskiBlock): string {
  if (BLOCK_LABELS[block.id]) return BLOCK_LABELS[block.id];
  if (block.isTarget) return '曹';
  if (block.width === 2 && block.height === 1) return '关';
  if (block.width === 1 && block.height === 1) return '卒';
  // Vertical 1×2 blocks — derive from id
  const idLower = block.id.toLowerCase();
  if (idLower.includes('zhang')) return '张';
  if (idLower.includes('zhao'))  return '赵';
  if (idLower.includes('ma'))    return '马';
  if (idLower.includes('huang')) return '黄';
  return '将';
}

// ─── Animation state ──────────────────────────────────────────
interface AnimationState {
  blockId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
}

// ─── Drag state ───────────────────────────────────────────────
interface DragState {
  blockId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * KlotskiView — HTML5 Canvas 渲染视图
 *
 * Renders the Klotski board with premium dark visuals, handles mouse/touch
 * drag-to-move interaction, and provides smooth animation for block slides.
 */
export class KlotskiView {
  /** Callback fired when the player drags a block in a direction */
  onBlockMove: ((blockId: string, direction: Direction) => void) | null = null;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private model: KlotskiModel;
  private enabled = true;

  private selectedBlockId: string | null = null;
  private dragState: DragState | null = null;
  private animation: AnimationState | null = null;
  private animFrameId: number | null = null;

  // Layer 3 AI Asset rendering
  private sceneRenderer?: SceneRenderer;
  private assets?: AssetManifest;
  private visualElements?: VisualElement[];

  // Win celebration
  private winActive = false;
  private winStartTime = 0;
  private winFrameId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement, 
    model: KlotskiModel, 
    assets?: AssetManifest, 
    visualElements?: VisualElement[]
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.model = model;
    this.assets = assets;
    this.visualElements = visualElements;
    
    if (this.assets) {
      this.sceneRenderer = new SceneRenderer();
      this.sceneRenderer.loadAssets(this.assets).then(() => {
        this.render();
      });
    }

    this.resizeCanvas();
    this.bindEvents();
    this.render();
  }

  /**
   * Replace the model (e.g. on new game) and re-render.
   */
  setModel(model: KlotskiModel): void {
    this.model = model;
    this.selectedBlockId = null;
    this.dragState = null;
    this.winActive = false;
    if (this.winFrameId !== null) {
      cancelAnimationFrame(this.winFrameId);
      this.winFrameId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.animation = null;
    this.enabled = true;
    this.resizeCanvas();
    this.render();
  }

  /**
   * Enable or disable user input.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Trigger win celebration — golden glow animation on the target block.
   */
  showWin(): void {
    this.winActive = true;
    this.winStartTime = performance.now();
    this.enabled = false;
    this.animateWin();
  }

  // ─── Canvas sizing ──────────────────────────────────────────

  private resizeCanvas(): void {
    const w = PADDING * 2 + this.model.boardWidth * CELL_SIZE;
    const h = PADDING * 2 + this.model.boardHeight * CELL_SIZE + EXIT_INDICATOR_HEIGHT;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  // ─── Event binding ──────────────────────────────────────────

  private bindEvents(): void {
    // Mouse
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.offsetX, e.offsetY));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.offsetX, e.offsetY));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.onPointerDown(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.onPointerMove(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onPointerUp();
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => this.onPointerUp());
  }

  // ─── Pointer handling ───────────────────────────────────────

  /**
   * Convert canvas pixel coordinates to board cell coordinates.
   */
  private canvasToCell(px: number, py: number): { col: number; row: number } {
    const col = Math.floor((px - PADDING) / CELL_SIZE);
    const row = Math.floor((py - PADDING) / CELL_SIZE);
    return { col, row };
  }

  private onPointerDown(px: number, py: number): void {
    if (!this.enabled || this.animation) return;

    const { col, row } = this.canvasToCell(px, py);
    const block = this.model.getBlockAt(col, row);
    if (!block) {
      this.selectedBlockId = null;
      this.render();
      return;
    }

    this.selectedBlockId = block.id;
    this.dragState = {
      blockId: block.id,
      startX: px,
      startY: py,
      currentX: px,
      currentY: py,
    };
    this.render();
  }

  private onPointerMove(px: number, py: number): void {
    if (!this.enabled || !this.dragState) return;
    this.dragState.currentX = px;
    this.dragState.currentY = py;
  }

  private onPointerUp(): void {
    if (!this.enabled || !this.dragState) return;

    const drag = this.dragState;
    const dx = drag.currentX - drag.startX;
    const dy = drag.currentY - drag.startY;
    const threshold = CELL_SIZE / 3;

    this.dragState = null;

    // Determine direction from the largest delta component
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      let direction: Direction;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        direction = dy > 0 ? Direction.DOWN : Direction.UP;
      }

      // Calculate how many cells the user dragged
      const primaryDelta = Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);
      const cellsMoved = Math.max(1, Math.round(primaryDelta / CELL_SIZE));

      // Attempt multi-cell moves
      for (let i = 0; i < cellsMoved; i++) {
        if (this.onBlockMove) {
          this.onBlockMove(drag.blockId, direction);
        }
      }
    }

    this.selectedBlockId = null;
    this.render();
  }

  // ─── Animation ──────────────────────────────────────────────

  /**
   * Animate a block sliding from its current visual position to the new one.
   * Resolves when the animation completes.
   */
  animateMove(blockId: string, fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
    return new Promise((resolve) => {
      this.animation = {
        blockId,
        fromX,
        fromY,
        toX,
        toY,
        startTime: performance.now(),
        duration: 150,
      };
      this.enabled = false;

      const animate = (now: number) => {
        if (!this.animation) {
          this.enabled = true;
          resolve();
          return;
        }

        const elapsed = now - this.animation.startTime;
        const t = Math.min(1, elapsed / this.animation.duration);

        this.render(t);

        if (t < 1) {
          this.animFrameId = requestAnimationFrame(animate);
        } else {
          this.animation = null;
          this.animFrameId = null;
          this.enabled = true;
          this.render();
          resolve();
        }
      };

      this.animFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Win celebration loop — pulsing golden glow on target block.
   */
  private animateWin(): void {
    const draw = (now: number) => {
      if (!this.winActive) return;
      this.render(undefined, now);
      this.winFrameId = requestAnimationFrame(draw);
    };
    this.winFrameId = requestAnimationFrame(draw);
  }

  // ─── Rendering ──────────────────────────────────────────────

  /**
   * Full render pass.
   * @param animT — interpolation factor [0,1] during move animation
   * @param winNow — current timestamp during win animation
   */
  render(animT?: number, winNow?: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    if (this.sceneRenderer && this.assets && this.visualElements) {
       // --- LAYER 3 AI ASSET RENDER ---
       const elements: {id: string, x: number, y: number, w: number, h: number}[] = [];
       for (const block of this.model.blocks) {
         let drawX = PADDING + block.x * CELL_SIZE;
         let drawY = PADDING + block.y * CELL_SIZE;
         
         if (this.animation && this.animation.blockId === block.id && animT !== undefined) {
            const fromPx = PADDING + this.animation.fromX * CELL_SIZE;
            const fromPy = PADDING + this.animation.fromY * CELL_SIZE;
            const toPx = PADDING + this.animation.toX * CELL_SIZE;
            const toPy = PADDING + this.animation.toY * CELL_SIZE;
            const ease = 1 - Math.pow(1 - animT, 3);
            drawX = fromPx + (toPx - fromPx) * ease;
            drawY = fromPy + (toPy - fromPy) * ease;
         }

         let posType = '';
         if (block.isTarget) posType = 'target_block';
         else if (block.width === 1 && block.height === 2) posType = 'vertical_blocks';
         else if (block.width === 2 && block.height === 1) posType = 'horizontal_blocks';
         else if (block.width === 1 && block.height === 1) posType = 'small_blocks';

         const visualElem = this.visualElements.find(v => v.position === posType);
         if (visualElem) {
            // Apply slight gap logic if desired, or let the sprite take the whole cell
            elements.push({
               id: visualElem.id,
               x: drawX + BLOCK_GAP,
               y: drawY + BLOCK_GAP,
               w: block.width * CELL_SIZE - BLOCK_GAP * 2,
               h: block.height * CELL_SIZE - BLOCK_GAP * 2
            });
         }
       }
       this.sceneRenderer.draw(ctx, w, h, elements);
       
       // Selection highlight for AI Assets
       if (this.selectedBlockId) {
         const block = this.model.getBlockById(this.selectedBlockId);
         if (block) {
           ctx.save();
           ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
           this.roundRect(PADDING + block.x * CELL_SIZE + BLOCK_GAP, PADDING + block.y * CELL_SIZE + BLOCK_GAP, block.width * CELL_SIZE - BLOCK_GAP * 2, block.height * CELL_SIZE - BLOCK_GAP * 2, CORNER_RADIUS);
           ctx.fill();
           ctx.restore();
         }
       }
       return;
    }

    // Board background
    ctx.fillStyle = BOARD_BG;
    this.roundRect(
      PADDING - 4, PADDING - 4,
      this.model.boardWidth * CELL_SIZE + 8,
      this.model.boardHeight * CELL_SIZE + 8,
      8
    );
    ctx.fill();

    // Board frame
    ctx.strokeStyle = BOARD_FRAME;
    ctx.lineWidth = 3;
    this.drawBoardFrame();

    // Grid lines
    this.drawGrid();

    // Exit indicator
    this.drawExitIndicator();

    // Blocks
    for (const block of this.model.blocks) {
      let drawX = PADDING + block.x * CELL_SIZE;
      let drawY = PADDING + block.y * CELL_SIZE;

      // Animation interpolation
      if (this.animation && this.animation.blockId === block.id && animT !== undefined) {
        const fromPx = PADDING + this.animation.fromX * CELL_SIZE;
        const fromPy = PADDING + this.animation.fromY * CELL_SIZE;
        const toPx = PADDING + this.animation.toX * CELL_SIZE;
        const toPy = PADDING + this.animation.toY * CELL_SIZE;
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - animT, 3);
        drawX = fromPx + (toPx - fromPx) * ease;
        drawY = fromPy + (toPy - fromPy) * ease;
      }

      this.drawBlock(block, drawX, drawY, winNow);
    }
  }

  /**
   * Draw the board frame with a gap at the bottom center for the exit.
   */
  private drawBoardFrame(): void {
    const ctx = this.ctx;
    const bx = PADDING - 4;
    const by = PADDING - 4;
    const bw = this.model.boardWidth * CELL_SIZE + 8;
    const bh = this.model.boardHeight * CELL_SIZE + 8;

    // Exit gap: columns 1-2 at the bottom → pixel range for gap
    const exitLeft = PADDING + 1 * CELL_SIZE - 4;
    const exitRight = PADDING + 3 * CELL_SIZE + 4;

    ctx.beginPath();
    // Top
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + bw, by);
    // Right
    ctx.lineTo(bx + bw, by + bh);
    // Bottom — with gap
    ctx.lineTo(exitRight, by + bh);
    ctx.moveTo(exitLeft, by + bh);
    ctx.lineTo(bx, by + bh);
    // Left
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  /**
   * Draw subtle grid lines.
   */
  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;

    for (let col = 1; col < this.model.boardWidth; col++) {
      const x = PADDING + col * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + this.model.boardHeight * CELL_SIZE);
      ctx.stroke();
    }
    for (let row = 1; row < this.model.boardHeight; row++) {
      const y = PADDING + row * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + this.model.boardWidth * CELL_SIZE, y);
      ctx.stroke();
    }
  }

  /**
   * Draw exit indicator — glowing arrow/opening at bottom center.
   */
  private drawExitIndicator(): void {
    const ctx = this.ctx;
    const exitLeft = PADDING + 1 * CELL_SIZE;
    const exitRight = PADDING + 3 * CELL_SIZE;
    const exitTop = PADDING + this.model.boardHeight * CELL_SIZE;
    const exitCenterX = (exitLeft + exitRight) / 2;

    // Glow
    ctx.save();
    ctx.shadowColor = EXIT_COLOR;
    ctx.shadowBlur = 12;

    // Downward arrow
    ctx.fillStyle = EXIT_COLOR;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(exitCenterX - 12, exitTop + 4);
    ctx.lineTo(exitCenterX + 12, exitTop + 4);
    ctx.lineTo(exitCenterX, exitTop + 16);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.globalAlpha = 0.5;
    ctx.font = `bold 10px 'Noto Sans SC', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('EXIT', exitCenterX, exitTop + 4);

    ctx.restore();
  }

  /**
   * Draw a single block with its styling, shadow, and label.
   */
  private drawBlock(block: KlotskiBlock, px: number, py: number, winNow?: number): void {
    const ctx = this.ctx;
    const w = block.width * CELL_SIZE - BLOCK_GAP * 2;
    const h = block.height * CELL_SIZE - BLOCK_GAP * 2;
    const x = px + BLOCK_GAP;
    const y = py + BLOCK_GAP;

    ctx.save();

    // Drop shadow
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';

    // Selected highlight
    const isSelected = this.selectedBlockId === block.id;

    // Win glow on target block
    if (this.winActive && block.isTarget && winNow !== undefined) {
      const elapsed = winNow - this.winStartTime;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed / 300);
      ctx.shadowColor = `rgba(255, 215, 0, ${0.4 + pulse * 0.6})`;
      ctx.shadowBlur = 12 + pulse * 20;
    }

    // Fill color / gradient
    if (block.isTarget) {
      // Target block (曹操) — crimson gradient
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, '#c0392b');
      grad.addColorStop(1, '#e74c3c');
      ctx.fillStyle = grad;
    } else if (block.width === 2 && block.height === 1) {
      // Horizontal medium (关羽) — emerald green
      ctx.fillStyle = '#27ae60';
    } else if (block.width === 1 && block.height === 2) {
      // Vertical medium — steel blue
      ctx.fillStyle = '#2980b9';
    } else if (block.width === 1 && block.height === 1) {
      // Small block (卒) — amber
      ctx.fillStyle = '#f39c12';
    } else {
      // Fallback
      ctx.fillStyle = '#7f8c8d';
    }

    // Draw rounded rectangle
    this.roundRect(x, y, w, h, CORNER_RADIUS);
    ctx.fill();

    // Selection overlay
    if (isSelected) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      this.roundRect(x, y, w, h, CORNER_RADIUS);
      ctx.fill();
    }

    // Inner subtle highlight (top edge)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + CORNER_RADIUS, y + 1);
    ctx.lineTo(x + w - CORNER_RADIUS, y + 1);
    ctx.stroke();

    // Reset shadow for text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Character label
    const label = getBlockLabel(block);
    const fontSize = Math.min(w, h) * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px 'Noto Sans SC', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);

    ctx.restore();
  }

  // ─── Utility ────────────────────────────────────────────────

  /**
   * Draw a rounded rectangle path (does NOT stroke or fill).
   */
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
