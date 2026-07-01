/**
 * TangramLayout.ts — 拼图谜题布局 v2
 *
 * 核心改进：
 * 1. 真正的拖拽交互 (mousedown/mousemove/mouseup)
 * 2. 碎片散落在目标形状周围同一 canvas 上 — 没有独立托盘
 * 3. 拖拽时 ghost 跟随光标
 * 4. 放入有效位置自动吸附
 * 5. 统一的羊皮纸页面容器
 */

import type { PuzzleData } from '../../models/PuzzleData';
import type { TangramState, PieceDef, PlacedPiece } from '../../engines/TangramEngine';
import type { IPuzzleLayout, PuzzleLayoutCallbacks, PuzzleRenderParams } from './IPuzzleLayout';
import { setupRender, teardownRender } from '../../renderer/PuzzleRenderer';
import { TangramRenderer } from '../../renderer/TangramRenderer';
import {
  createButtonRow, createHintPanel, createFeedback,
  createDivider, C,
} from './SharedComponents';

export class TangramLayout implements IPuzzleLayout {
  private wrapper!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private state: TangramState | null = null;
  private callbacks: PuzzleLayoutCallbacks | null = null;
  private submitted = false;
  private correctEl!: HTMLElement;
  private buttons!: ReturnType<typeof createButtonRow>;
  private hintPanel!: ReturnType<typeof createHintPanel>;

  // Sizing
  private cellSize = 40;
  private gridOx = 0;
  private gridOy = 0;

  // Piece state
  private placedPieces: PlacedPiece[] = [];
  private unplacedPieces: { piece: PieceDef; rotation: number; flipped: boolean; trayX: number; trayY: number; trayW: number; trayH: number }[] = [];

  // Dragging state
  private dragging: {
    pieceIdx: number;
    offsetX: number;
    offsetY: number;
    ghostX: number;
    ghostY: number;
    cells: [number, number][];
  } | null = null;

  private hoveredCell: [number, number] | null = null;

  // Visual renderer
  private renderer = new TangramRenderer();

  mount(container: HTMLElement): void {
    this.wrapper = document.createElement('div');
    Object.assign(this.wrapper.style, {
      display: 'flex', flexDirection: 'column', gap: '0',
      maxWidth: '520px', width: '100%', margin: '0 auto',
      fontFamily: 'inherit',
      background: C.parchment,
      borderRadius: '10px',
      border: '1px solid ' + C.border,
      boxShadow: '0 4px 24px rgba(60,30,10,0.1)',
      overflow: 'hidden',
    });
    container.appendChild(this.wrapper);
  }

  render(params: PuzzleRenderParams): void {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = '';

    const state = params.puzzle.initial_state as TangramState;
    this.state = state;
    this.submitted = false;
    this.placedPieces = [];
    this.dragging = null;
    this.hoveredCell = null;

    const maxW = Math.min(480, window.innerWidth - 48);

    // ── 顶部装饰线 ──
    const topOrnament = document.createElement('div');
    topOrnament.style.cssText = 'height:3px;background:linear-gradient(90deg,'+C.goldDim+','+C.gold+','+C.goldDim+');';
    this.wrapper.appendChild(topOrnament);

    // ── 标题栏 ──
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px 4px', gap: '8px',
    });

    const puzzleNumEl = document.createElement('span');
    puzzleNumEl.style.cssText = 'font-size:0.7rem;color:'+C.muted+';font-family:var(--font-serif);';

    const catEl = document.createElement('span');
    catEl.textContent = '🧩 七巧板';
    catEl.style.cssText =
      'font-size:0.66rem;color:'+C.goldDim+';background:'+C.parchmentDark+
      ';padding:2px 8px;border-radius:10px;border:1px solid '+C.border+
      ';font-family:var(--font-serif);';

    const titleEl = document.createElement('span');
    titleEl.textContent = params.puzzle.title;
    Object.assign(titleEl.style, {
      fontSize: '0.85rem', fontWeight: '700', color: C.ink,
      fontFamily: 'var(--font-serif)', textAlign: 'center', flex: '1',
    });

    const picEl = document.createElement('span');
    picEl.textContent = '✦ ' + state.picarat + ' picarats';
    picEl.style.cssText =
      'font-size:0.7rem;font-weight:700;color:'+C.goldDim+
      ';font-family:var(--font-serif);white-space:nowrap;';

    header.appendChild(puzzleNumEl);
    header.appendChild(catEl);
    header.appendChild(titleEl);
    header.appendChild(picEl);
    this.wrapper.appendChild(header);

    // ── 问题描述 ──
    const questionEl = document.createElement('div');
    questionEl.textContent = params.puzzle.description;
    Object.assign(questionEl.style, {
      padding: '8px 16px 8px',
      fontSize: '0.8rem', lineHeight: '1.6', color: C.inkLight,
      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
      borderBottom: '1px solid ' + C.border,
    });
    this.wrapper.appendChild(questionEl);

    // ── Canvas (谜题区 + 碎片区) ──
    const gs = state.gridSize;
    this.cellSize = gs <= 4 ? 48 : gs <= 5 ? 42 : 36;
    const gridPx = gs * this.cellSize + 8;
    const trayH = Math.ceil(state.pieces.length / 4) * (this.cellSize * 2 + 20) + 24;
    const canvasW = Math.max(maxW, gridPx + 220);
    const canvasH = gridPx + trayH + 80;

    this.gridOx = 16;
    this.gridOy = 14;

    this.canvas = document.createElement('canvas');
    const scale = 2;
    this.canvas.width = canvasW * scale;
    this.canvas.height = canvasH * scale;
    this.canvas.style.width = canvasW + 'px';
    this.canvas.style.height = canvasH + 'px';
    this.canvas.style.display = 'block';
    this.canvas.style.cursor = 'grab';
    this.ctx = this.canvas.getContext('2d')!;
    this.wrapper.appendChild(this.canvas);

    // ── 计算碎片初始位置 ──
    this.unplacedPieces = [];
    const trayY = this.gridOy + gridPx + 28;
    let tx = this.gridOx;
    let ty = trayY;
    const maxTx = canvasW - 40;

    for (let i = 0; i < state.pieces.length; i++) {
      const p = state.pieces[i];
      const bb = this.getBoundingBox(p.cells);
      const pw = (bb.maxC - bb.minC + 1) * this.cellSize + 12;
      const ph = (bb.maxR - bb.minR + 1) * this.cellSize + 12;

      if (tx + pw > maxTx) {
        tx = this.gridOx;
        ty += this.cellSize * 2 + 16;
      }

      this.unplacedPieces.push({
        piece: p, rotation: 0, flipped: false,
        trayX: tx, trayY: ty, trayW: pw, trayH: ph,
      });
      tx += pw + 12;
    }

    // ── 反馈 ──
    this.correctEl = createFeedback();
    this.wrapper.appendChild(this.correctEl);

    this.wrapper.appendChild(createDivider());

    // ── 按钮 ──
    this.buttons = createButtonRow();
    this.buttons.onSubmit(() => this.checkAnswer());
    this.buttons.onReset(() => {
      this.placedPieces = [];
      this.dragging = null;
      this.hoveredCell = null;
      this.correctEl.textContent = '';
      this.submitted = false;
      this.canvas.style.cursor = 'grab';
    });
    this.buttons.onNext(() => this.callbacks?.onNext());
    this.buttons.onHint(() => {
      const revealed = this.hintPanel.reveal();
      this.buttons.setHintCoins(this.hintPanel.coinsRemaining());
    });
    this.wrapper.appendChild(this.buttons.el);

    // ── 提示 ──
    this.hintPanel = createHintPanel(params.puzzle.hints, 3);
    this.wrapper.appendChild(this.hintPanel.el);

    // ── 键盘交互 ──
    document.addEventListener('keydown', this._keyHandler = (e: KeyboardEvent) => {
      if (this.submitted) return;
      if (e.key === 'r' || e.key === 'R') {
        if (this.dragging) {
          this.dragging.pieceIdx = this.dragging.pieceIdx;
          // Apply rotation to dragging cells
          const cells = this.dragging.cells;
          const maxC = Math.max(...cells.map(c => c[1]));
          this.dragging.cells = cells.map(([r, c]) => [c, maxC - r]);
        }
      }
    });

    // ── 鼠标交互 ──
    this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

    // Touch support
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      this.onMouseDown(t as any);
    });
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      this.onMouseMove(t as any);
    });
    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      this.onMouseUp();
    });

    this.draw();
  }

  destroy(): void {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    this.wrapper?.remove();
  }
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;

  setCallbacks(cbs: PuzzleLayoutCallbacks): void { this.callbacks = cbs; }

  // ═══════════════════════════════════════════════════════
  //  DRAWING
  // ═══════════════════════════════════════════════════════

  private draw(): void {
    if (!this.state) return;
    const ctx = this.ctx;
    const scale = 2;
    const rc = setupRender(ctx, this.canvas.width, this.canvas.height, scale);

    this.renderer.draw(ctx, rc.logicalW, rc.logicalH, {
      state: this.state,
      cellSize: this.cellSize,
      gridOx: this.gridOx,
      gridOy: this.gridOy,
      placedPieces: this.placedPieces,
      unplacedPieces: this.unplacedPieces,
      dragging: this.dragging,
      hoveredCell: this.hoveredCell,
    });

    teardownRender(ctx);
  }

  // ═══════════════════════════════════════════════════════
  //  MOUSE HANDLING
  // ═══════════════════════════════════════════════════════

  private getCoords(e: MouseEvent | Touch): { mx: number; my: number } {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / 2 / rect.width;
    const sy = this.canvas.height / 2 / rect.height;
    return {
      mx: (e.clientX - rect.left) * sx,
      my: (e.clientY - rect.top) * sy,
    };
  }

  private onMouseDown(e: MouseEvent | Touch): void {
    if (!this.state || this.submitted) return;
    const { mx, my } = this.getCoords(e);
    const cs = this.cellSize;
    const ox = this.gridOx;
    const oy = this.gridOy;

    // ── 检查是否点击了已放置的碎片（取出） ──
    for (let i = this.placedPieces.length - 1; i >= 0; i--) {
      const pp = this.placedPieces[i];
      for (const [r, c] of pp.cells) {
        const x = ox + c * cs, y = oy + r * cs;
        if (mx >= x && mx <= x + cs && my >= y && my <= y + cs) {
          // 取出碎片，放回托盘
          const piece = this.state.pieces.find(p => p.id === pp.pieceId);
          if (piece) {
            this.placedPieces.splice(i, 1);
            // 重新添加到未放置列表
            const bb = this.getBoundingBox(piece.cells);
            const pw = (bb.maxC - bb.minC + 1) * cs + 12;
            const ph = (bb.maxR - bb.minR + 1) * cs + 12;
            // 放在鼠标位置附近
            const trayIdx = this.unplacedPieces.length;
            this.unplacedPieces.push({
              piece, rotation: pp.rotation, flipped: pp.flipped,
              trayX: mx / 2 - pw / 2, trayY: Math.max(oy + this.state.gridSize * cs + 32, my / 2 - ph / 2),
              trayW: pw, trayH: ph,
            });
          }
          this.draw();
          return;
        }
      }
    }

    // ── 检查是否点击了未放置碎片（开始拖拽） ──
    for (let i = 0; i < this.unplacedPieces.length; i++) {
      const up = this.unplacedPieces[i];
      if (mx >= up.trayX && mx <= up.trayX + up.trayW &&
          my >= up.trayY && my <= up.trayY + up.trayH) {
        const cells = this.transformCells(up.piece.cells, up.rotation, up.flipped);
        const bb = this.getBoundingBox(cells);
        const offsetX = mx / 2 - up.trayX;
        const offsetY = my / 2 - up.trayY;

        this.dragging = {
          pieceIdx: i,
          offsetX: offsetX + (up.trayX - (ox + bb.minC * cs)),
          offsetY: offsetY + (up.trayY - (oy + bb.minR * cs)),
          ghostX: mx / 2,
          ghostY: my / 2,
          cells,
        };

        this.unplacedPieces.splice(i, 1);
        this.canvas.style.cursor = 'grabbing';
        this.draw();
        return;
      }
    }
  }

  private onMouseMove(e: MouseEvent | Touch): void {
    if (!this.dragging || !this.state) return;
    const { mx, my } = this.getCoords(e);
    const cs = this.cellSize;
    const ox = this.gridOx;
    const oy = this.gridOy;
    const gridSize = this.state.gridSize;

    this.dragging.ghostX = mx / 2;
    this.dragging.ghostY = my / 2;

    // Check if ghost is over the grid
    const cells = this.dragging.cells;
    const bb = this.getBoundingBox(cells);
    const anchorX = mx / 2 - this.dragging.offsetX;
    const anchorY = my / 2 - this.dragging.offsetY;

    const gc = Math.round((anchorX - ox) / cs);
    const gr = Math.round((anchorY - oy) / cs);

    if (gr >= 0 && gr < gridSize && gc >= 0 && gc < gridSize) {
      this.hoveredCell = [gr, gc];
    } else {
      this.hoveredCell = null;
    }

    this.draw();
  }

  private onMouseUp(): void {
    if (!this.dragging || !this.state) {
      this.canvas.style.cursor = 'grab';
      return;
    }

    const { pieceIdx, cells } = this.dragging;

    if (this.hoveredCell) {
      const [gr, gc] = this.hoveredCell;
      const offsetCells = this.offsetCells(cells, gr, gc);

      if (this.canPlace(offsetCells)) {
        // 放置成功
        const up = this.dragging;
        const piece = this.state!.pieces.find((_, i) => i === pieceIdx)!;
        this.placedPieces.push({
          pieceId: piece.id,
          cells: offsetCells,
          rotation: 0,
          flipped: false,
        });
        this.dragging = null;
        this.hoveredCell = null;
        this.canvas.style.cursor = 'grab';

        // 自动检测完成
        if (this.placedPieces.length === this.state.pieces.length && this.checkPiecesMatch()) {
          this.submitted = true;
          this.correctEl.textContent = '✦ 正确！拼图完美！';
          this.correctEl.style.color = C.success;
          this.buttons.showNext();
          setTimeout(() => this.callbacks?.onWin(), 600);
        }
        this.draw();
        return;
      }
    }

    // 拖拽取消，放回托盘
    const piece = this.state.pieces[pieceIdx];
    const bb = this.getBoundingBox(piece.cells);
    const cs = this.cellSize;
    const pw = (bb.maxC - bb.minC + 1) * cs + 12;
    const ph = (bb.maxR - bb.minR + 1) * cs + 12;

    this.unplacedPieces.push({
      piece, rotation: 0, flipped: false,
      trayX: Math.max(0, Math.min(this.canvas.width / 4 - pw, this.gridOx + 200)),
      trayY: this.gridOy + this.state.gridSize * cs + 36,
      trayW: pw, trayH: ph,
    });

    this.dragging = null;
    this.hoveredCell = null;
    this.canvas.style.cursor = 'grab';
    this.draw();
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════

  private getBoundingBox(cells: [number, number][]): { minR: number; maxR: number; minC: number; maxC: number } {
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [r, c] of cells) {
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
    return { minR, maxR, minC, maxC };
  }

  private transformCells(cells: [number, number][], rotation: number, flipped: boolean): [number, number][] {
    let result = [...cells];
    if (flipped) {
      const maxC = Math.max(...result.map(c => c[1]));
      result = result.map(([r, c]) => [r, maxC - c]);
    }
    for (let rot = 0; rot < rotation; rot++) {
      const maxC = Math.max(...result.map(c => c[1]));
      result = result.map(([r, c]) => [c, maxC - r]);
    }
    return result;
  }

  private offsetCells(cells: [number, number][], gr: number, gc: number): [number, number][] {
    const bb = this.getBoundingBox(cells);
    return cells.map(([r, c]) => [r - bb.minR + gr, c - bb.minC + gc]);
  }

  private canPlace(cells: [number, number][]): boolean {
    if (!this.state) return false;
    const { targetCells, gridSize } = this.state;
    const targetSet = new Set(targetCells.map(([r, c]) => `${r},${c}`));
    const placedSet = new Set<string>();
    for (const pp of this.placedPieces) {
      for (const [r, c] of pp.cells) placedSet.add(`${r},${c}`);
    }
    for (const [r, c] of cells) {
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
      if (!targetSet.has(`${r},${c}`)) return false;
      if (placedSet.has(`${r},${c}`)) return false;
    }
    return true;
  }

  private checkPiecesMatch(): boolean {
    if (!this.state) return false;
    const target = new Set(this.state.targetCells.map(([r, c]) => `${r},${c}`));
    const placed = new Set<string>();
    for (const pp of this.placedPieces) {
      for (const [r, c] of pp.cells) {
        const key = `${r},${c}`;
        if (placed.has(key) || !target.has(key)) return false;
        placed.add(key);
      }
    }
    return placed.size === target.size;
  }

  private checkAnswer(): void {
    if (this.submitted) return;
    this.submitted = true;
    const correct = this.checkPiecesMatch();
    if (correct) {
      this.correctEl.textContent = '✦ 正确！拼图完美！';
      this.correctEl.style.color = C.success;
      this.buttons.showNext();
      setTimeout(() => this.callbacks?.onWin(), 500);
    } else {
      this.correctEl.textContent = '✗ 还差一点，碎片没有完全覆盖目标形状。点击碎片可取出重试。';
      this.correctEl.style.color = C.error;
      this.submitted = false;
    }
  }
}
