/**
 * PathRenderer.ts — 一笔画路径视觉渲染器
 *
 * 绘制星空/星座主题的一笔画谜题：
 * - 节点：星形标记，发光效果
 * - 给定边：星座虚线
 * - 玩家路径：金色发光轨迹
 * - 起/终点：特殊标记
 */

import { COLORS, drawParchmentBg, drawSparkle } from './PuzzleRenderer';
import type { PathPuzzleState } from '../engines/PathEngine';

export interface PathRenderState {
  state: PathPuzzleState;
  cellSize: number;
  ox: number;
  oy: number;
  playerPath: number[];
  submitted: boolean;
  isCorrect: boolean;
}

export class PathRenderer {
  draw(ctx: CanvasRenderingContext2D, logicalW: number, logicalH: number, rs: PathRenderState): void {
    const { state, cellSize: cs, ox, oy, playerPath, submitted, isCorrect } = rs;
    const { gridSize, givenEdges, startNode, endNode } = state;

    // ── 羊皮纸背景 ──
    drawParchmentBg(ctx, logicalW, logicalH);

    const getXY = (idx: number): [number, number] => {
      const row = Math.floor(idx / gridSize);
      const col = idx % gridSize;
      return [ox + col * cs + cs / 2, oy + row * cs + cs / 2];
    };

    // ── 标题 ──
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 13px var(--font-serif)';
    ctx.textAlign = 'center';
    ctx.fillText(`${gridSize}×${gridSize} 一笔画星图`, ox + (gridSize * cs) / 2, oy - 6);

    // ── 场景标签 ──
    ctx.fillStyle = COLORS.goldDim;
    ctx.font = 'italic 11px var(--font-serif)';
    ctx.textAlign = 'right';
    ctx.fillText('✦ 宫廷天文台 · 星图馆 ✦', ox + gridSize * cs, oy - 6);

    // ── 夜间星空背景 ──
    const bgGrad = ctx.createRadialGradient(
      ox + gridSize * cs / 2, oy + gridSize * cs / 2, 10,
      ox + gridSize * cs / 2, oy + gridSize * cs / 2, gridSize * cs,
    );
    bgGrad.addColorStop(0, 'rgba(25,20,45,0.25)');
    bgGrad.addColorStop(0.7, 'rgba(18,15,35,0.15)');
    bgGrad.addColorStop(1, 'rgba(245,240,232,0.0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(ox - 4, oy - 4, gridSize * cs + 8, gridSize * cs + 8);

    // 背景小星点
    ctx.fillStyle = 'rgba(255,255,240,0.15)';
    for (let i = 0; i < 20; i++) {
      const sx = ox + (i * 67 % gridSize) * cs + cs * (i * 0.13 % 1);
      const sy = oy + (i * 43 % gridSize) * cs + cs * (i * 0.17 % 1);
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── 给定边 (星座虚线) ──
    ctx.strokeStyle = 'rgba(160,140,110,0.5)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([6, 3]);
    for (const [a, b] of givenEdges) {
      const [ax, ay] = getXY(a);
      const [bx, by] = getXY(b);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // ── 已走过路径的淡影 ──
    if (playerPath.length > 1) {
      ctx.strokeStyle = 'rgba(200,168,78,0.1)';
      ctx.lineWidth = cs * 0.35;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const [fx, fy] = getXY(playerPath[0]);
      ctx.moveTo(fx, fy);
      for (let i = 1; i < playerPath.length; i++) {
        const [nx, ny] = getXY(playerPath[i]);
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }

    // ── 玩家路径 (金色发光轨迹) ──
    if (playerPath.length > 1) {
      // Glow layer
      ctx.strokeStyle = 'rgba(200,168,78,0.2)';
      ctx.lineWidth = cs * 0.55;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const [fx, fy] = getXY(playerPath[0]);
      ctx.moveTo(fx, fy);
      for (let i = 1; i < playerPath.length; i++) {
        const [nx, ny] = getXY(playerPath[i]);
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();

      // Main line
      const pathColor = submitted
        ? (isCorrect ? COLORS.success : COLORS.error)
        : COLORS.gold;
      ctx.strokeStyle = pathColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = submitted
        ? (isCorrect ? 'rgba(90,138,74,0.4)' : 'rgba(184,92,58,0.4)')
        : 'rgba(200,168,78,0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      for (let i = 1; i < playerPath.length; i++) {
        const [nx, ny] = getXY(playerPath[i]);
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ── 节点 (星形) ──
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const idx = r * gridSize + c;
        const [dx, dy] = getXY(idx);
        const visited = playerPath.includes(idx);
        const isStart = idx === startNode;
        const isEnd = idx === endNode;

        const radius = cs * 0.09;

        if (isStart || isEnd) {
          // 起终点：大光晕 + 星形
          ctx.fillStyle = isStart
            ? 'rgba(90,138,74,0.3)'
            : 'rgba(184,92,58,0.3)';
          ctx.beginPath();
          ctx.arc(dx, dy, radius + 8, 0, Math.PI * 2);
          ctx.fill();

          this.drawStarNode(ctx, dx, dy, radius + 3, isStart ? COLORS.success : COLORS.accent);

          ctx.fillStyle = '#fffef9';
          ctx.font = `bold ${cs * 0.18}px var(--font-serif)`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isStart ? '起' : '终', dx, dy);
        } else if (visited) {
          // 已访问：发光星
          ctx.fillStyle = 'rgba(200,168,78,0.2)';
          ctx.beginPath();
          ctx.arc(dx, dy, radius + 5, 0, Math.PI * 2);
          ctx.fill();

          this.drawStarNode(ctx, dx, dy, radius + 1, COLORS.gold);
        } else {
          // 未访问：暗星
          ctx.fillStyle = 'rgba(140,123,106,0.3)';
          ctx.beginPath();
          ctx.arc(dx, dy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(140,123,106,0.15)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  // ─── 星形节点 ──────────────────────────────────────────

  private drawStarNode(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    r: number, color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    const spikes = 4;
    const outerR = r;
    const innerR = r * 0.4;

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 光晕
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
