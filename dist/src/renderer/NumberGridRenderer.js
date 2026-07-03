/**
 * NumberGridRenderer.ts — 不等号数独视觉渲染器
 *
 * 绘制仿古籍/藏书馆风格的数字网格：
 * - 做旧纸张：茶渍、纤维纹理、不规则褪色
 * - 手写体数字：轻微旋转、笔画粗细变化
 * - 墨水风格的不等号箭头
 * - 格子有轻微的内阴影（凹陷感）
 */
import { COLORS, drawParchmentBg, roundRect, seededRNG } from './PuzzleRenderer';
export class NumberGridRenderer {
    constructor() {
        this.rng = seededRNG(17);
    }
    draw(ctx, logicalW, logicalH, rs) {
        const { state, cellSize: cs, ox, oy, playerGrid, selectedCell, submitted } = rs;
        const { size, grid, solution, constraints } = state;
        // ── 做旧纸张背景 ──
        drawParchmentBg(ctx, logicalW, logicalH);
        this.drawAgedPaperOverlay(ctx, ox, oy, size * cs, size * cs);
        // ── 标题 ──
        ctx.fillStyle = COLORS.ink;
        ctx.font = 'bold 13px var(--font-serif)';
        ctx.textAlign = 'center';
        ctx.fillText(`${size}×${size} 不等号数独`, ox + (size * cs) / 2, oy - 6);
        // ── 场景装饰·图书馆氛围 ──
        ctx.fillStyle = COLORS.goldDim;
        ctx.font = 'italic 11px var(--font-serif)';
        ctx.textAlign = 'right';
        ctx.fillText('📖 古籍藏书阁', ox + size * cs, oy - 6);
        // ── 约束箭头 (墨水风格) ──
        for (const [r1, c1, r2, c2] of constraints) {
            if (r1 === r2) {
                // 水平 <
                const x = ox + Math.max(c1, c2) * cs - cs / 2;
                const y = oy + r1 * cs + cs / 2;
                this.drawInkArrow(ctx, x, y, 1, cs * 0.35);
            }
            else {
                // 垂直 ∧
                const x = ox + c1 * cs + cs / 2;
                const y = oy + Math.max(r1, r2) * cs - cs / 2;
                this.drawInkArrow(ctx, x, y, 0, cs * 0.35);
            }
        }
        // ── 格子 ──
        const allFilled = playerGrid.every((row, r) => row.every((val, c) => grid[r][c] !== 0 || val !== 0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                const isClue = grid[r][c] !== 0;
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isWrong = submitted && playerGrid[r][c] !== 0 && playerGrid[r][c] !== solution[r][c];
                // ── 格子底色 ──
                if (isClue) {
                    // 预填格子：淡墨水底
                    ctx.fillStyle = 'rgba(180,160,130,0.12)';
                }
                else if (isSelected && !submitted) {
                    ctx.fillStyle = 'rgba(184,92,58,0.1)';
                }
                else if (isWrong) {
                    ctx.fillStyle = 'rgba(184,92,58,0.08)';
                }
                else {
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                }
                roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, 3);
                ctx.fill();
                // ── 凹陷效果 ──
                ctx.save();
                roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, 3);
                ctx.clip();
                // 上边阴影
                ctx.strokeStyle = 'rgba(0,0,0,0.06)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + 2, y + 4);
                ctx.lineTo(x + cs - 2, y + 4);
                ctx.stroke();
                // 下边高光
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 2, y + cs - 3);
                ctx.lineTo(x + cs - 2, y + cs - 3);
                ctx.stroke();
                ctx.restore();
                // ── 边框 ──
                ctx.strokeStyle = isSelected ? COLORS.accent
                    : isClue ? 'rgba(160,140,110,0.4)'
                        : COLORS.border;
                ctx.lineWidth = isSelected ? 1.8 : 1;
                roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, 3);
                ctx.stroke();
                // ── 数字 (手写风格) ──
                const displayVal = isClue ? grid[r][c] : playerGrid[r][c] || '';
                if (displayVal !== '') {
                    this.drawHandwrittenNumber(ctx, x + cs / 2, y + cs / 2, displayVal, cs * 0.36, isClue, isWrong);
                }
            }
        }
    }
    // ─── 做旧纸张叠加纹理 ──────────────────────────────────
    drawAgedPaperOverlay(ctx, ox, oy, w, h) {
        // 轻微纸张皮色
        ctx.fillStyle = 'rgba(245,235,215,0.3)';
        roundRect(ctx, ox - 4, oy - 4, w + 8, h + 8, 6);
        ctx.fill();
        // 茶渍
        const rng = seededRNG(91);
        ctx.fillStyle = 'rgba(180,140,100,0.04)';
        for (let i = 0; i < 8; i++) {
            const cx = ox + rng() * w;
            const cy = oy + rng() * h;
            const r = 3 + rng() * 25;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        // 纤维细线
        ctx.strokeStyle = 'rgba(160,140,110,0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 15; i++) {
            const x1 = ox + rng() * w;
            const y1 = oy + rng() * h;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + (rng() - 0.5) * 40, y1 + (rng() - 0.5) * 6);
            ctx.stroke();
        }
    }
    // ─── 墨水不等号 ────────────────────────────────────────
    drawInkArrow(ctx, x, y, dir, // 0 = vertical (∧), 1 = horizontal (<)
    size) {
        ctx.save();
        ctx.fillStyle = COLORS.inkLight;
        ctx.font = `bold ${size}px var(--font-serif)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 轻微旋转模拟手写
        const rot = (Math.random() - 0.5) * 0.04;
        ctx.translate(x, y);
        ctx.rotate(rot);
        if (dir === 0) {
            // 垂直 ∧: A < B (上面的更小)
            ctx.fillText('∧', 0, 0);
        }
        else {
            // 水平 <
            ctx.fillText('<', 0, 0);
        }
        ctx.restore();
    }
    // ─── 手写体数字 ────────────────────────────────────────
    drawHandwrittenNumber(ctx, cx, cy, value, fontSize, isClue, isWrong) {
        ctx.save();
        ctx.translate(cx, cy);
        // 手写体轻微旋转 (±2°)
        const rot = (Math.random() - 0.5) * 0.03;
        ctx.rotate(rot);
        ctx.fillStyle = isWrong ? COLORS.error
            : isClue ? COLORS.ink
                : COLORS.accent;
        ctx.font = `bold ${fontSize}px Georgia, "Noto Serif SC", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 手写体：墨水感 —— 先画一个粗的底层
        ctx.fillText(String(value), 0.5, 0.5);
        // 再画一个稍小的高亮层
        ctx.fillStyle = isWrong ? 'rgba(184,92,58,0.5)'
            : isClue ? 'rgba(44,24,16,0.7)'
                : 'rgba(184,92,58,0.8)';
        ctx.fillText(String(value), 0, 0);
        ctx.restore();
    }
}
//# sourceMappingURL=NumberGridRenderer.js.map