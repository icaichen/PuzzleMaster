/**
 * PuzzleRenderer.ts — 谜题视觉元素渲染接口
 *
 * 这是谜题的"视觉内容层"，独立于 UI chrome（边框、按钮、卡片）。
 * 每种谜题类型的 Renderer 负责绘制该类型特有的视觉元素：
 * - 目标形状/轮廓
 * - 可交互物件的外观
 * - 场景装饰/氛围
 *
 * 所有渲染基于 Canvas 2D。不使用外部图片，全部用代码绘制。
 */

export interface IRenderer {
  /** 渲染完整一帧到 canvas context */
  draw(ctx: CanvasRenderingContext2D): void;
}

/** 渲染参数：canvas 尺寸、缩放因子 */
export interface RenderContext {
  logicalW: number;
  logicalH: number;
  scale: number;
}

/** 创建一个受 scale 影响的 render setup */
export function setupRender(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  scale: number,
): RenderContext {
  const logicalW = canvasW / scale;
  const logicalH = canvasH / scale;
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.save();
  ctx.scale(scale, scale);
  return { logicalW, logicalH, scale };
}

export function teardownRender(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════
//  颜色常量 — Layton 暖色调
// ═══════════════════════════════════════════════════════════

export const COLORS = {
  parchment: '#faf8f0',
  parchmentDark: '#f0ead8',
  ink: '#2c1810',
  inkLight: '#5c4030',
  gold: '#c8a84e',
  goldDim: '#a08840',
  accent: '#b85c3a',
  border: '#d4c5a0',
  success: '#5a8a4a',
  error: '#b85c3a',
  muted: '#8c7b6a',
} as const;

// ═══════════════════════════════════════════════════════════
//  共享 Canvas 绘制工具
// ═══════════════════════════════════════════════════════════

export function drawParchmentBg(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#faf8f0');
  grad.addColorStop(0.5, '#f5f0e8');
  grad.addColorStop(1, '#ede4d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Aged spots
  const spots = seededRNG(42);
  ctx.fillStyle = 'rgba(180,160,130,0.06)';
  for (let i = 0; i < 30; i++) {
    const x = spots() * w;
    const y = spots() * h;
    const r = 2 + spots() * 28;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Decorative border
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 8, 8, w - 16, h - 16, 6);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212,197,160,0.3)';
  ctx.lineWidth = 0.5;
  roundRect(ctx, 14, 14, w - 28, h - 28, 4);
  ctx.stroke();

  // Corner ornaments
  const corners: [number, number, number, number][] = [
    [16, 16, 1, 1], [w - 16, 16, -1, 1],
    [16, h - 16, 1, -1], [w - 16, h - 16, -1, -1],
  ];
  ctx.strokeStyle = COLORS.goldDim;
  ctx.lineWidth = 1;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 16);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 16, cy);
    ctx.stroke();
  }
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
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

export function seededRNG(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** 绘制四角星 sparkle */
export function drawSparkle(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fffef5';
  ctx.beginPath();
  const s = size;
  ctx.moveTo(cx, cy - s);
  ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.3, cx + s, cy);
  ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.3, cx, cy + s);
  ctx.quadraticCurveTo(cx - s * 0.3, cy + s * 0.3, cx - s, cy);
  ctx.quadraticCurveTo(cx - s * 0.3, cy - s * 0.3, cx, cy - s);
  ctx.fill();
  // 细十字
  ctx.strokeStyle = 'rgba(255,254,245,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 1.4); ctx.lineTo(cx, cy + s * 1.4);
  ctx.moveTo(cx - s * 1.4, cy); ctx.lineTo(cx + s * 1.4, cy);
  ctx.stroke();
  ctx.restore();
}
