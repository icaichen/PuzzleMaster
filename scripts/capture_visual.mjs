import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

  // ── 1. Home screen ──
  await page.goto(BASE);
  await page.waitForSelector('#story-mode-btn');
  await page.screenshot({ path: 'screenshots/v01-home.png', fullPage: true });
  console.log('✓ v01-home');

  // ── 2. Start Story Mode ──
  await page.click('#story-mode-btn');
  await page.waitForTimeout(800);

  // Now we need to cycle through puzzles until we find visual ones.
  // Strategy: click through puzzles quickly, detect visual types by canvas presence.

  // First, capture whatever puzzle comes up
  await page.screenshot({ path: 'screenshots/v02-story-puzzle.png', fullPage: true });
  console.log('✓ v02-first-puzzle');

  // Now keep clicking "下一题" or answering to cycle through puzzles
  // We'll try to reach path_finding and number_grid types

  // Helper: answer incorrectly and move on
  async function skipPuzzle() {
    // Try clicking visual submit button
    const submitBtns = await page.$$('button');
    for (const btn of submitBtns) {
      const text = await btn.textContent();
      if (text?.includes('提交')) {
        await btn.click();
        await page.waitForTimeout(300);
        break;
      }
    }
    // Try clicking "下一题"
    await page.waitForTimeout(200);
    const nextBtns = await page.$$('button');
    for (const btn of nextBtns) {
      const text = await btn.textContent();
      if (text?.includes('下一题') || text?.includes('→')) {
        await btn.click();
        await page.waitForTimeout(800);
        return true;
      }
    }
    return false;
  }

  // Cycle through up to 15 puzzles looking for visual types
  let pathScreenshot = false;
  let gridScreenshot = false;

  for (let i = 0; i < 20; i++) {
    // Check if current puzzle has a canvas with visual content
    const canvasEl = await page.$('canvas');
    const progressText = await page.$eval('#story-progress', el => el.textContent || '').catch(() => '');

    if (canvasEl) {
      // Check if there's drawn content by checking canvas data
      const hasContent = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return false;
        const ctx = c.getContext('2d');
        if (!ctx) return false;
        const data = ctx.getImageData(0, 0, c.width, c.height);
        // Check if there are non-zero pixels beyond the background
        let count = 0;
        for (let p = 0; p < data.data.length; p += 4) {
          if (data.data[p] !== 0x13 && data.data[p + 1] !== 0x13 && data.data[p + 2] !== 0x2b) {
            count++;
          }
        }
        return count > 100;
      });

      if (hasContent) {
        // Check the dots/text pattern to determine type
        const puzzleType = await page.evaluate(() => {
          const el = document.querySelector('#story-progress');
          const text = el?.textContent || '';
          if (text.includes('一笔画')) return 'path';
          if (text.includes('数字网格')) return 'grid';
          return 'unknown';
        });

        if (puzzleType === 'path' && !pathScreenshot) {
          await page.screenshot({ path: 'screenshots/v03-path-finding.png', fullPage: true });
          console.log('✓ v03-path-finding');
          pathScreenshot = true;
        }
        if (puzzleType === 'grid' && !gridScreenshot) {
          await page.screenshot({ path: 'screenshots/v04-number-grid.png', fullPage: true });
          console.log('✓ v04-number-grid');
          gridScreenshot = true;
        }
      }
    }

    if (pathScreenshot && gridScreenshot) break;
    if (i >= 19) break;

    // Skip to next puzzle
    const skipped = await skipPuzzle();
    if (!skipped) {
      // Try alternative: click home and restart story mode
      const homeBtn = await page.$('#home-btn');
      if (homeBtn) {
        await homeBtn.click();
        await page.waitForTimeout(500);
        await page.click('#story-mode-btn');
        await page.waitForTimeout(800);
      }
    }
  }

  // ── Extra: capture an answered path puzzle ──
  if (pathScreenshot) {
    // Go back to story mode and try to find path again
    // Just capture whatever we have
  }

  // ── 5. Capture a path puzzle with some drawing ──
  // Go through story again and draw on a canvas if we find one
  await page.goto(BASE);
  await page.waitForTimeout(300);
  await page.click('#story-mode-btn');
  await page.waitForTimeout(800);

  // Try to find a canvas puzzle and draw on it
  for (let i = 0; i < 15; i++) {
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        // Click some points on the canvas to draw
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.mouse.click(cx - 40, cy);
        await page.waitForTimeout(200);
        await page.mouse.click(cx, cy);
        await page.waitForTimeout(200);
        await page.mouse.click(cx + 40, cy);
        await page.waitForTimeout(200);

        const progressText = await page.$eval('#story-progress', el => el.textContent || '').catch(() => '');
        const prefix = progressText.includes('一笔画') ? 'path' : progressText.includes('数字网格') ? 'grid' : 'visual';
        await page.screenshot({ path: `screenshots/v05-${prefix}-interacted.png`, fullPage: true });
        console.log(`✓ v05-${prefix}-interacted`);
        break;
      }
    }
    const skipped = await skipPuzzle();
    if (!skipped) break;
  }

  await browser.close();
  console.log('\nDone! Screenshots in screenshots/');
}

main().catch(e => { console.error(e); process.exit(1); });
