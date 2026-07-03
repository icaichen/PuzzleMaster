/**
 * PathFindingLayout.ts — 一笔画谜题布局 v2
 *
 * 核心改进：
 * 1. 去掉独立的插画面板 — 点阵星座图 = 视觉焦点
 * 2. 统一的羊皮纸页面容器
 * 3. 暖色调点阵 + 金线路径
 */

import type { PuzzleData } from '../../models/PuzzleData';
import type { PathPuzzleState } from '../../engines/PathEngine';
import type { IPuzzleLayout, PuzzleLayoutCallbacks, PuzzleRenderParams } from './IPuzzleLayout';
import { setupRender, teardownRender } from '../../renderer/PuzzleRenderer';
import { PathRenderer } from '../../renderer/PathRenderer';
import {
  createButtonRow, createHintPanel, createFeedback,
  createDivider, C,
} from './SharedComponents';

export class PathFindingLayout implements IPuzzleLayout {
  private wrapper!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private state: PathPuzzleState | null = null;
  private callbacks: PuzzleLayoutCallbacks | null = null;
  private submitted = false;
  private correctEl!: HTMLElement;
  private buttons!: ReturnType<typeof createButtonRow>;
  private hintPanel!: ReturnType<typeof createHintPanel>;

  private playerPath: number[] = [];
  private cellSize = 56;
  private ox = 0;
  private oy = 0;

  // Visual renderer
  private renderer = new PathRenderer();

  mount(container: HTMLElement): void {
    this.wrapper = document.createElement('div');
    Object.assign(this.wrapper.style, {
      display: 'flex', flexDirection: 'column', gap: '0',
      maxWidth: '480px', width: '100%', margin: '0 auto',
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
    this.submitted = false;

    const state = params.puzzle.initial_state as PathPuzzleState;
    this.state = state;
    this.playerPath = [state.startNode];

    const gs = state.gridSize;
    const maxW = Math.min(440, window.innerWidth - 48);
    this.cellSize = gs <= 4 ? 64 : gs <= 5 ? 56 : 48;
    const gridPx = gs * this.cellSize;
    const w = Math.min(maxW, gridPx + 40);

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

    const catEl = document.createElement('span');
    catEl.textContent = '✏️ 一笔画';
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
    picEl.textContent = '✦ ' + params.picarat + ' picarats';
    picEl.style.cssText =
      'font-size:0.7rem;font-weight:700;color:'+C.goldDim+
      ';font-family:var(--font-serif);white-space:nowrap;';

    header.appendChild(catEl);
    header.appendChild(titleEl);
    header.appendChild(picEl);
    this.wrapper.appendChild(header);

    // ── 故事剧情背景 ──
    if (params.puzzle.narrative_setup) {
      const narrativeBox = document.createElement('div');
      narrativeBox.textContent = params.puzzle.narrative_setup;
      Object.assign(narrativeBox.style, {
        padding: '8px 16px',
        fontSize: '0.8rem', lineHeight: '1.6', color: C.inkLight,
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        borderLeft: '3px solid ' + C.gold,
        margin: '8px 16px 4px 16px',
        borderRadius: '2px',
      });
      this.wrapper.appendChild(narrativeBox);
    }

    // ── 规则目标描述 ──
    const questionEl = document.createElement('div');
    questionEl.innerHTML = `<span style="color:${C.accent}; font-weight:700; font-family:var(--font-serif)">✦ 目标：</span>${params.puzzle.description}`;
    Object.assign(questionEl.style, {
      padding: '6px 16px 8px',
      fontSize: '0.85rem', lineHeight: '1.6', color: C.ink,
      fontFamily: 'var(--font-serif)', fontWeight: '600',
      borderBottom: '1px solid ' + C.border,
    });
    this.wrapper.appendChild(questionEl);

    // ── Canvas ──
    const canvasH = gridPx + 40;
    this.canvas = document.createElement('canvas');
    const scale = 2;
    this.canvas.width = w * scale;
    this.canvas.height = canvasH * scale;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = canvasH + 'px';
    this.canvas.style.display = 'block';
    this.canvas.style.cursor = 'pointer';
    this.ctx = this.canvas.getContext('2d')!;

    this.ox = Math.floor((w - gridPx) / 2);
    this.oy = 16;

    this.wrapper.appendChild(this.canvas);

    // ── 反馈 ──
    this.correctEl = createFeedback();
    this.wrapper.appendChild(this.correctEl);

    this.wrapper.appendChild(createDivider());

    // ── 按钮 ──
    this.buttons = createButtonRow();
    this.buttons.onSubmit(() => this.checkAnswer());
    this.buttons.onReset(() => {
      this.playerPath = [state.startNode];
      this.correctEl.textContent = '';
      this.submitted = false;
      this.draw();
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

    // ── 交互 ──
    this.canvas.addEventListener('click', e => this.handleClick(e));

    this.draw();
  }

  destroy(): void { this.wrapper?.remove(); }
  setCallbacks(cbs: PuzzleLayoutCallbacks): void { this.callbacks = cbs; }

  // ═══════════════════════════════════════════════════════
  //  DRAW
  // ═══════════════════════════════════════════════════════

  private draw(): void {
    if (!this.state) return;
    const ctx = this.ctx;
    const scale = 2;
    const rc = setupRender(ctx, this.canvas.width, this.canvas.height, scale);

    this.renderer.draw(ctx, rc.logicalW, rc.logicalH, {
      state: this.state,
      cellSize: this.cellSize,
      ox: this.ox,
      oy: this.oy,
      playerPath: this.playerPath,
      submitted: this.submitted,
      isCorrect: this.correctEl.style.color === C.success,
    });

    teardownRender(ctx);
  }

  // ═══════════════════════════════════════════════════════
  //  CLICK
  // ═══════════════════════════════════════════════════════

  private handleClick(e: MouseEvent): void {
    if (!this.state || this.submitted) return;
    const { gridSize } = this.state;
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / 2 / rect.width;
    const sy = this.canvas.height / 2 / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    const cs = this.cellSize;
    const ox = this.ox, oy = this.oy;
    const col = Math.round((mx - ox - cs / 2) / cs);
    const row = Math.round((my - oy - cs / 2) / cs);
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    const idx = row * gridSize + col;
    const cx = ox + col * cs + cs / 2;
    const cy = oy + row * cs + cs / 2;
    if (Math.hypot(mx - cx, my - cy) > cs * 0.45) return;

    // 撤回
    if (this.playerPath.length >= 2 && idx === this.playerPath[this.playerPath.length - 2]) {
      this.playerPath.pop();
      this.draw();
      return;
    }

    if (this.playerPath.includes(idx)) return;

    const last = this.playerPath[this.playerPath.length - 1];
    const lr = Math.floor(last / gridSize), lc = last % gridSize;
    if (Math.abs(row - lr) + Math.abs(col - lc) !== 1) return;

    this.playerPath.push(idx);
    this.draw();
  }

  // ═══════════════════════════════════════════════════════
  //  CHECK
  // ═══════════════════════════════════════════════════════

  private checkAnswer(): void {
    if (!this.state || this.submitted) return;
    this.submitted = true;
    const sol = this.state.solutionPath;
    const ply = this.playerPath;
    const correct = ply.length === sol.length && sol.every((v, i) => v === ply[i]);

    if (correct) {
      this.correctEl.textContent = '✦ 正确！完美路径！';
      this.correctEl.style.color = C.success;
      this.buttons.showNext();
      setTimeout(() => this.callbacks?.onWin(), 500);
    } else {
      this.correctEl.textContent = '✗ 路径不正确，请重试。';
      this.correctEl.style.color = C.error;
      this.submitted = false;
    }
    this.draw();
  }
}
