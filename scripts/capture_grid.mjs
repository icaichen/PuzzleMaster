import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

  await page.goto(BASE);
  await page.waitForSelector('#story-mode-btn');
  await page.click('#story-mode-btn');
  await page.waitForTimeout(800);

  async function skipPuzzle() {
    // Try filling text input or clicking submit
    const input = await page.$('input[type="text"]');
    if (input) {
      await input.fill('skip');
      await page.waitForTimeout(200);
    }
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await btn.textContent();
      if (text?.includes('提交')) {
        await btn.click();
        await page.waitForTimeout(300);
        break;
      }
    }
    await page.waitForTimeout(300);
    const nextBtns = await page.$$('button');
    for (const btn of nextBtns) {
      const text = await btn.textContent();
      if (text?.includes('下一题') || text?.includes('→')) {
        await btn.click();
        await page.waitForTimeout(800);
        return true;
      }
    }
    // Try clicking reset/home and restart
    const homeBtn = await page.$('#home-btn');
    if (homeBtn) {
      await homeBtn.click();
      await page.waitForTimeout(400);
      await page.click('#story-mode-btn');
      await page.waitForTimeout(800);
      return true;
    }
    return false;
  }

  // Try many times to find a number_grid puzzle
  for (let cycle = 0; cycle < 5; cycle++) {
    for (let i = 0; i < 30; i++) {
      const progressText = await page.$eval('#story-progress', el => el.textContent || '').catch(() => '');
      console.log(`  [${cycle}/${i}] ${progressText}`);

      if (progressText.includes('数字网格')) {
        // Found it!
        await page.screenshot({ path: 'screenshots/v04-number-grid.png', fullPage: true });
        console.log('✓ v04-number-grid captured!');

        // Now click on a cell and type a number
        const canvas = await page.$('canvas');
        if (canvas) {
          const box = await canvas.boundingBox();
          if (box) {
            // Click on center-right area of canvas
            await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.4);
            await page.waitForTimeout(200);
            await page.keyboard.type('2');
            await page.waitForTimeout(200);
            await page.screenshot({ path: 'screenshots/v06-grid-interacted.png', fullPage: true });
            console.log('✓ v06-grid-interacted');
          }
        }
        await browser.close();
        return;
      }

      const skipped = await skipPuzzle();
      if (!skipped) {
        // Restart
        await page.goto(BASE);
        await page.waitForTimeout(500);
        await page.click('#story-mode-btn');
        await page.waitForTimeout(800);
      }
    }
    // Restart between cycles
    await page.goto(BASE);
    await page.waitForTimeout(500);
    await page.click('#story-mode-btn');
    await page.waitForTimeout(800);
  }

  console.log('⚠️ Could not find number_grid puzzle after many attempts');
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
