/**
 * capture_v5.mjs — 截图 v5: Layton warm parchment theme
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5175';
const OUT = '/Users/chencai/Development/PuzzleMaster/screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 460, height: 800 } });

  // 1. Home screen
  await page.goto(BASE);
  await page.waitForSelector('#home-screen');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: OUT + '/v5_01_home.png', fullPage: true });
  console.log('1/4 home');

  // Helper: navigate to specific puzzle type
  async function navigateToType(targetType, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const type = await page.evaluate(() => {
        const gm = window.__gameManager;
        if (!gm || !gm.currentPuzzle) return null;
        return gm.currentPuzzle.type;
      });
      if (type === targetType) return true;
      await page.evaluate(() => { window.__gameManager?.loadNextPuzzle(); });
      await page.waitForTimeout(500);
    }
    return false;
  }

  // 2. Start story mode
  await page.click('#story-mode-btn');
  await page.waitForTimeout(1000);

  // Log what we get
  const firstType = await page.evaluate(() => {
    const gm = window.__gameManager;
    return gm?.currentPuzzle?.type;
  });
  console.log('First puzzle type:', firstType);

  // 2a. Tangram (type = 'jigsaw')
  const gotTangram = await navigateToType('jigsaw');
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/v5_02_tangram.png', fullPage: true });
  console.log('2/4 tangram:', gotTangram ? 'found' : 'not found');

  // 2b. Number grid (type = 'number_grid')
  const gotGrid = await navigateToType('number_grid');
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/v5_03_numbergrid.png', fullPage: true });
  console.log('3/4 numbergrid:', gotGrid ? 'found' : 'not found');

  // 2c. Path finding (type = 'path_finding')
  const gotPath = await navigateToType('path_finding');
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/v5_04_pathfinding.png', fullPage: true });
  console.log('4/4 path:', gotPath ? 'found' : 'not found');

  await browser.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
