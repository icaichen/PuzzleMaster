/**
 * VisualPuzzleView.ts — Canvas-based visual puzzle renderer
 *
 * Renders interactive visual puzzles with storybook-style illustrations:
 * - PATH_FINDING: dot grid with traceable path
 * - NUMBER_GRID: Futoshiki grid with clickable cells
 * - TANGRAM: polyomino assembly — with full story illustration
 */

import { PuzzleType, PUZZLE_TYPE_LABELS, AssetManifest, VisualElement } from '../models/PuzzleData';
import type { PathPuzzleState } from '../engines/PathEngine';
import type { NumberGridState } from '../engines/NumberGridEngine';
import type { TangramState, PieceDef, PlacedPiece } from '../engines/TangramEngine';
import { SceneRenderer } from '../renderer/SceneRenderer';

type VisualMode = 'path_finding' | 'number_grid' | 'tangram' | 'sliding_block';

export class VisualPuzzleView {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private container: HTMLElement;

  private onWinCb?: () => void;
  private onNextCb?: () => void;
  private onHintCb?: () => void;

  private mode: VisualMode = 'path_finding';
  private pathState: PathPuzzleState | null = null;
  private numState: NumberGridState | null = null;
  private tangramState: TangramState | null = null;
  private title = '';
  private scenario = '';
  private hints: string[] = [];
  private picarat = 10;
  private puzzleType: PuzzleType = PuzzleType.PATH_FINDING;
  private pieceCount = 0;

  private cellSize = 56;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private playerPath: number[] = [];
  private selectedCell: [number, number] | null = null;
  private playerGrid: number[][] = [];
  private submitted = false;
  private correct = false;
  private hintRevealed = 0;
  private hintCoins = 3;
  private feedbackMsg = '';
  private feedbackColor = '';
  private placedPieces: PlacedPiece[] = [];
  private selectedPieceIdx: number = -1;
  private selectedPieceRotation = 0;
  private selectedPieceFlipped = false;
  private ghostCells: [number, number][] = [];
  private ghostValid = false;

  // -- Scene Renderer (Layer 3) --
  private assets?: AssetManifest;
  private visualElements?: VisualElement[];
  private sceneRenderer?: SceneRenderer;

  // Layout computed after resize
  private illoH = 0;
  private canvasW = 0;
  private canvasH = 0;

  // Palette — warm storybook tones
  private readonly P = {
    bg: '#1a1428',
    bgGradTop: '#1e1635',
    bgGradBot: '#13101e',
    warmLight: '#fff5e6',
    warmMid: '#f5d6b8',
    warmDark: '#8b6914',
    wood: '#6b4226',
    woodLight: '#a0724a',
    woodPale: '#d4a574',
    curtainRed: '#8b2252',
    curtainRedLight: '#c44d7a',
    gold: '#ffd700',
    goldLight: '#ffe566',
    goldPale: 'rgba(255,215,0,0.15)',
    candle: '#ffae42',
    candleGlow: 'rgba(255,174,66,0.25)',
    candleGlowOuter: 'rgba(255,174,66,0.08)',
    skin: '#f5d0a9',
    skinShadow: '#d4a574',
    hairWhite: '#e8e0d8',
    hairWhiteShadow: '#c8bfb5',
    dress: '#4a6fa5',
    dressLight: '#6b8fc5',
    apron: '#f0e8d8',
    swanColor: '#e8e0d0',
    swanOutline: 'rgba(255,255,255,0.5)',
    dotGreen: '#4CAF50',
    dotRed: '#ff6b6b',
    textPrimary: '#e8e8f0',
    textMuted: '#8888aa',
    accent: '#6c3ce0',
    accentLight: '#8b5cf6',
    win: '#4CAF50',
    error: '#ff4444',
    gridBg: 'rgba(255,255,255,0.015)',
    gridLine: 'rgba(255,255,255,0.06)',
    cellEmpty: 'rgba(255,255,255,0.03)',
    cellClue: 'rgba(255,255,255,0.06)',
    cellSelected: 'rgba(108,60,224,0.25)',
    cellWrong: 'rgba(255,68,68,0.12)',
    tangramTarget: 'rgba(255,255,255,0.04)',
    tangramTargetBorder: 'rgba(255,215,0,0.2)',
    tangramPlaced: 'rgba(108,60,224,0.35)',
    tangramPlacedBorder: 'rgba(108,60,224,0.5)',
    tangramPieceBg: 'rgba(255,255,255,0.04)',
    tangramPieceBorder: 'rgba(255,255,255,0.12)',
    tangramSelected: 'rgba(255,215,0,0.35)',
    tangramGhost: 'rgba(255,255,255,0.2)',
    tangramGhostInvalid: 'rgba(255,68,68,0.3)',
  };

  constructor(container: HTMLElement) {
    this.container = container;
  }

  // ─── Public API ──────────────────────────────────────────

  setup(params: {
    mode: VisualMode;
    state: unknown;
    title: string;
    description: string;
    hints: string[];
    picarat: number;
    puzzleType: PuzzleType;
    assets?: AssetManifest;
    visualElements?: VisualElement[];
  }): void {
    this.mode = params.mode;
    this.title = params.title;
    this.scenario = params.description;
    this.hints = params.hints;
    this.picarat = params.picarat;
    this.puzzleType = params.puzzleType;
    this.submitted = false;
    this.correct = false;
    this.hintRevealed = 0;
    this.hintCoins = 3;
    this.feedbackMsg = '';
    this.playerPath = [];
    this.selectedCell = null;
    this.placedPieces = [];
    this.selectedPieceIdx = -1;
    this.selectedPieceRotation = 0;
    this.selectedPieceFlipped = false;
    this.ghostCells = [];

    this.assets = params.assets;
    this.visualElements = params.visualElements;

    if (this.assets) {
      this.sceneRenderer = new SceneRenderer();
      this.sceneRenderer.loadAssets(this.assets).then(() => {
        this.drawCanvas();
      });
    } else {
      this.sceneRenderer = undefined;
    }

    if (this.mode === 'path_finding') {
      this.pathState = params.state as PathPuzzleState;
      this.playerPath = [this.pathState.startNode];
      this.cellSize = this.pathState.gridSize <= 4 ? 60 : this.pathState.gridSize <= 5 ? 52 : 44;
    } else if (this.mode === 'number_grid') {
      this.numState = params.state as NumberGridState;
      this.playerGrid = this.numState.grid.map(r => [...r]);
      this.cellSize = this.numState.size <= 3 ? 68 : this.numState.size <= 4 ? 56 : 46;
    } else if (this.mode === 'tangram') {
      this.tangramState = params.state as TangramState;
      if (this.tangramState) this.pieceCount = this.tangramState.pieceCount;
      this.cellSize = this.tangramState && this.tangramState.gridSize <= 5 ? 48 : 38;
    }
  }

  onWin(cb: () => void): void { this.onWinCb = cb; }
  onNext(cb: () => void): void { this.onNextCb = cb; }
  onHint(cb: () => void): void { this.onHintCb = cb; }

  render(): void {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      display: 'flex', flexDirection: 'column', gap: '12px',
      padding: '0', maxWidth: '520px', width: '100%', margin: '0 auto',
      fontFamily: 'var(--font)',
    });

    // Header bar
    wrapper.appendChild(this.buildHeader());

    // Canvas (illustration + puzzle)
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.borderRadius = '10px';
    this.canvas.style.boxShadow = '0 2px 24px rgba(0,0,0,0.5)';
    this.canvas.style.cursor = this.mode === 'tangram' ? 'crosshair' : 'pointer';
    wrapper.appendChild(this.canvas);

    // Feedback
    const feedback = document.createElement('div');
    feedback.id = 'visual-feedback';
    Object.assign(feedback.style, {
      textAlign: 'center', fontSize: '0.9rem', minHeight: '24px', fontWeight: '600',
    });
    wrapper.appendChild(feedback);

    // Buttons
    wrapper.appendChild(this.buildButtons());

    // Hint area
    wrapper.appendChild(this.buildHintArea());

    // Answer reveal
    const answerBox = document.createElement('div');
    answerBox.id = 'visual-answer';
    answerBox.style.display = 'none';
    wrapper.appendChild(answerBox);
    if (this.submitted) this.buildAnswerReveal(answerBox);

    this.container.appendChild(wrapper);

    this.resizeCanvas();
    this.drawCanvas();
    this.canvas.addEventListener('click', e => this.handleClick(e));
    window.addEventListener('resize', () => { this.resizeCanvas(); this.drawCanvas(); });
  }

  // ─── Header ──────────────────────────────────────────────

  private buildHeader(): HTMLElement {
    const h = document.createElement('div');
    Object.assign(h.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 8px',
    });

    const cat = document.createElement('span');
    cat.textContent = PUZZLE_TYPE_LABELS[this.puzzleType];
    Object.assign(cat.style, {
      fontSize: '0.7rem', color: this.P.textMuted,
      background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.06)',
    });

    const titleEl = document.createElement('span');
    titleEl.textContent = this.title;
    Object.assign(titleEl.style, {
      fontSize: '0.9rem', fontWeight: '700', color: this.P.gold,
      fontFamily: 'Georgia, serif',
    });

    const pic = document.createElement('span');
    pic.innerHTML = '✦ ' + this.picarat + ' picarats';
    Object.assign(pic.style, {
      fontSize: '0.72rem', fontWeight: '700', color: this.P.gold,
      background: this.P.goldPale, padding: '3px 8px', borderRadius: '10px',
      border: '1px solid rgba(255,215,0,0.15)',
    });

    h.appendChild(cat);
    h.appendChild(titleEl);
    h.appendChild(pic);
    return h;
  }

  // ─── Buttons ─────────────────────────────────────────────

  private buildButtons(): HTMLElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap',
    });

    if (!this.submitted) {
      const submitBtn = this.makeButton('✓ 提交答案', this.P.win);
      submitBtn.addEventListener('click', () => this.checkAnswer());
      row.appendChild(submitBtn);

      const resetBtn = this.makeButton('↺ 重置', '#888');
      resetBtn.addEventListener('click', () => {
        if (this.mode === 'path_finding' && this.pathState) {
          this.playerPath = [this.pathState.startNode];
        } else if (this.mode === 'number_grid' && this.numState) {
          this.playerGrid = this.numState.grid.map(r => [...r]);
          this.selectedCell = null;
        } else if (this.mode === 'tangram') {
          this.placedPieces = [];
          this.selectedPieceIdx = -1;
          this.ghostCells = [];
        }
        this.feedbackMsg = '';
        this.drawCanvas();
        this.updateFeedback();
      });
      row.appendChild(resetBtn);
    } else {
      const nextBtn = this.makeButton('→ 下一题', this.P.accent);
      nextBtn.addEventListener('click', () => this.onNextCb?.());
      row.appendChild(nextBtn);
    }

    return row;
  }

  private makeButton(text: string, color: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    Object.assign(btn.style, {
      padding: '10px 20px', borderRadius: '8px', border: 'none',
      background: color, color: '#fff', fontSize: '0.85rem',
      fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font)',
      transition: 'all 0.15s ease',
    });
    btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(1.15)'; });
    btn.addEventListener('mouseleave', () => { btn.style.filter = ''; });
    return btn;
  }

  // ─── Hint area ───────────────────────────────────────────

  private buildHintArea(): HTMLElement {
    const area = document.createElement('div');
    Object.assign(area.style, {
      borderTop: '1px solid rgba(255,255,255,0.06)',
      paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    });

    const label = document.createElement('span');
    label.textContent = '💡 提示币: ' + this.hintCoins;
    Object.assign(label.style, {
      fontSize: '0.78rem', color: this.P.textMuted, fontWeight: '600',
    });

    const exhausted = this.hintCoins <= 0 || this.hintRevealed >= this.hints.length;
    const hintBtn = document.createElement('button');
    hintBtn.textContent = exhausted ? '提示已用完' : '使用提示币';
    Object.assign(hintBtn.style, {
      padding: '6px 14px', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.1)',
      background: exhausted ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
      color: exhausted ? this.P.textMuted : this.P.textPrimary,
      fontSize: '0.76rem', cursor: exhausted || this.submitted ? 'default' : 'pointer',
      fontFamily: 'var(--font)',
    });
    if (exhausted || this.submitted) (hintBtn as HTMLButtonElement).disabled = true;

    hintBtn.addEventListener('click', () => this.revealHint(label, hintBtn, area));

    header.appendChild(label);
    header.appendChild(hintBtn);
    area.appendChild(header);

    for (let i = 0; i < this.hintRevealed; i++) {
      area.appendChild(this.buildHintBubble(i));
    }

    return area;
  }

  private revealHint(label: HTMLElement, btn: HTMLButtonElement, area: HTMLElement): void {
    if (this.hintCoins <= 0 || this.hintRevealed >= this.hints.length) return;
    this.hintCoins--;
    const idx = this.hintRevealed++;
    label.textContent = '💡 提示币: ' + this.hintCoins;
    if (this.hintCoins <= 0 || this.hintRevealed >= this.hints.length) {
      btn.disabled = true;
      btn.style.background = 'rgba(255,255,255,0.03)';
      btn.style.color = this.P.textMuted;
      btn.textContent = '提示已用完';
    }
    area.appendChild(this.buildHintBubble(idx));
  }

  private buildHintBubble(idx: number): HTMLElement {
    const levels = ['提示一', '提示二', '提示三（超级提示）'];
    const div = document.createElement('div');
    div.innerHTML = `<span style="color:var(--gold);font-weight:600">${levels[idx]}：</span> ${this.hints[idx]}`;
    Object.assign(div.style, {
      padding: '8px 12px', borderRadius: '6px',
      background: 'rgba(255,215,0,0.06)',
      border: '1px solid rgba(255,215,0,0.15)',
      fontSize: '0.8rem', lineHeight: '1.6', color: 'var(--text-primary)',
    });
    return div;
  }

  private buildAnswerReveal(box: HTMLElement): void {
    box.style.display = 'block';
    Object.assign(box.style, {
      marginTop: '8px', padding: '14px', borderRadius: '8px',
      background: this.correct ? 'rgba(76,175,80,0.08)' : 'rgba(255,68,68,0.08)',
      border: `1px solid ${this.correct ? 'rgba(76,175,80,0.2)' : 'rgba(255,68,68,0.2)'}`,
    });
    const label = document.createElement('div');
    label.textContent = this.correct ? '✓ 答案解析' : '✗ 正确答案';
    Object.assign(label.style, {
      fontSize: '0.75rem', fontWeight: '700',
      color: this.correct ? this.P.win : this.P.error, marginBottom: '6px',
    });
    const detail = document.createElement('p');
    if (this.mode === 'tangram' && this.tangramState) {
      detail.textContent = `共 ${this.tangramState.pieceCount} 个碎片，已用颜色标出正确答案。`;
    } else if (this.mode === 'path_finding' && this.pathState) {
      detail.textContent = `正确路径共 ${this.pathState.solutionPath.length} 个节点。`;
    } else if (this.mode === 'number_grid' && this.numState) {
      detail.textContent = `每行每列 ${this.numState.size} 个数字各出现一次。`;
    }
    Object.assign(detail.style, { fontSize: '0.82rem', color: 'var(--text-primary)', margin: '0' });
    box.appendChild(label);
    box.appendChild(detail);
  }

  private updateFeedback(): void {
    const el = document.getElementById('visual-feedback');
    if (el) {
      el.textContent = this.feedbackMsg;
      el.style.color = this.feedbackColor;
    }
  }

  // ─── Canvas sizing ───────────────────────────────────────

  private resizeCanvas(): void {
    const maxW = Math.min(500, this.container.clientWidth - 32);
    let gridPxW: number, gridPxH: number;

    if (this.mode === 'path_finding' && this.pathState) {
      gridPxW = gridPxH = this.pathState.gridSize * this.cellSize + 40;
    } else if (this.mode === 'number_grid' && this.numState) {
      gridPxW = this.numState.size * this.cellSize + 80;
      gridPxH = this.numState.size * this.cellSize + 50;
    } else if (this.mode === 'tangram' && this.tangramState) {
      gridPxW = this.tangramState.gridSize * this.cellSize + 40;
      gridPxH = (this.tangramState.gridSize * this.cellSize) + 120;
    } else {
      gridPxW = gridPxH = 400;
    }

    const w = Math.min(maxW, Math.max(gridPxW, 440));
    // Illustration height: tangram gets 180px illo, others smaller
    this.illoH = this.mode === 'tangram' ? 170 : 60;
    const h = Math.min(620, gridPxH + this.illoH + 24);

    this.canvasW = w;
    this.canvasH = h;
    this.canvas.width = w * 2;
    this.canvas.height = h * 2;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    // Puzzle grid offset
    if (this.mode === 'path_finding' && this.pathState) {
      const gs = this.pathState.gridSize;
      this.cellSize = Math.floor((w - 40) / gs);
      this.gridOffsetX = Math.floor((w - this.cellSize * gs) / 2);
      this.gridOffsetY = this.illoH + 12;
    } else if (this.mode === 'number_grid' && this.numState) {
      const gs = this.numState.size;
      this.cellSize = Math.floor((w - 80) / gs);
      this.gridOffsetX = Math.floor((w - this.cellSize * gs) / 2);
      this.gridOffsetY = this.illoH + 12;
    } else if (this.mode === 'tangram' && this.tangramState) {
      const gs = this.tangramState.gridSize;
      this.cellSize = Math.floor((w - 40) / gs);
      this.gridOffsetX = Math.floor((w - this.cellSize * gs) / 2);
      this.gridOffsetY = this.illoH + 10;
    }
  }

  // ─── Master draw ─────────────────────────────────────────

  private drawCanvas(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    const scale = 2;
    ctx.save();
    ctx.scale(scale, scale);
    const w = this.canvasW;
    const h = this.canvasH;

    // Use SceneRenderer if we have AI assets (Layer 3 Pipeline)
    if (this.sceneRenderer && this.assets) {
      const elements: {id: string, x: number, y: number, w: number, h: number}[] = [];
      
      if (this.visualElements) {
         // Simple layout for demo purposes
         let index = 0;
         for (const ve of this.visualElements) {
            elements.push({
               id: ve.id,
               x: 50 + (index % 2) * 160,
               y: 100 + Math.floor(index / 2) * 180,
               w: 120,
               h: 120
            });
            index++;
         }
      }

      this.sceneRenderer.drawBackground(ctx, w, h);
      this.sceneRenderer.drawSprites(ctx, elements);
      
      // Draw UI overlay (Header text, etc)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, 50);
      ctx.fillStyle = this.P.warmLight;
      ctx.font = `italic 14px var(--font)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.scenario, w / 2, 25);
      
      ctx.restore();
      return;
    }

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, this.P.bgGradTop);
    grad.addColorStop(0.4, this.P.bg);
    grad.addColorStop(1, this.P.bgGradBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw illustration banner
    this.drawIllustration(w);

    // Draw puzzle below illustration
    if (this.mode === 'path_finding') this.drawPathPuzzle();
    else if (this.mode === 'number_grid') this.drawNumberGrid();
    else if (this.mode === 'tangram') this.drawTangram();

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════
  //  ILLUSTRATION — Storybook-style scene
  // ═══════════════════════════════════════════════════════════

  private drawIllustration(w: number): void {
    const ctx = this.ctx;
    const H = this.illoH;

    if (this.mode === 'tangram') {
      this.drawTangramIllustration(w, H);
    } else if (this.mode === 'path_finding') {
      this.drawPathIllustration(w, H);
    } else if (this.mode === 'number_grid') {
      this.drawGridIllo(w, H);
    }

    // Story text overlay
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, H - 52, w, 52);

    ctx.fillStyle = this.P.warmLight;
    ctx.font = `italic 12px var(--font)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap long text
    const words = this.scenario;
    const maxChars = Math.floor(w / 7);
    if (words.length > maxChars) {
      const mid = Math.floor(words.length / 2);
      let br = mid;
      while (br < words.length && words[br] !== '、' && words[br] !== '。' && words[br] !== '，' && words[br] !== ' ') br++;
      if (br >= words.length - 2) br = mid;
      ctx.fillText(words.slice(0, br), w / 2, H - 32);
      ctx.fillText(words.slice(br).trim(), w / 2, H - 16);
    } else {
      ctx.fillText(words, w / 2, H - 24);
    }

    // Decorative line
    ctx.strokeStyle = 'rgba(255,215,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, H);
    ctx.lineTo(w - 40, H);
    ctx.stroke();
  }

  /** Grandmother's room with tangram box — full illustration */
  private drawTangramIllustration(w: number, H: number): void {
    const ctx = this.ctx;

    // ── Background: warm room wall ──
    const wallGrad = ctx.createLinearGradient(0, 0, 0, H);
    wallGrad.addColorStop(0, '#3d2b1f');
    wallGrad.addColorStop(0.5, '#4a3228');
    wallGrad.addColorStop(1, '#2d1f14');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, H);

    // Wooden floor
    const floorGrad = ctx.createLinearGradient(0, H - 32, 0, H);
    floorGrad.addColorStop(0, this.P.wood);
    floorGrad.addColorStop(1, '#3d1f0a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, H - 32, w, 32);

    // Floor planks
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, H - 32);
      ctx.lineTo(i, H);
      ctx.stroke();
    }

    // ── Window (top-left) ──
    const wx = 16, wy = 10, ww = 64, wh = 70;
    // Window frame
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    // Glass — night sky
    const skyGrad = ctx.createLinearGradient(0, wy, 0, wy + wh);
    skyGrad.addColorStop(0, '#1a1a4e');
    skyGrad.addColorStop(1, '#2d2060');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(wx, wy, ww, wh);

    // Stars
    ctx.fillStyle = '#fff';
    for (const [sx, sy, sr] of [[20, 18, 1.2], [60, 24, 1], [38, 16, 0.8], [72, 40, 1.1], [24, 52, 0.7]]) {
      ctx.beginPath();
      ctx.arc(wx + sx, wy + sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Moon
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(wx + 48, wy + 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skyGrad;
    ctx.beginPath();
    ctx.arc(wx + 52, wy + 17, 8, 0, Math.PI * 2);
    ctx.fill();

    // Window cross
    ctx.strokeStyle = '#5c3a1e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();

    // ── Curtains ──
    ctx.fillStyle = this.P.curtainRed;
    this.roundRect(ctx, wx - 6, wy - 4, 20, wh + 8, 4);
    ctx.fill();
    ctx.fillStyle = this.P.curtainRedLight;
    this.roundRect(ctx, wx + ww - 14, wy - 4, 20, wh + 8, 4);
    ctx.fill();

    // ── Bookshelf (right, behind grandmother) ──
    const bx = w - 80, by = 6, bw = 60, bh = H - 38;
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(bx, by, bw, bh);
    // Shelves
    for (let sy = by + 24; sy < by + bh - 10; sy += 26) {
      ctx.fillStyle = this.P.woodLight;
      ctx.fillRect(bx - 2, sy, bw + 4, 3);
    }
    // Books (colored rectangles)
    const bookColors = ['#c44d7a', '#4a6fa5', '#6b8b3a', '#a0522d', '#8b6914', '#5c3ce0'];
    for (let row = 0; row < 3; row++) {
      let bx2 = bx + 4;
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = bookColors[(row * 5 + b) % bookColors.length];
        const bookH = 18 + (b % 3) * 2;
        ctx.fillRect(bx2, by + 4 + row * 26, 10, bookH);
        bx2 += 11;
      }
    }

    // ── Grandmother (center-left, sitting at table) ──
    const gx = 90, gy = 8;

    // Body / dress
    ctx.fillStyle = this.P.dress;
    ctx.beginPath();
    ctx.moveTo(gx - 14, gy + 42);
    ctx.lineTo(gx - 20, gy + 82);
    ctx.lineTo(gx, gy + 88);
    ctx.lineTo(gx + 20, gy + 82);
    ctx.lineTo(gx + 14, gy + 42);
    ctx.closePath();
    ctx.fill();

    // Apron
    ctx.fillStyle = this.P.apron;
    ctx.beginPath();
    ctx.moveTo(gx - 10, gy + 48);
    ctx.lineTo(gx - 14, gy + 78);
    ctx.lineTo(gx, gy + 82);
    ctx.lineTo(gx + 14, gy + 78);
    ctx.lineTo(gx + 10, gy + 48);
    ctx.closePath();
    ctx.fill();

    // Arms
    ctx.fillStyle = this.P.dressLight;
    // Left arm reaching toward table
    ctx.beginPath();
    ctx.ellipse(gx - 18, gy + 60, 6, 14, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right arm
    ctx.beginPath();
    ctx.ellipse(gx + 18, gy + 60, 6, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Hands
    ctx.fillStyle = this.P.skin;
    ctx.beginPath(); ctx.arc(gx - 22, gy + 74, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(gx + 22, gy + 74, 6, 0, Math.PI * 2); ctx.fill();

    // Neck
    ctx.fillStyle = this.P.skin;
    ctx.fillRect(gx - 5, gy + 34, 10, 12);

    // Head
    ctx.beginPath();
    ctx.ellipse(gx, gy + 18, 18, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.P.skin;
    ctx.fill();

    // Hair (white bun)
    ctx.fillStyle = this.P.hairWhite;
    ctx.beginPath();
    ctx.arc(gx, gy + 4, 20, Math.PI, Math.PI * 2);
    ctx.fill();
    // Hair bun
    ctx.beginPath();
    ctx.arc(gx, gy - 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (kind, closed/smiling)
    ctx.strokeStyle = '#4a3020';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(gx - 6, gy + 14, 3, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx + 6, gy + 14, 3, 0, Math.PI); ctx.stroke();

    // Smile
    ctx.beginPath();
    ctx.arc(gx, gy + 22, 6, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = '#6b4a3a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glasses
    ctx.strokeStyle = '#c8a84e';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(gx - 6, gy + 16, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx + 6, gy + 16, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy + 16); ctx.lineTo(gx, gy + 16); ctx.stroke();

    // ── Table ──
    const tx = gx - 30, ty = H - 44, tw = 100, th = 14;
    ctx.fillStyle = this.P.woodLight;
    ctx.fillRect(tx, ty, tw, th);
    // Table legs
    ctx.fillStyle = this.P.wood;
    ctx.fillRect(tx + 4, ty + th, 6, 20);
    ctx.fillRect(tx + tw - 10, ty + th, 6, 20);

    // ── Tangram box on table ──
    const boxX = tx + 20, boxY = ty - 22, boxW = 36, boxH = 24;
    // Box body
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    // Box lid (slightly open)
    ctx.fillStyle = this.P.woodPale;
    ctx.beginPath();
    ctx.moveTo(boxX - 2, boxY);
    ctx.lineTo(boxX + boxW + 4, boxY);
    ctx.lineTo(boxX + boxW + 8, boxY - 10);
    ctx.lineTo(boxX, boxY - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.P.wood;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tangram pieces spilling out
    const pieceColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    const pieceShapes: [number, number, number, number][] = [
      [boxX + boxW + 4, boxY + 4, 10, 10],  // square
      [boxX + boxW + 10, boxY + 8, 14, 8],   // rect
      [boxX + boxW + 16, boxY + 2, 8, 14],   // rect
      [boxX + 2, boxY - 16, 8, 8],          // small sq
      [boxX + 12, boxY - 14, 12, 6],        // rect
    ];

    for (let i = 0; i < pieceShapes.length; i++) {
      const [px, py, pw, ph] = pieceShapes[i];
      ctx.fillStyle = pieceColors[i];
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, pw, ph);
    }

    // ── Swan silhouette card she's holding ──
    const cardX = gx - 26, cardY = ty - 18, cardW = 20, cardH = 18;
    ctx.fillStyle = '#faf8f0';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Swan shape on card
    ctx.fillStyle = this.P.swanColor;
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const swx = cardX + cardW / 2 - 1;
    const swy = cardY + 6;
    // Body
    ctx.ellipse(swx, swy + 5, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Neck & head
    ctx.beginPath();
    ctx.moveTo(swx + 2, swy + 2);
    ctx.quadraticCurveTo(swx + 6, swy - 3, swx + 7, swy - 5);
    ctx.strokeStyle = this.P.swanOutline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Beak
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(swx + 8, swy - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Candle glow ──
    const cx = tx + tw - 8, cy = ty - 10;
    // Glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 36);
    glowGrad.addColorStop(0, this.P.candleGlow);
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();

    // Candle
    ctx.fillStyle = '#f5e6d0';
    ctx.fillRect(cx - 2, cy - 4, 4, 12);
    // Flame
    ctx.fillStyle = this.P.candle;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.quadraticCurveTo(cx + 3, cy - 3, cx, cy - 1);
    ctx.quadraticCurveTo(cx - 3, cy - 3, cx, cy - 10);
    ctx.fill();
    // Inner flame
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.quadraticCurveTo(cx + 1.5, cy - 2, cx, cy - 1);
    ctx.quadraticCurveTo(cx - 1.5, cy - 2, cx, cy - 7);
    ctx.fill();

    // Warm overlay on the whole scene
    const warmGrad = ctx.createRadialGradient(cx, cy, 4, gx + 10, gy + 50, 200);
    warmGrad.addColorStop(0, 'rgba(255,200,100,0.06)');
    warmGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, w, H);
  }

  /** Path finding illustration — simplified */
  private drawPathIllustration(w: number, H: number): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a2a1a');
    grad.addColorStop(1, '#0d1410');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, H);

    // Decorative garden elements
    ctx.fillStyle = 'rgba(76,175,80,0.06)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(40 + i * (w - 80) / 4, H - 20, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,215,0,0.1)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(70 + i * (w - 100) / 3, H - 34, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small icon
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', w / 2, H / 2 - 4);
  }

  /** Number grid illustration — simplified */
  private drawGridIllo(w: number, H: number): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a3a');
    grad.addColorStop(1, '#0f0f20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, H);

    // Decorative grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 10; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('1 < 2 < 3', w / 2, H / 2 + 6);
  }

  // ═══════════════════════════════════════════════════════════
  //  PATH FINDING
  // ═══════════════════════════════════════════════════════════

  private drawPathPuzzle(): void {
    if (!this.pathState) return;
    const ctx = this.ctx;
    const { gridSize, givenEdges, startNode, endNode } = this.pathState;
    const cs = this.cellSize;
    const ox = this.gridOffsetX;
    const oy = this.gridOffsetY;

    const getXY = (idx: number): [number, number] => {
      const row = Math.floor(idx / gridSize);
      const col = idx % gridSize;
      return [ox + col * cs + cs / 2, oy + row * cs + cs / 2];
    };

    // Given edges
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineCap = 'round';
    for (const [a, b] of givenEdges) {
      const [ax, ay] = getXY(a);
      const [bx, by] = getXY(b);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    // Player path
    if (this.playerPath.length > 1) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.submitted
        ? (this.correct ? this.P.win : this.P.error)
        : this.P.gold;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = this.submitted && this.correct ? 'rgba(76,175,80,0.4)' : 'rgba(255,215,0,0.3)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      const [fx, fy] = getXY(this.playerPath[0]);
      ctx.moveTo(fx, fy);
      for (let i = 1; i < this.playerPath.length; i++) {
        const [nx, ny] = getXY(this.playerPath[i]);
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Dots
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const idx = r * gridSize + c;
        const [cx, cy] = getXY(idx);
        const radius = idx === startNode || idx === endNode ? cs * 0.15 : cs * 0.1;
        const isVisited = this.playerPath.includes(idx);

        if (isVisited && !this.submitted) {
          ctx.fillStyle = 'rgba(255,215,0,0.15)';
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = idx === startNode ? this.P.dotGreen
          : idx === endNode ? this.P.dotRed
          : isVisited ? this.P.gold
          : '#666688';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (idx === startNode || idx === endNode) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${cs * 0.2}px var(--font)`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(idx === startNode ? 'S' : 'E', cx, cy);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  NUMBER GRID
  // ═══════════════════════════════════════════════════════════

  private drawNumberGrid(): void {
    if (!this.numState) return;
    const ctx = this.ctx;
    const { size, grid, solution, constraints } = this.numState;
    const cs = this.cellSize;
    const ox = this.gridOffsetX + 25;
    const oy = this.gridOffsetY + 12;

    // Constraint signs
    ctx.font = `bold ${cs * 0.4}px var(--font)`;
    ctx.fillStyle = this.P.dotRed;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [r1, c1, r2, c2] of constraints) {
      if (r1 === r2) {
        ctx.fillText('<', ox + Math.max(c1, c2) * cs, oy + r1 * cs + cs / 2);
      } else {
        ctx.fillText('∧', ox + c1 * cs + cs / 2, oy + Math.max(r1, r2) * cs + 2);
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = ox + c * cs, y = oy + r * cs;
        const isClue = grid[r][c] !== 0;
        const isSelected = this.selectedCell?.[0] === r && this.selectedCell?.[1] === c;
        const isWrong = this.submitted && !this.correct
          && this.playerGrid[r]?.[c] !== 0 && this.playerGrid[r]?.[c] !== solution[r][c];

        ctx.fillStyle = isSelected && !this.submitted ? this.P.cellSelected
          : isWrong ? this.P.cellWrong
          : isClue ? this.P.cellClue
          : this.P.cellEmpty;
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

        ctx.strokeStyle = isSelected ? this.P.accentLight : this.P.gridLine;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);

        const displayVal = this.submitted && !this.correct
          ? solution[r][c]
          : (isClue ? grid[r][c] : (this.playerGrid[r]?.[c] || ''));
        ctx.fillStyle = isClue ? this.P.textPrimary
          : (isWrong ? this.P.error : this.P.gold);
        ctx.font = `bold ${cs * 0.38}px var(--font)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(displayVal), x + cs / 2, y + cs / 2);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  TANGRAM
  // ═══════════════════════════════════════════════════════════

  private drawTangram(): void {
    if (!this.tangramState) return;
    const ctx = this.ctx;
    const { gridSize, targetCells, pieces } = this.tangramState;
    const cs = this.cellSize;
    const ox = this.gridOffsetX;
    const oy = this.gridOffsetY;
    const targetH = gridSize * cs;
    const targetSet = new Set(targetCells.map(([r, c]) => `${r},${c}`));

    // ── Target shape label ──
    ctx.fillStyle = this.P.textMuted;
    ctx.font = `600 10px var(--font)`;
    ctx.textAlign = 'left';
    ctx.fillText('目标形状', ox, oy - 6);

    // ── Grid ──
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = ox + c * cs, y = oy + r * cs;
        const isTarget = targetSet.has(`${r},${c}`);

        ctx.fillStyle = isTarget ? this.P.tangramTarget : this.P.gridBg;
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

        ctx.strokeStyle = isTarget ? this.P.tangramTargetBorder : this.P.gridLine;
        ctx.lineWidth = isTarget ? 1.2 : 0.5;
        ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
      }
    }

    // ── Placed pieces ──
    for (const pp of this.placedPieces) {
      this.drawPieceBlock(ctx, ox, oy, cs, pp.cells,
        this.P.tangramPlaced, this.P.tangramPlacedBorder);
    }

    // ── Ghost preview ──
    if (this.selectedPieceIdx >= 0 && this.selectedPieceIdx < pieces.length) {
      const ghost = this.getTransformedCells(pieces[this.selectedPieceIdx]);
      const valid = this.isPlacementValid(ghost);
      this.drawPieceBlock(ctx, ox, oy, cs, ghost,
        valid ? this.P.tangramGhost : this.P.tangramGhostInvalid,
        valid ? 'rgba(255,255,255,0.25)' : 'rgba(255,68,68,0.4)');
    }

    // ── Pieces tray ──
    const trayY = oy + targetH + 18;
    ctx.fillStyle = this.P.textMuted;
    ctx.font = `600 10px var(--font)`;
    ctx.textAlign = 'left';
    ctx.fillText('碎片', ox, trayY - 6);

    let px = ox;
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (this.placedPieces.some(pp => pp.pieceId === p.id)) continue;

      const isSelected = i === this.selectedPieceIdx;
      const cells = isSelected ? this.getTransformedCells(p) : p.cells;
      const [minR, maxR, minC, maxC] = this.pieceBounds(cells);
      const pw = (maxC - minC + 1) * cs + 6;
      const ph = (maxR - minR + 1) * cs + 6;

      ctx.fillStyle = isSelected ? this.P.tangramSelected : this.P.tangramPieceBg;
      ctx.fillRect(px, trayY, pw, ph);
      ctx.strokeStyle = isSelected ? 'rgba(255,215,0,0.6)' : this.P.tangramPieceBorder;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(px, trayY, pw, ph);

      for (const [r, c] of cells) {
        const cx = px + 3 + (c - minC) * cs;
        const cy = trayY + 3 + (r - minR) * cs;
        ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.28)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(cx + 1, cy + 1, cs - 2, cs - 2);
        ctx.strokeStyle = isSelected ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx + 1, cy + 1, cs - 2, cs - 2);
      }

      ctx.fillStyle = '#fff';
      ctx.font = `${cs * 0.22}px var(--font)`;
      ctx.textAlign = 'center';
      ctx.fillText(`#${i + 1}`, px + pw / 2, trayY + ph + 12);

      px += pw + 10;
    }

    // ── Placed count ──
    if (this.placedPieces.length > 0) {
      ctx.fillStyle = this.P.textMuted;
      ctx.font = `600 10px var(--font)`;
      ctx.textAlign = 'right';
      ctx.fillText(`已放置 ${this.placedPieces.length}/${pieces.length}`, ox + gridSize * cs, trayY - 6);
    }
  }

  private drawPieceBlock(
    ctx: CanvasRenderingContext2D, ox: number, oy: number, cs: number,
    cells: [number, number][], fillColor: string, strokeColor: string
  ): void {
    for (const [r, c] of cells) {
      const x = ox + c * cs, y = oy + r * cs;
      ctx.fillStyle = fillColor;
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
    }
  }

  private getTransformedCells(piece: PieceDef): [number, number][] {
    let cells = [...piece.cells];
    if (this.selectedPieceFlipped) {
      const maxC = Math.max(...cells.map(c => c[1]));
      cells = cells.map(([r, c]) => [r, maxC - c]);
    }
    for (let rot = 0; rot < this.selectedPieceRotation; rot++) {
      const maxC = Math.max(...cells.map(c => c[1]));
      cells = cells.map(([r, c]) => [c, maxC - r]);
    }
    return cells;
  }

  private isPlacementValid(cells: [number, number][]): boolean {
    if (!this.tangramState) return false;
    const { targetCells, gridSize } = this.tangramState;
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

  private pieceBounds(cells: [number, number][]): [number, number, number, number] {
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [r, c] of cells) {
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (c < minC) minC = c; if (c > maxC) maxC = c;
    }
    return [minR, maxR, minC, maxC];
  }

  // ─── Answer checking ─────────────────────────────────────

  private checkAnswer(): void {
    if (this.submitted) return;
    if (this.mode === 'path_finding') this.correct = this.checkPathAnswer();
    else if (this.mode === 'number_grid') this.correct = this.checkGridAnswer();
    else if (this.mode === 'tangram') this.correct = this.checkTangramAnswer();

    this.submitted = true;
    this.feedbackMsg = this.correct ? '✦ 正确！Brilliant！' : '✗ 不对哦。正确答案如上所示。';
    this.feedbackColor = this.correct ? this.P.win : this.P.error;

    if (this.correct) setTimeout(() => this.onWinCb?.(), 500);
    this.updateFeedback();
    this.drawCanvas();
    this.render();
  }

  private checkPathAnswer(): boolean {
    if (!this.pathState) return false;
    const sol = this.pathState.solutionPath;
    const ply = this.playerPath;
    return ply.length === sol.length && sol.every((v, i) => v === ply[i]);
  }

  private checkGridAnswer(): boolean {
    if (!this.numState) return false;
    const { size, solution } = this.numState;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (this.playerGrid[r]?.[c] !== solution[r][c]) return false;
    return true;
  }

  private checkTangramAnswer(): boolean {
    if (!this.tangramState) return false;
    const target = new Set(this.tangramState.targetCells.map(([r, c]) => `${r},${c}`));
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

  // ─── Click handling ──────────────────────────────────────

  private handleClick(e: MouseEvent): void {
    if (this.submitted) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / 2 / rect.width;
    const sy = this.canvas.height / 2 / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    if (this.mode === 'path_finding') this.handlePathClick(mx, my);
    else if (this.mode === 'number_grid') this.handleGridClick(mx, my);
    else if (this.mode === 'tangram') this.handleTangramClick(mx, my);
    this.drawCanvas();
  }

  private handleTangramClick(mx: number, my: number): void {
    if (!this.tangramState) return;
    const { gridSize, pieces } = this.tangramState;
    const cs = this.cellSize;
    const ox = this.gridOffsetX, oy = this.gridOffsetY;
    const targetH = gridSize * cs;
    const trayY = oy + targetH + 18;

    // Check grid click
    const gc = Math.floor((mx - ox) / cs);
    const gr = Math.floor((my - oy) / cs);
    if (gr >= 0 && gr < gridSize && gc >= 0 && gc < gridSize && my < oy + targetH) {
      if (this.selectedPieceIdx >= 0) {
        const piece = pieces[this.selectedPieceIdx];
        const t = this.getTransformedCells(piece);
        const [minR, , minC] = this.pieceBounds(t);
        const offset = t.map(([r, c]) => [r - minR + gr, c - minC + gc] as [number, number]);
        if (this.isPlacementValid(offset)) {
          this.placedPieces.push({
            pieceId: piece.id, cells: offset,
            rotation: this.selectedPieceRotation, flipped: this.selectedPieceFlipped,
          });
          this.selectedPieceIdx = -1;
          this.selectedPieceRotation = 0;
          this.selectedPieceFlipped = false;
          if (this.checkTangramAnswer()) {
            this.submitted = true; this.correct = true;
            this.feedbackMsg = '✦ 正确！Brilliant！';
            this.feedbackColor = this.P.win;
            this.updateFeedback();
            setTimeout(() => this.onWinCb?.(), 500);
            this.render(); return;
          }
        }
      } else {
        for (let i = this.placedPieces.length - 1; i >= 0; i--) {
          const pp = this.placedPieces[i];
          for (const [r, c] of pp.cells) {
            if (r === gr && c === gc) {
              const piece = pieces.find(p => p.id === pp.pieceId);
              if (piece) {
                this.selectedPieceIdx = pieces.indexOf(piece);
                this.selectedPieceRotation = pp.rotation;
                this.selectedPieceFlipped = pp.flipped;
              }
              this.placedPieces.splice(i, 1);
              return;
            }
          }
        }
      }
      return;
    }

    // Tray click
    if (my >= trayY) {
      let px = ox;
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        if (this.placedPieces.some(pp => pp.pieceId === p.id)) continue;
        const cells = i === this.selectedPieceIdx ? this.getTransformedCells(p) : p.cells;
        const [, maxR, minC, maxC] = this.pieceBounds(cells);
        const pw = (maxC - minC + 1) * cs + 6;
        const ph = (maxR - minR(cells) + 1) * cs + 6;
        if (mx >= px && mx <= px + pw && my >= trayY && my <= trayY + ph) {
          if (this.selectedPieceIdx === i) {
            this.selectedPieceIdx = -1;
            this.selectedPieceRotation = 0;
            this.selectedPieceFlipped = false;
          } else {
            this.selectedPieceIdx = i;
            this.selectedPieceRotation = 0;
            this.selectedPieceFlipped = false;
          }
          return;
        }
        px += pw + 10;
      }
      this.selectedPieceIdx = -1;
    }
  }

  private handlePathClick(mx: number, my: number): void {
    if (!this.pathState) return;
    const { gridSize } = this.pathState;
    const cs = this.cellSize;
    const ox = this.gridOffsetX, oy = this.gridOffsetY;
    const col = Math.round((mx - ox - cs / 2) / cs);
    const row = Math.round((my - oy - cs / 2) / cs);
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
    const idx = row * gridSize + col;
    const cx = ox + col * cs + cs / 2, cy = oy + row * cs + cs / 2;
    if (Math.hypot(mx - cx, my - cy) > cs * 0.45) return;
    if (this.playerPath.length >= 2 && idx === this.playerPath[this.playerPath.length - 2]) {
      this.playerPath.pop(); return;
    }
    if (this.playerPath.includes(idx)) return;
    const last = this.playerPath[this.playerPath.length - 1];
    const lr = Math.floor(last / gridSize), lc = last % gridSize;
    if (Math.abs(row - lr) + Math.abs(col - lc) !== 1) return;
    this.playerPath.push(idx);
  }

  private handleGridClick(mx: number, my: number): void {
    if (!this.numState) return;
    const { size, grid } = this.numState;
    const cs = this.cellSize;
    const ox = this.gridOffsetX + 25, oy = this.gridOffsetY + 12;
    const col = Math.floor((mx - ox) / cs);
    const row = Math.floor((my - oy) / cs);
    if (row < 0 || row >= size || col < 0 || col >= size) { this.selectedCell = null; return; }
    if (grid[row][col] !== 0) { this.selectedCell = null; return; }
    this.selectedCell = this.selectedCell?.[0] === row && this.selectedCell?.[1] === col
      ? null : [row, col];
  }

  // ─── Keyboard ────────────────────────────────────────────

  handleKey(key: string): void {
    if (this.submitted) return;
    if (this.mode === 'tangram') {
      if (key === 'r' || key === 'R') this.selectedPieceRotation = (this.selectedPieceRotation + 1) % 4;
      else if (key === 'f' || key === 'F') this.selectedPieceFlipped = !this.selectedPieceFlipped;
      else if (key === 'Backspace' || key === 'Delete' || key === 'Escape') {
        this.selectedPieceIdx = -1; this.selectedPieceRotation = 0; this.selectedPieceFlipped = false;
      }
      this.drawCanvas(); return;
    }
    if (this.mode !== 'number_grid' || !this.selectedCell || !this.numState) return;
    const [r, c] = this.selectedCell;
    const mv = this.numState.size;
    if (key >= '1' && key <= String(mv)) {
      this.playerGrid[r][c] = parseInt(key);
      let nr = r, nc = c + 1;
      if (nc >= mv) { nc = 0; nr++; }
      if (nr < mv && this.numState.grid[nr][nc] !== 0) { nc++; if (nc >= mv) { nc = 0; nr++; } }
      this.selectedCell = nr < mv ? [nr, nc] : null;
    } else if (key === 'Backspace' || key === 'Delete') {
      this.playerGrid[r][c] = 0;
    } else if (key === 'ArrowRight') this.selectedCell = [r, Math.min(mv - 1, c + 1)];
    else if (key === 'ArrowLeft') this.selectedCell = [r, Math.max(0, c - 1)];
    else if (key === 'ArrowDown') this.selectedCell = [Math.min(mv - 1, r + 1), c];
    else if (key === 'ArrowUp') this.selectedCell = [Math.max(0, r - 1), c];
    else if (key === 'Enter') { this.checkAnswer(); return; }
    else return;
    this.drawCanvas();
  }

  bindKeyboard(): void {
    const h = (e: KeyboardEvent) => { if (!this.submitted) this.handleKey(e.key); };
    document.addEventListener('keydown', h);
    (this as any).__kh = h;
  }

  unbindKeyboard(): void {
    const h = (this as any).__kh;
    if (h) document.removeEventListener('keydown', h);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// Helper: min row for cells
function minR(cells: [number, number][]): number {
  return cells.reduce((m, [r]) => Math.min(m, r), Infinity);
}
