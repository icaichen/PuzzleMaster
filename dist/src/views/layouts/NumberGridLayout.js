/**
 * NumberGridLayout.ts — 不等号数独谜题布局 v2
 *
 * 核心改进：
 * 1. 去掉独立的插画面板 — 网格 + 约束箭头 = 视觉焦点
 * 2. 统一的羊皮纸页面容器
 * 3. 暖色调数字网格
 */
import { setupRender, teardownRender } from '../../renderer/PuzzleRenderer';
import { NumberGridRenderer } from '../../renderer/NumberGridRenderer';
import { createButtonRow, createHintPanel, createFeedback, createDivider, C, } from './SharedComponents';
export class NumberGridLayout {
    constructor() {
        this.state = null;
        this.callbacks = null;
        this.submitted = false;
        this.playerGrid = [];
        this.selectedCell = null;
        this.cellSize = 50;
        this.ox = 0;
        this.oy = 0;
        // Visual renderer
        this.renderer = new NumberGridRenderer();
        this._keyHandler = null;
    }
    mount(container) {
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
    render(params) {
        if (!this.wrapper)
            return;
        this.wrapper.innerHTML = '';
        this.submitted = false;
        const state = params.puzzle.initial_state;
        this.state = state;
        this.playerGrid = state.grid.map(r => [...r]);
        this.selectedCell = null;
        const size = state.size;
        const maxW = Math.min(440, window.innerWidth - 48);
        this.cellSize = size <= 3 ? 64 : size <= 4 ? 56 : 44;
        const gridPx = size * this.cellSize;
        const paddingX = 60;
        const w = Math.min(maxW, gridPx + paddingX + 100);
        // ── 顶部装饰线 ──
        const topOrnament = document.createElement('div');
        topOrnament.style.cssText = 'height:3px;background:linear-gradient(90deg,' + C.goldDim + ',' + C.gold + ',' + C.goldDim + ');';
        this.wrapper.appendChild(topOrnament);
        // ── 标题栏 ──
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px 4px', gap: '8px',
        });
        const catEl = document.createElement('span');
        catEl.textContent = '🔢 数字网格';
        catEl.style.cssText =
            'font-size:0.66rem;color:' + C.goldDim + ';background:' + C.parchmentDark +
                ';padding:2px 8px;border-radius:10px;border:1px solid ' + C.border +
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
            'font-size:0.7rem;font-weight:700;color:' + C.goldDim +
                ';font-family:var(--font-serif);white-space:nowrap;';
        header.appendChild(catEl);
        header.appendChild(titleEl);
        header.appendChild(picEl);
        this.wrapper.appendChild(header);
        // ── 问题描述 ──
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
        // ── Canvas 网格 ──
        const canvasH = gridPx + 60;
        this.canvas = document.createElement('canvas');
        const scale = 2;
        this.canvas.width = w * scale;
        this.canvas.height = canvasH * scale;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = canvasH + 'px';
        this.canvas.style.display = 'block';
        this.canvas.style.cursor = 'pointer';
        this.ctx = this.canvas.getContext('2d');
        this.ox = Math.floor((w - gridPx) / 2) + 25;
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
            this.playerGrid = state.grid.map(r => [...r]);
            this.selectedCell = null;
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
        // ── 键盘提示 ──
        const kbLabel = document.createElement('div');
        kbLabel.textContent = '点击空格 → 输入数字 1–' + state.size + ' → 方向键移动 → 回车提交';
        Object.assign(kbLabel.style, {
            fontSize: '0.68rem', color: C.muted, textAlign: 'center',
            padding: '4px 16px 8px', fontFamily: 'var(--font-serif)',
        });
        this.wrapper.appendChild(kbLabel);
        // ── 交互 ──
        this.canvas.addEventListener('click', e => this.handleClick(e));
        document.addEventListener('keydown', this._keyHandler = (e) => {
            if (this.submitted)
                return;
            this.handleKey(e.key);
            e.preventDefault();
        });
        this.draw();
    }
    destroy() {
        if (this._keyHandler)
            document.removeEventListener('keydown', this._keyHandler);
        this.wrapper?.remove();
    }
    setCallbacks(cbs) { this.callbacks = cbs; }
    // ═══════════════════════════════════════════════════════
    //  DRAW
    // ═══════════════════════════════════════════════════════
    draw() {
        if (!this.state)
            return;
        const ctx = this.ctx;
        const scale = 2;
        const rc = setupRender(ctx, this.canvas.width, this.canvas.height, scale);
        this.renderer.draw(ctx, rc.logicalW, rc.logicalH, {
            state: this.state,
            cellSize: this.cellSize,
            ox: this.ox,
            oy: this.oy,
            playerGrid: this.playerGrid,
            selectedCell: this.selectedCell,
            submitted: this.submitted,
        });
        teardownRender(ctx);
    }
    // ═══════════════════════════════════════════════════════
    //  CLICK
    // ═══════════════════════════════════════════════════════
    handleClick(e) {
        if (!this.state || this.submitted)
            return;
        const { size, grid } = this.state;
        const rect = this.canvas.getBoundingClientRect();
        const sx = this.canvas.width / 2 / rect.width;
        const sy = this.canvas.height / 2 / rect.height;
        const mx = (e.clientX - rect.left) * sx;
        const my = (e.clientY - rect.top) * sy;
        const cs = this.cellSize;
        const col = Math.floor((mx - this.ox) / cs);
        const row = Math.floor((my - this.oy) / cs);
        if (row < 0 || row >= size || col < 0 || col >= size) {
            this.selectedCell = null;
            this.draw();
            return;
        }
        if (grid[row][col] !== 0) {
            this.selectedCell = null;
            this.draw();
            return;
        }
        this.selectedCell = this.selectedCell?.[0] === row && this.selectedCell?.[1] === col
            ? null : [row, col];
        this.draw();
    }
    // ═══════════════════════════════════════════════════════
    //  KEYBOARD
    // ═══════════════════════════════════════════════════════
    handleKey(key) {
        if (!this.state || !this.selectedCell || this.submitted)
            return;
        const [r, c] = this.selectedCell;
        const mv = this.state.size;
        if (key >= '1' && key <= String(mv)) {
            this.playerGrid[r][c] = parseInt(key);
            let nr = r, nc = c + 1;
            if (nc >= mv) {
                nc = 0;
                nr++;
            }
            if (nr < mv && this.state.grid[nr][nc] !== 0) {
                nc++;
                if (nc >= mv) {
                    nc = 0;
                    nr++;
                }
            }
            this.selectedCell = nr < mv ? [nr, nc] : null;
        }
        else if (key === 'Backspace' || key === 'Delete') {
            this.playerGrid[r][c] = 0;
        }
        else if (key === 'ArrowRight')
            this.selectedCell = [r, Math.min(mv - 1, c + 1)];
        else if (key === 'ArrowLeft')
            this.selectedCell = [r, Math.max(0, c - 1)];
        else if (key === 'ArrowDown')
            this.selectedCell = [Math.min(mv - 1, r + 1), c];
        else if (key === 'ArrowUp')
            this.selectedCell = [Math.max(0, r - 1), c];
        else if (key === 'Enter') {
            this.checkAnswer();
            return;
        }
        else
            return;
        this.draw();
    }
    // ═══════════════════════════════════════════════════════
    //  CHECK
    // ═══════════════════════════════════════════════════════
    checkAnswer() {
        if (!this.state || this.submitted)
            return;
        this.submitted = true;
        const { size, solution } = this.state;
        const correct = this.playerGrid.every((row, r) => row.every((val, c) => val === solution[r][c]));
        if (correct) {
            this.correctEl.textContent = '✦ 正确！所有约束满足！';
            this.correctEl.style.color = C.success;
            this.buttons.showNext();
            setTimeout(() => this.callbacks?.onWin(), 500);
        }
        else {
            this.correctEl.textContent = '✗ 存在错误，已标红。请修正后重试。';
            this.correctEl.style.color = C.error;
            for (let r = 0; r < size; r++)
                for (let c = 0; c < size; c++)
                    if (this.playerGrid[r][c] !== solution[r][c])
                        this.playerGrid[r][c] = solution[r][c];
            this.submitted = false;
        }
        this.draw();
    }
}
//# sourceMappingURL=NumberGridLayout.js.map