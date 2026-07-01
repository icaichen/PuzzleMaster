/**
 * capture_v4.mjs — 新布局系统截图
 *
 * 直接通过 window.__gameManager + PuzzleRegistry 控制谜题渲染。
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'screenshots/v4';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 520, height: 920 } });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // ─── 01: 首页 ───
  await page.screenshot({ path: `${OUT}-01-home.png`, fullPage: false });
  console.log('✓ 01-home');

  // ─── 02: Tangram ───
  await page.evaluate(async () => {
    const { TangramEngine } = await import('/src/engines/TangramEngine.ts');
    const engine = new TangramEngine();
    const puzzle = engine.generate(3, 42);
    if (!puzzle) return;

    const { TangramLayout } = await import('/src/views/layouts/TangramLayout.ts');
    const layout = new TangramLayout();
    const container = document.getElementById('game-container');
    if (!container) return;

    // Show game container
    const home = document.getElementById('home-screen');
    if (home) home.style.display = 'none';
    container.style.display = 'flex';
    const progress = document.getElementById('story-progress');
    if (progress) { progress.style.display = 'block'; progress.textContent = '第 1 题 · 🧩 拼图挑战'; }
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) homeBtn.style.display = 'block';

    layout.mount(container);
    layout.setCallbacks({ onWin: () => {}, onNext: () => {} });
    layout.render({ puzzle, picarat: 30 });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}-02-tangram.png`, fullPage: false });
  console.log('✓ 02-tangram — 插画 + 目标形状 + 碎片托盘');

  // ─── 03: Tangram 选中碎片 ──
  // Click on the first piece in the tray
  const canvas02 = await page.$('canvas');
  if (canvas02) {
    const box = await canvas02.boundingBox();
    // Pieces tray is at the bottom. Click around center-bottom
    await page.mouse.click(box.x + box.width * 0.15, box.y + box.height * 0.82);
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${OUT}-03-tangram-selected.png`, fullPage: false });
  console.log('✓ 03-tangram-selected — 碎片选中高亮');

  // ─── 04: Path Finding ───
  await page.evaluate(async () => {
    const container = document.getElementById('game-container');
    if (container) container.innerHTML = '';

    const { PathEngine } = await import('/src/engines/PathEngine.ts');
    const engine = new PathEngine();
    const puzzle = engine.generate(2, 123);
    if (!puzzle) return;

    const { PathFindingLayout } = await import('/src/views/layouts/PathFindingLayout.ts');
    const layout = new PathFindingLayout();
    const progress = document.getElementById('story-progress');
    if (progress) progress.textContent = '第 2 题 · ✏️ 一笔画';

    layout.mount(container);
    layout.setCallbacks({ onWin: () => {}, onNext: () => {} });
    layout.render({ puzzle, picarat: 20 });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}-04-path.png`, fullPage: false });
  console.log('✓ 04-path — 插画 + 点阵画布');

  // ─── 05: Path 画线 ──
  const canvas04 = await page.$$('canvas');
  if (canvas04.length > 0) {
    const box = await canvas04[canvas04.length - 1].boundingBox();
    // Click on S dot and adjacent dots
    await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.32);
    await page.waitForTimeout(200);
    await page.mouse.click(box.x + box.width * 0.28, box.y + box.height * 0.32);
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${OUT}-05-path-drawn.png`, fullPage: false });
  console.log('✓ 05-path-drawn — 玩家绘制路径');

  // ─── 06: Number Grid ──
  await page.evaluate(async () => {
    const container = document.getElementById('game-container');
    if (container) container.innerHTML = '';

    const { NumberGridEngine } = await import('/src/engines/NumberGridEngine.ts');
    const engine = new NumberGridEngine();
    const puzzle = engine.generate(2, 456);
    if (!puzzle) return;

    const { NumberGridLayout } = await import('/src/views/layouts/NumberGridLayout.ts');
    const layout = new NumberGridLayout();
    const progress = document.getElementById('story-progress');
    if (progress) progress.textContent = '第 3 题 · 🔢 数字网格';

    layout.mount(container);
    layout.setCallbacks({ onWin: () => {}, onNext: () => {} });
    layout.render({ puzzle, picarat: 20 });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}-06-number-grid.png`, fullPage: false });
  console.log('✓ 06-number-grid — 插画 + 数字网格 + 键盘提示');

  // ─── 07: Number Grid 选中填数字 ──
  const canvas06 = await page.$$('canvas');
  if (canvas06.length > 0) {
    const lastCanvas = canvas06[canvas06.length - 1];
    const box = await lastCanvas.boundingBox();
    // Click on an empty cell
    await page.mouse.click(box.x + box.width * 0.32, box.y + box.height * 0.32);
    await page.waitForTimeout(200);
    // Type a number
    await page.keyboard.press('2');
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${OUT}-07-grid-input.png`, fullPage: false });
  console.log('✓ 07-grid-input — 玩家输入数字');

  await browser.close();
  console.log('\n全部完成！');
}

main().catch(e => { console.error(e); process.exit(1); });
