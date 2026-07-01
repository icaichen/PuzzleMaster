/**
 * capture_v6.mjs — Screenshot after Visual Element System
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const OUT = '/Users/chencai/Development/PuzzleMaster/screenshots';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function snap(name, fn) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 600, height: 900 });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(800);
  await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/v6_${name}.png`, fullPage: true });
  console.log('✓ v6_' + name);
  await page.close();
}

/** Start story mode then keep loading until we get target type */
async function loadPuzzleOfType(page, targetType) {
  await page.evaluate(() => {
    // Click story mode button
    const btn = document.querySelector('#story-mode-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);

  for (let i = 0; i < 50; i++) {
    const type = await page.evaluate(() => window.__gameManager?.currentPuzzleType || '');
    if (type === targetType) {
      console.log(`  → Got ${targetType} after ${i} loads`);
      return;
    }
    await page.evaluate(() => window.__gameManager?.loadNextPuzzle());
    await page.waitForTimeout(300);
  }
  console.log(`  ⚠ Could not get ${targetType}, taking current`);
}

// --- Home ---
await snap('01_home', async () => {});

// --- Tangram (JIGSAW / jigsaw) ---
await snap('02_tangram_diamond', async (page) => {
  await loadPuzzleOfType(page, 'jigsaw');
});

// --- NumberGrid ---
await snap('03_numbergrid', async (page) => {
  await loadPuzzleOfType(page, 'number_grid');
});

// --- PathFinding ---
await snap('04_pathfinding', async (page) => {
  await loadPuzzleOfType(page, 'path_finding');
});

await browser.close();
console.log('\nDone. All v6 screenshots captured.');
