/**
 * SharedComponents.ts — 统一 Layton 风格共享组件
 *
 * 暖羊皮纸色调，Victorian 装饰风格。
 * 去掉独立的 "插画面板" —— 谜题图即视觉。
 *
 * 提供：页面容器、标题栏、按钮行、提示系统、反馈区、装饰元素
 */

import type { PuzzleType } from '../../models/PuzzleData';
import { PUZZLE_TYPE_LABELS } from '../../models/PuzzleData';

// ═══════════════════════════════════════════════════════════
//  颜色常量 (Layton 暖色调)
// ═══════════════════════════════════════════════════════════

export const C = {
  parchment: '#faf8f0',
  parchmentDark: '#f0ead8',
  ink: '#2c1810',
  inkLight: '#5c4030',
  gold: '#c8a84e',
  goldDim: '#a08840',
  accent: '#b85c3a',
  border: '#d4c5a0',
  hint: '#7a9a5a',
  error: '#b85c3a',
  success: '#5a8a4a',
  muted: '#8c7b6a',
  canvasBg: '#f5f0e8',
} as const;

// ═══════════════════════════════════════════════════════════
//  谜题页面容器 — 统一的羊皮纸卡片
// ═══════════════════════════════════════════════════════════

export interface PuzzlePageContainer {
  el: HTMLElement;
  canvasArea: HTMLElement;
  setQuestion: (text: string) => void;
}

export function createPuzzlePage(width: number): PuzzlePageContainer {
  const el = document.createElement('div');
  Object.assign(el.style, {
    display: 'flex', flexDirection: 'column', gap: '0',
    maxWidth: width + 'px', width: '100%', margin: '0 auto',
    fontFamily: 'inherit',
    background: C.parchment,
    borderRadius: '10px',
    border: '1px solid ' + C.border,
    boxShadow: '0 4px 24px rgba(60,30,10,0.1)',
    overflow: 'hidden',
  });

  // ── 顶部装饰线 ──
  const topOrnament = document.createElement('div');
  topOrnament.style.cssText = 'height:4px;background:linear-gradient(90deg,'+C.goldDim+','+C.gold+','+C.goldDim+');';

  // ── 标题栏 ──
  const headerRow = document.createElement('div');
  Object.assign(headerRow.style, {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px 6px', gap: '10px',
    background: C.parchment,
  });

  const leftGroup = document.createElement('div');
  leftGroup.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const puzzleNumEl = document.createElement('span');
  puzzleNumEl.style.cssText =
    'font-size:0.72rem;color:'+C.muted+';font-family:var(--font-serif);white-space:nowrap;';

  const catEl = document.createElement('span');
  catEl.style.cssText =
    'font-size:0.68rem;color:'+C.goldDim+';background:'+C.parchmentDark+
    ';padding:2px 8px;border-radius:10px;border:1px solid '+C.border+
    ';font-family:var(--font-serif);';

  leftGroup.appendChild(puzzleNumEl);
  leftGroup.appendChild(catEl);

  const picEl = document.createElement('span');
  picEl.style.cssText =
    'font-size:0.72rem;font-weight:700;color:'+C.goldDim+
    ';font-family:var(--font-serif);white-space:nowrap;';

  headerRow.appendChild(leftGroup);
  headerRow.appendChild(picEl);

  // ── 问题描述 ──
  const questionEl = document.createElement('div');
  Object.assign(questionEl.style, {
    padding: '8px 16px 6px',
    fontSize: '0.82rem',
    lineHeight: '1.65',
    color: C.inkLight,
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    background: C.parchment,
    borderBottom: '1px solid ' + C.border,
  });

  // ── Canvas 交互区 ──
  const canvasArea = document.createElement('div');
  canvasArea.style.cssText = 'position:relative;';

  // ── 组装 ──
  el.appendChild(topOrnament);
  el.appendChild(headerRow);
  el.appendChild(questionEl);
  el.appendChild(canvasArea);

  return {
    el,
    canvasArea,
    setQuestion: (text: string) => { questionEl.textContent = text; },
  };
}

// ═══════════════════════════════════════════════════════════
//  标题栏更新器
// ═══════════════════════════════════════════════════════════

export function createHeader(type: PuzzleType, title: string, picarat: number, puzzleNum?: number): HTMLElement {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px 6px', gap: '10px',
  });

  const leftGroup = document.createElement('div');
  leftGroup.style.cssText = 'display:flex;align-items:center;gap:8px;min-width:0;';

  if (puzzleNum !== undefined) {
    const numEl = document.createElement('span');
    numEl.textContent = '#' + String(puzzleNum).padStart(3, '0');
    numEl.style.cssText = 'font-size:0.72rem;color:'+C.muted+';font-family:var(--font-serif);white-space:nowrap;';
    leftGroup.appendChild(numEl);
  }

  const cat = document.createElement('span');
  cat.textContent = PUZZLE_TYPE_LABELS[type];
  cat.style.cssText =
    'font-size:0.68rem;color:'+C.goldDim+';background:'+C.parchmentDark+
    ';padding:2px 8px;border-radius:10px;border:1px solid '+C.border+
    ';font-family:var(--font-serif);white-space:nowrap;';

  const titleEl = document.createElement('span');
  titleEl.textContent = title;
  Object.assign(titleEl.style, {
    fontSize: '0.85rem', fontWeight: '700', color: C.ink,
    fontFamily: 'var(--font-serif)',
    textAlign: 'center', flex: '1', minWidth: '0',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  });

  const pic = document.createElement('span');
  pic.innerHTML = '✦ ' + picarat + ' picarats';
  pic.style.cssText =
    'font-size:0.72rem;font-weight:700;color:'+C.goldDim+
    ';font-family:var(--font-serif);white-space:nowrap;';

  leftGroup.appendChild(cat);
  row.appendChild(leftGroup);
  row.appendChild(titleEl);
  row.appendChild(pic);
  return row;
}

// ═══════════════════════════════════════════════════════════
//  按钮行
// ═══════════════════════════════════════════════════════════

export interface ButtonRow {
  el: HTMLElement;
  showSubmit: () => void;
  showNext: () => void;
  onReset: (cb: () => void) => void;
  onSubmit: (cb: () => void) => void;
  onNext: (cb: () => void) => void;
  onHint: (cb: () => void) => void;
  setHintCoins: (n: number) => void;
}

export function createButtonRow(): ButtonRow {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap',
    padding: '12px 16px', background: C.parchment,
    borderTop: '1px solid ' + C.border,
  });

  let resetCb: (() => void) | null = null;
  let submitCb: (() => void) | null = null;
  let nextCb: (() => void) | null = null;
  let hintCb: (() => void) | null = null;
  let hintCoins = 3;

  const btnStyle = (bg: string, color: string, border: string): Partial<CSSStyleDeclaration> => ({
    padding: '10px 18px', borderRadius: '6px', border: '1px solid ' + border,
    background: bg, color, fontSize: '0.8rem',
    fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease',
  });

  const make = (text: string, bg: string, color = '#fffef5', border?: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = text;
    const style = btnStyle(bg, color, border || bg);
    Object.assign(b.style, style);
    b.addEventListener('mouseenter', () => { b.style.filter = 'brightness(1.1)'; });
    b.addEventListener('mouseleave', () => { b.style.filter = ''; });
    return b;
  };

  const submitBtn = make('✓ 提交答案', '#5a8a4a');
  submitBtn.addEventListener('click', () => submitCb?.());
  const resetBtn = make('↺ 重置', C.parchmentDark, C.ink, C.border);
  resetBtn.addEventListener('click', () => resetCb?.());
  const hintBtn = make('💡 提示 (' + hintCoins + ')', C.parchmentDark, C.ink, C.border);
  hintBtn.addEventListener('click', () => hintCb?.());
  const nextBtn = make('→ 下一题', '#c8a84e', '#fffef5', '#a08840');
  nextBtn.style.display = 'none';
  nextBtn.addEventListener('click', () => nextCb?.());

  row.appendChild(resetBtn);
  row.appendChild(hintBtn);
  row.appendChild(submitBtn);
  row.appendChild(nextBtn);

  return {
    el: row,
    showSubmit: () => { submitBtn.style.display = ''; resetBtn.style.display = ''; hintBtn.style.display = ''; nextBtn.style.display = 'none'; },
    showNext: () => { submitBtn.style.display = 'none'; resetBtn.style.display = 'none'; hintBtn.style.display = 'none'; nextBtn.style.display = ''; },
    onReset: (cb) => { resetCb = cb; },
    onSubmit: (cb) => { submitCb = cb; },
    onNext: (cb) => { nextCb = cb; },
    onHint: (cb) => { hintCb = cb; },
    setHintCoins: (n: number) => { hintCoins = n; hintBtn.textContent = '💡 提示 (' + n + ')'; },
  };
}

// ═══════════════════════════════════════════════════════════
//  提示系统
// ═══════════════════════════════════════════════════════════

export interface HintPanel {
  el: HTMLElement;
  reveal: () => boolean;  // returns true if hint was shown
  coinsRemaining: () => number;
  disable: () => void;
}

export function createHintPanel(hints: string[], initialCoins = 3): HintPanel {
  let coins = initialCoins;
  let revealed = 0;

  const el = document.createElement('div');
  Object.assign(el.style, {
    padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: '6px',
    background: C.parchment,
  });

  const reveal = (): boolean => {
    if (coins <= 0 || revealed >= hints.length) return false;
    coins--;
    const idx = revealed++;
    const levels = ['提示一', '提示二', '提示三（超级提示）'];
    const div = document.createElement('div');
    div.innerHTML = '<span style="color:'+C.goldDim+';font-weight:600">'+levels[idx]+'：</span> ' + hints[idx];
    Object.assign(div.style, {
      padding: '7px 10px', borderRadius: '6px',
      background: C.parchmentDark,
      border: '1px solid ' + C.border,
      fontSize: '0.76rem', lineHeight: '1.5', color: C.inkLight,
      fontFamily: 'var(--font-serif)',
    });
    el.appendChild(div);
    return true;
  };

  return {
    el,
    reveal,
    coinsRemaining: () => coins,
    disable: () => { coins = 0; },
  };
}

// ═══════════════════════════════════════════════════════════
//  反馈区
// ═══════════════════════════════════════════════════════════

export function createFeedback(): HTMLElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    textAlign: 'center', fontSize: '0.82rem', minHeight: '24px',
    fontWeight: '600', padding: '6px 16px',
    fontFamily: 'var(--font-serif)',
    background: C.parchment,
  });
  return el;
}

// ═══════════════════════════════════════════════════════════
//  装饰分隔线
// ═══════════════════════════════════════════════════════════

export function createDivider(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText =
    'height:1px;background:linear-gradient(90deg,transparent,'+C.border+',transparent);margin:0 16px;';
  return el;
}

// ═══════════════════════════════════════════════════════════
//  绘画辅助：圆角矩形
// ═══════════════════════════════════════════════════════════

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
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

// ═══════════════════════════════════════════════════════════
//  Canvas 背景装饰 — 羊皮纸纹理
// ═══════════════════════════════════════════════════════════

export function drawParchmentBg(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // 暖色渐变背景
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#faf8f0');
  grad.addColorStop(0.5, '#f5f0e8');
  grad.addColorStop(1, '#ede4d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 做旧斑点
  const rng = mulberry32(42);
  ctx.fillStyle = 'rgba(180,160,130,0.06)';
  for (let i = 0; i < 30; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 2 + rng() * 28;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 装饰边框
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 8, 8, w - 16, h - 16, 6);
  ctx.stroke();

  // 内框
  ctx.strokeStyle = 'rgba(212,197,160,0.3)';
  ctx.lineWidth = 0.5;
  roundRect(ctx, 14, 14, w - 28, h - 28, 4);
  ctx.stroke();

  // 四角装饰
  const corners: [number, number, number, number][] = [
    [16, 16, 1, 1], [w - 16, 16, -1, 1],
    [16, h - 16, 1, -1], [w - 16, h - 16, -1, -1],
  ];
  ctx.strokeStyle = C.goldDim;
  ctx.lineWidth = 1;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 16);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 16, cy);
    ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════════
//  Seeded RNG (用于绘制装饰)
// ═══════════════════════════════════════════════════════════

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
