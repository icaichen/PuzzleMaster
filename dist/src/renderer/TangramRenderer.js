/**
 * TangramRenderer.ts — 拼图谜题视觉渲染器
 *
 * 为每个形状名绘制真实可辨识的轮廓剪影 + 描述性场景背景。
 * 碎片渲染为带切面、高光、阴影的宝石/木片风格多边形块。
 *
 * 核心：形状轮廓由贝塞尔曲线定义，不是格子方块。
 */
import { COLORS, drawParchmentBg, drawSparkle, roundRect } from './PuzzleRenderer';
const SHAPE_PATHS = {
    diamond: [
        ['M', 0.5, 0.05],
        ['C', 0.7, 0.15, 0.9, 0.35, 0.95, 0.5],
        ['C', 0.9, 0.65, 0.7, 0.85, 0.5, 0.95],
        ['C', 0.3, 0.85, 0.1, 0.65, 0.05, 0.5],
        ['C', 0.1, 0.35, 0.3, 0.15, 0.5, 0.05],
        ['Z'],
    ],
    heart: [
        ['M', 0.5, 0.95],
        ['C', 0.1, 0.65, 0.05, 0.3, 0.2, 0.12],
        ['C', 0.35, -0.05, 0.5, 0.08, 0.5, 0.25],
        ['C', 0.5, 0.08, 0.65, -0.05, 0.8, 0.12],
        ['C', 0.95, 0.3, 0.9, 0.65, 0.5, 0.95],
        ['Z'],
    ],
    tree: [
        ['M', 0.5, 0.05],
        ['L', 0.25, 0.35],
        ['L', 0.35, 0.35],
        ['L', 0.15, 0.6],
        ['L', 0.3, 0.6],
        ['L', 0.1, 0.9],
        ['L', 0.9, 0.9],
        ['L', 0.7, 0.6],
        ['L', 0.85, 0.6],
        ['L', 0.65, 0.35],
        ['L', 0.75, 0.35],
        ['Z'],
    ],
    star: [
        ['M', 0.5, 0.02],
        ['L', 0.62, 0.35],
        ['L', 0.98, 0.38],
        ['L', 0.72, 0.6],
        ['L', 0.8, 0.95],
        ['L', 0.5, 0.75],
        ['L', 0.2, 0.95],
        ['L', 0.28, 0.6],
        ['L', 0.02, 0.38],
        ['L', 0.38, 0.35],
        ['Z'],
    ],
    arrow: [
        ['M', 0.5, 0.02],
        ['L', 0.9, 0.45],
        ['L', 0.65, 0.45],
        ['L', 0.65, 0.95],
        ['L', 0.35, 0.95],
        ['L', 0.35, 0.45],
        ['L', 0.1, 0.45],
        ['Z'],
    ],
    cross: [
        ['M', 0.35, 0.02],
        ['L', 0.65, 0.02],
        ['L', 0.65, 0.35],
        ['L', 0.95, 0.35],
        ['L', 0.95, 0.65],
        ['L', 0.65, 0.65],
        ['L', 0.65, 0.95],
        ['L', 0.35, 0.95],
        ['L', 0.35, 0.65],
        ['L', 0.02, 0.65],
        ['L', 0.02, 0.35],
        ['L', 0.35, 0.35],
        ['Z'],
    ],
    house: [
        ['M', 0.5, 0.05],
        ['L', 0.05, 0.5],
        ['L', 0.2, 0.5],
        ['L', 0.2, 0.95],
        ['L', 0.8, 0.95],
        ['L', 0.8, 0.5],
        ['L', 0.95, 0.5],
        ['Z'],
    ],
    fish: [
        ['M', 0.9, 0.5],
        ['L', 0.65, 0.15],
        ['Q', 0.5, 0.05, 0.35, 0.15],
        ['L', 0.1, 0.5],
        ['L', 0.35, 0.85],
        ['Q', 0.5, 0.95, 0.65, 0.85],
        ['Z'],
        ['M', 0.9, 0.5],
        ['L', 0.98, 0.3],
        ['L', 0.98, 0.7],
        ['Z'],
    ],
    cat: [
        ['M', 0.15, 0.45],
        ['L', 0.02, 0.3],
        ['L', 0.1, 0.55],
        ['C', 0.1, 0.7, 0.25, 0.95, 0.35, 0.95],
        ['L', 0.65, 0.95],
        ['C', 0.75, 0.95, 0.9, 0.7, 0.9, 0.55],
        ['L', 0.98, 0.3],
        ['L', 0.85, 0.45],
        ['C', 0.85, 0.25, 0.7, 0.1, 0.5, 0.1],
        ['C', 0.3, 0.1, 0.15, 0.25, 0.15, 0.45],
        ['Z'],
    ],
    butterfly: [
        ['M', 0.5, 0.95],
        ['L', 0.42, 0.6],
        ['C', 0.1, 0.55, 0.02, 0.2, 0.15, 0.08],
        ['C', 0.28, -0.02, 0.42, 0.12, 0.5, 0.3],
        ['C', 0.58, 0.12, 0.72, -0.02, 0.85, 0.08],
        ['C', 0.98, 0.2, 0.9, 0.55, 0.58, 0.6],
        ['Z'],
    ],
    boat: [
        ['M', 0.05, 0.55],
        ['L', 0.08, 0.25],
        ['L', 0.35, 0.1],
        ['L', 0.5, 0.18],
        ['L', 0.5, 0.08],
        ['L', 0.55, 0.12],
        ['L', 0.95, 0.45],
        ['L', 0.98, 0.55],
        ['L', 0.85, 0.8],
        ['L', 0.15, 0.8],
        ['Z'],
    ],
    swan: [
        ['M', 0.1, 0.55],
        ['C', 0.05, 0.35, 0.15, 0.2, 0.3, 0.15],
        ['C', 0.45, 0.1, 0.6, 0.15, 0.65, 0.2],
        ['Q', 0.68, 0.15, 0.72, 0.08],
        ['Q', 0.8, 0.02, 0.85, 0.08],
        ['L', 0.82, 0.22],
        ['Q', 0.84, 0.3, 0.8, 0.4],
        ['C', 0.7, 0.75, 0.8, 0.92, 0.85, 0.95],
        ['L', 0.15, 0.95],
        ['C', 0.1, 0.85, 0.05, 0.7, 0.1, 0.55],
        ['Z'],
    ],
    crown: [
        ['M', 0.15, 0.5],
        ['L', 0.02, 0.5],
        ['L', 0.1, 0.1],
        ['L', 0.3, 0.35],
        ['L', 0.5, 0.05],
        ['L', 0.7, 0.35],
        ['L', 0.9, 0.1],
        ['L', 0.98, 0.5],
        ['L', 0.85, 0.5],
        ['L', 0.85, 0.95],
        ['L', 0.15, 0.95],
        ['Z'],
    ],
    rocket: [
        ['M', 0.5, 0.02],
        ['C', 0.42, 0.08, 0.35, 0.15, 0.3, 0.25],
        ['L', 0.45, 0.35],
        ['L', 0.45, 0.8],
        ['L', 0.35, 0.95],
        ['L', 0.65, 0.95],
        ['L', 0.55, 0.8],
        ['L', 0.55, 0.35],
        ['L', 0.7, 0.25],
        ['C', 0.65, 0.15, 0.58, 0.08, 0.5, 0.02],
        ['Z'],
    ],
    mushroom: [
        ['M', 0.2, 0.55],
        ['C', 0.05, 0.55, 0.05, 0.15, 0.2, 0.1],
        ['C', 0.3, 0.05, 0.4, 0.02, 0.5, 0.02],
        ['C', 0.6, 0.02, 0.7, 0.05, 0.8, 0.1],
        ['C', 0.95, 0.15, 0.95, 0.55, 0.8, 0.55],
        ['L', 0.65, 0.55],
        ['L', 0.65, 0.95],
        ['L', 0.35, 0.95],
        ['L', 0.35, 0.55],
        ['Z'],
    ],
    castle: [
        ['M', 0.05, 0.4],
        ['L', 0.15, 0.4],
        ['L', 0.15, 0.1],
        ['L', 0.25, 0.1],
        ['L', 0.25, 0.4],
        ['L', 0.4, 0.4],
        ['L', 0.4, 0.1],
        ['L', 0.5, 0.02],
        ['L', 0.6, 0.1],
        ['L', 0.6, 0.4],
        ['L', 0.75, 0.4],
        ['L', 0.75, 0.1],
        ['L', 0.85, 0.1],
        ['L', 0.85, 0.4],
        ['L', 0.95, 0.4],
        ['L', 0.95, 0.95],
        ['L', 0.05, 0.95],
        ['Z'],
    ],
};
// ═══════════════════════════════════════════════════════════
//  形状主题色
// ═══════════════════════════════════════════════════════════
const SHAPE_THEMES = {
    diamond: { fill: '#e0eef8', stroke: '#4a6fa5', accent: '#7eb8da', bg: '#1a1040', pieceBase: '#b8d4f0', pieceHighlight: '#e8f4ff' },
    heart: { fill: '#f8e0e0', stroke: '#c45a5a', accent: '#e88888', bg: '#3a1520', pieceBase: '#f0c8c8', pieceHighlight: '#fff0f0' },
    tree: { fill: '#e0f0d8', stroke: '#4a8040', accent: '#6aaa50', bg: '#152a10', pieceBase: '#c8e0b8', pieceHighlight: '#f0fff0' },
    star: { fill: '#fff8d8', stroke: '#c8a830', accent: '#e8c850', bg: '#2a2010', pieceBase: '#f8e8b0', pieceHighlight: '#fffff0' },
    arrow: { fill: '#e8d8c0', stroke: '#8a6040', accent: '#b88850', bg: '#2a1a10', pieceBase: '#e0c8a0', pieceHighlight: '#f8f0e0' },
    cross: { fill: '#e8e8e8', stroke: '#707070', accent: '#a0a0a0', bg: '#1a1a1a', pieceBase: '#d0d0d0', pieceHighlight: '#ffffff' },
    house: { fill: '#f0e0d0', stroke: '#8a6040', accent: '#c89860', bg: '#3a2010', pieceBase: '#e8d0b8', pieceHighlight: '#fff8f0' },
    fish: { fill: '#d8e8f8', stroke: '#4060a0', accent: '#6088c8', bg: '#102030', pieceBase: '#c0d8f0', pieceHighlight: '#f0f8ff' },
    cat: { fill: '#e8e0d8', stroke: '#6a5040', accent: '#a08060', bg: '#2a1a10', pieceBase: '#e0d0c0', pieceHighlight: '#faf5f0' },
    butterfly: { fill: '#f0d8f0', stroke: '#a040a0', accent: '#c860c8', bg: '#2a1030', pieceBase: '#e8c0e8', pieceHighlight: '#fff0ff' },
    boat: { fill: '#d8e0f0', stroke: '#4050a0', accent: '#6070c8', bg: '#101830', pieceBase: '#c0d0e8', pieceHighlight: '#f0f4ff' },
    swan: { fill: '#f0f0f0', stroke: '#606060', accent: '#909090', bg: '#202020', pieceBase: '#e8e8e8', pieceHighlight: '#ffffff' },
    crown: { fill: '#fff0d8', stroke: '#b89020', accent: '#d8b040', bg: '#3a2010', pieceBase: '#f8e8c0', pieceHighlight: '#fffff8' },
    rocket: { fill: '#e8e0f0', stroke: '#6040a0', accent: '#8868c0', bg: '#1a1030', pieceBase: '#d8c8e8', pieceHighlight: '#f8f0ff' },
    mushroom: { fill: '#f0e0e0', stroke: '#a05050', accent: '#c87878', bg: '#301a1a', pieceBase: '#e8d0d0', pieceHighlight: '#fff5f5' },
    castle: { fill: '#e8e0d0', stroke: '#706040', accent: '#a89870', bg: '#2a2010', pieceBase: '#e0d8c0', pieceHighlight: '#faf8f0' },
};
// ═══════════════════════════════════════════════════════════
//  场景描述文本 (装饰用，画在背景上)
// ═══════════════════════════════════════════════════════════
const SHAPE_SCENES = {
    diamond: '✦ 珠宝行 · 展示厅 ✦',
    heart: '♡ 情人节的信 ♡',
    tree: '🎄 平安夜壁炉旁 🎄',
    star: '✦ 天文台 · 星图 ✦',
    arrow: '➤ 古老罗盘 ➤',
    cross: '✚ 教堂彩窗 ✚',
    house: '⌂ 建筑师事务所 ⌂',
    fish: '♆ 渔村码头 ♆',
    cat: '🐈 老奶奶的客厅 🐈',
    butterfly: '🦋 标本陈列室 🦋',
    boat: '⛵ 船长室 ⛵',
    swan: '🦢 祖母的盒子 🦢',
    crown: '♛ 王室工坊 ♛',
    rocket: '🚀 发明家工作台 🚀',
    mushroom: '🍄 精灵森林 🍄',
    castle: '🏰 古城堡地图室 🏰',
};
// ═══════════════════════════════════════════════════════════
export class TangramRenderer {
    draw(ctx, logicalW, logicalH, rs) {
        const { state, cellSize: cs, gridOx: ox, gridOy: oy } = rs;
        const { gridSize, targetCells, pieces, shapeName } = state;
        // ── 羊皮纸背景 ──
        drawParchmentBg(ctx, logicalW, logicalH);
        const targetSet = new Set(targetCells.map(([r, c]) => `${r},${c}`));
        // ── 获取形状主题 ──
        const shapeKey = this.getShapeKey(shapeName);
        const theme = SHAPE_THEMES[shapeKey] || SHAPE_THEMES.diamond;
        const sceneText = SHAPE_SCENES[shapeKey] || '';
        // ── 场景标签 ──
        ctx.fillStyle = COLORS.goldDim;
        ctx.font = 'italic 11px var(--font-serif)';
        ctx.textAlign = 'right';
        ctx.fillText(sceneText, ox + gridSize * cs, oy - 6);
        // ── 形状标签 ──
        ctx.fillStyle = COLORS.ink;
        ctx.font = 'bold 12px var(--font-serif)';
        ctx.textAlign = 'left';
        ctx.fillText('目标形状 · ' + shapeName, ox, oy - 6);
        // ── 绘制目标轮廓 ──
        this.drawTargetSilhouette(ctx, ox, oy, gridSize, cs, targetSet, shapeKey, theme);
        // ── 绘制已放置的碎片 ──
        for (const pp of rs.placedPieces) {
            this.drawPlacedPiece(ctx, ox, oy, cs, pp, theme);
        }
        // ── hover 预览 ──
        if (rs.dragging && rs.hoveredCell) {
            const [gr, gc] = rs.hoveredCell;
            const offsetCells = this.offsetCells(rs.dragging.cells, gr, gc);
            const valid = this.canPlace(offsetCells, targetSet, rs.placedPieces, gridSize);
            for (const [r, c] of offsetCells) {
                if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && targetSet.has(`${r},${c}`)) {
                    const x = ox + c * cs, y = oy + r * cs;
                    ctx.fillStyle = valid ? 'rgba(122,154,90,0.25)' : 'rgba(184,92,58,0.2)';
                    ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
                    ctx.strokeStyle = valid ? 'rgba(122,154,90,0.4)' : 'rgba(184,92,58,0.35)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 2]);
                    ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
                    ctx.setLineDash([]);
                }
            }
        }
        // ── 分隔线 ──
        const trayY = oy + gridSize * cs + 12;
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox, trayY);
        ctx.lineTo(ox + gridSize * cs, trayY);
        ctx.stroke();
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px var(--font-serif)';
        ctx.textAlign = 'left';
        ctx.fillText('碎片', ox, trayY + 14);
        // ── 未放置碎片 (托盘区) ──
        for (let i = 0; i < rs.unplacedPieces.length; i++) {
            if (rs.dragging && rs.dragging.pieceIdx === i)
                continue;
            const up = rs.unplacedPieces[i];
            this.drawTrayPiece(ctx, up.trayX, up.trayY, up.trayW, up.trayH, up.piece.cells, cs, theme, i + 1);
        }
        // ── 拖拽 ghost ──
        if (rs.dragging) {
            this.drawDragGhost(ctx, rs.dragging, cs, theme);
        }
        // ── 放置计数 ──
        if (rs.placedPieces.length > 0) {
            ctx.fillStyle = COLORS.muted;
            ctx.font = '11px var(--font-serif)';
            ctx.textAlign = 'right';
            ctx.fillText(`已放置 ${rs.placedPieces.length}/${pieces.length}`, ox + gridSize * cs, oy - 6);
        }
    }
    // ─── 目标形状剪影 ──────────────────────────────────────
    drawTargetSilhouette(ctx, ox, oy, gridSize, cs, targetSet, shapeKey, theme) {
        const totalW = gridSize * cs;
        const totalH = gridSize * cs;
        // ── 背景氛围 ──
        // 带颜色的微妙底色，衬托形状
        ctx.fillStyle = theme.bg.replace(')', '').replace('rgb', 'rgba').replace('(', '(') || `rgba(0,0,0,0.1)`;
        const bgAlpha = '0.18';
        roundRect(ctx, ox - 4, oy - 4, totalW + 8, totalH + 8, 4);
        ctx.fillStyle = theme.bg + '18' || 'rgba(30,15,10,0.18)';
        ctx.fill();
        // ── 绘制形状轮廓 ──
        const path = SHAPE_PATHS[shapeKey];
        if (path) {
            ctx.save();
            ctx.beginPath();
            for (const cmd of path) {
                switch (cmd[0]) {
                    case 'M':
                        ctx.moveTo(ox + cmd[1] * totalW, oy + cmd[2] * totalH);
                        break;
                    case 'L':
                        ctx.lineTo(ox + cmd[1] * totalW, oy + cmd[2] * totalH);
                        break;
                    case 'Q':
                        ctx.quadraticCurveTo(ox + cmd[1] * totalW, oy + cmd[2] * totalH, ox + cmd[3] * totalW, oy + cmd[4] * totalH);
                        break;
                    case 'C':
                        ctx.bezierCurveTo(ox + cmd[1] * totalW, oy + cmd[2] * totalH, ox + cmd[3] * totalW, oy + cmd[4] * totalH, ox + cmd[5] * totalW, oy + cmd[6] * totalH);
                        break;
                    case 'Z':
                        ctx.closePath();
                        break;
                }
            }
            ctx.closePath();
            // 填充
            ctx.fillStyle = theme.fill;
            ctx.fill();
            // 描边
            ctx.strokeStyle = theme.stroke;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            // 内发光 / 高光边
            ctx.strokeStyle = theme.pieceHighlight;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        }
        // ── 格线叠加 (淡) ──
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const x = ox + c * cs, y = oy + r * cs;
                const isTarget = targetSet.has(`${r},${c}`);
                ctx.fillStyle = isTarget ? 'rgba(255,255,255,0.05)' : 'rgba(180,170,155,0.03)';
                ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
                ctx.strokeStyle = isTarget ? 'rgba(212,197,160,0.15)' : 'rgba(212,197,160,0.06)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
            }
        }
    }
    // ─── 已放置碎片 ────────────────────────────────────────
    drawPlacedPiece(ctx, ox, oy, cs, pp, theme) {
        const cells = pp.cells;
        if (cells.length === 0)
            return;
        const bb = this.getBB(cells);
        const px = ox + bb.minC * cs;
        const py = oy + bb.minR * cs;
        const pw = (bb.maxC - bb.minC + 1) * cs;
        const ph = (bb.maxR - bb.minR + 1) * cs;
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        roundRect(ctx, px + 3, py + 3, pw - 6, ph - 6, 3);
        ctx.fill();
        // 碎片底色
        ctx.fillStyle = theme.pieceBase;
        roundRect(ctx, px + 1, py + 1, pw - 2, ph - 2, 3);
        ctx.fill();
        // 高光斜面 (左上)
        ctx.fillStyle = theme.pieceHighlight;
        ctx.globalAlpha = 0.35;
        roundRect(ctx, px + 2, py + 2, pw - 4, ph * 0.45, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        // 描边
        ctx.strokeStyle = theme.stroke;
        ctx.lineWidth = 1.8;
        roundRect(ctx, px + 1, py + 1, pw - 2, ph - 2, 3);
        ctx.stroke();
        // 每个格子的装饰线
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        for (const [r, c] of cells) {
            const gx = ox + c * cs, gy = oy + r * cs;
            ctx.strokeRect(gx + 2, gy + 2, cs - 4, cs - 4);
        }
        ctx.globalAlpha = 1;
    }
    // ─── 托盘碎片 ──────────────────────────────────────────
    drawTrayPiece(ctx, tx, ty, tw, th, cells, cs, theme, label) {
        const bb = this.getBB(cells);
        // 托盘背景
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        roundRect(ctx, tx, ty, tw, th, 5);
        ctx.fill();
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 1;
        roundRect(ctx, tx, ty, tw, th, 5);
        ctx.stroke();
        // 画每个碎片格子
        for (const [r, c] of cells) {
            const cx = tx + 6 + (c - bb.minC) * cs;
            const cy = ty + 6 + (r - bb.minR) * cs;
            // 底色
            ctx.fillStyle = theme.pieceBase;
            roundRect(ctx, cx + 1, cy + 1, cs - 2, cs - 2, 2);
            ctx.fill();
            // 小高光
            ctx.fillStyle = theme.pieceHighlight;
            ctx.globalAlpha = 0.3;
            roundRect(ctx, cx + 2, cy + 2, cs - 4, (cs - 4) * 0.4, 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            // 描边
            ctx.strokeStyle = theme.stroke;
            ctx.lineWidth = 1;
            roundRect(ctx, cx + 1, cy + 1, cs - 2, cs - 2, 2);
            ctx.stroke();
        }
        // 标签
        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px var(--font-serif)';
        ctx.textAlign = 'center';
        ctx.fillText('#' + label, tx + tw / 2, ty + th + 12);
    }
    // ─── 拖拽 ghost ────────────────────────────────────────
    drawDragGhost(ctx, drag, cs, theme) {
        const bb = this.getBB(drag.cells);
        ctx.globalAlpha = 0.75;
        for (const [r, c] of drag.cells) {
            const cx = drag.ghostX - drag.offsetX + (c - bb.minC) * cs;
            const cy = drag.ghostY - drag.offsetY + (r - bb.minR) * cs;
            ctx.fillStyle = theme.pieceBase;
            roundRect(ctx, cx + 1, cy + 1, cs - 2, cs - 2, 3);
            ctx.fill();
            ctx.strokeStyle = theme.stroke;
            ctx.lineWidth = 2;
            roundRect(ctx, cx + 1, cy + 1, cs - 2, cs - 2, 3);
            ctx.stroke();
            // 光泽
            ctx.fillStyle = theme.pieceHighlight;
            ctx.globalAlpha = 0.4;
            roundRect(ctx, cx + 2, cy + 2, cs - 4, (cs - 4) * 0.4, 3);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Sparkle at ghost center
        const mx = drag.ghostX - drag.offsetX + (bb.maxC - bb.minC + 1) * cs / 2;
        const my = drag.ghostY - drag.offsetY + (bb.maxR - bb.minR + 1) * cs / 2;
        drawSparkle(ctx, mx, my, 4, 0.5);
    }
    // ─── 辅助 ──────────────────────────────────────────────
    getShapeKey(nameCN) {
        const map = {
            '钻石': 'diamond', '心形': 'heart', '圣诞树': 'tree',
            '星星': 'star', '箭头': 'arrow', '十字': 'cross',
            '房子': 'house', '鱼': 'fish', '猫': 'cat',
            '蝴蝶': 'butterfly', '帆船': 'boat', '天鹅': 'swan',
            '王冠': 'crown', '火箭': 'rocket', '蘑菇': 'mushroom', '城堡': 'castle',
        };
        return map[nameCN] || 'diamond';
    }
    getBB(cells) {
        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        for (const [r, c] of cells) {
            if (r < minR)
                minR = r;
            if (r > maxR)
                maxR = r;
            if (c < minC)
                minC = c;
            if (c > maxC)
                maxC = c;
        }
        return { minR, maxR, minC, maxC };
    }
    offsetCells(cells, gr, gc) {
        const bb = this.getBB(cells);
        return cells.map(([r, c]) => [r - bb.minR + gr, c - bb.minC + gc]);
    }
    canPlace(cells, targetSet, placed, gridSize) {
        const placedSet = new Set();
        for (const pp of placed) {
            for (const [r, c] of pp.cells)
                placedSet.add(`${r},${c}`);
        }
        for (const [r, c] of cells) {
            if (r < 0 || r >= gridSize || c < 0 || c >= gridSize)
                return false;
            if (!targetSet.has(`${r},${c}`))
                return false;
            if (placedSet.has(`${r},${c}`))
                return false;
        }
        return true;
    }
}
//# sourceMappingURL=TangramRenderer.js.map