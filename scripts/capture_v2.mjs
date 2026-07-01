/**
 * Capture screenshots showing:
 * 1. Home screen with all puzzle type pills including jigsaw
 * 2. Story panel on any puzzle
 * 3. Tangram puzzle in action
 * 4. Path finding with story
 * 5. Number grid with story
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 820 } });

  const outDir = new URL('../screenshots/', import.meta.url).pathname;
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // ── 1. Home screen ──
  await page.screenshot({ path: outDir + 's01-home.png', fullPage: false });
  console.log('✓ s01-home.png');

  // ── 2. Enter Story Mode ──
  await page.click('#story-mode-btn');
  await page.waitForTimeout(600);

  // ── 3. Click through puzzles to find tangram ──
  let foundTangram = false;
  let foundPath = false;
  let foundGrid = false;
  let storiesCaptured = false;

  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(400);

    // Check what puzzle type is visible
    const pageContent = await page.evaluate(() => {
      const pills = document.querySelectorAll('.type-pill, span');
      for (const el of pills) {
        const text = el.textContent || '';
        if (text.includes('拼图挑战') || text.includes('一笔画') || text.includes('数字网格')) {
          return text;
        }
      }
      // Check story panel
      const storyEl = document.querySelector('[style*="italic"]');
      const hasStory = !!storyEl;
      // Check canvas
      const canvas = document.querySelector('canvas');
      return canvas ? 'visual' : 'text';
    });

    console.log(`  puzzle #${i + 1}:`, pageContent);

    if (pageContent.includes('拼图挑战') && !foundTangram) {
      await page.screenshot({ path: outDir + 's02-tangram.png', fullPage: false });
      console.log('✓ s02-tangram.png');
      foundTangram = true;

      // Try to interact: click on a piece
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
          // Click on piece tray area (bottom of canvas)
          await page.mouse.click(box.x + box.width / 2, box.y + box.height - 60);
          await page.waitForTimeout(300);
          await page.screenshot({ path: outDir + 's03-tangram-selected.png', fullPage: false });
          console.log('✓ s03-tangram-selected.png');

          // Rotate
          await page.keyboard.press('r');
          await page.waitForTimeout(200);
          await page.screenshot({ path: outDir + 's04-tangram-rotated.png', fullPage: false });
          console.log('✓ s04-tangram-rotated.png');
        }
      }
    }

    if (pageContent.includes('一笔画') && !foundPath) {
      await page.screenshot({ path: outDir + 's05-path-story.png', fullPage: false });
      console.log('✓ s05-path-story.png');
      foundPath = true;

      // Draw some path
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5);
          await page.waitForTimeout(150);
          await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
          await page.waitForTimeout(150);
          await page.screenshot({ path: outDir + 's06-path-interacted.png', fullPage: false });
          console.log('✓ s06-path-interacted.png');
        }
      }
    }

    if (pageContent.includes('数字网格') && !foundGrid) {
      await page.screenshot({ path: outDir + 's07-grid-story.png', fullPage: false });
      console.log('✓ s07-grid-story.png');
      foundGrid = true;
    }

    if (!storiesCaptured && pageContent.includes('visual')) {
      // Capture one text puzzle with story
      // Skip - we'll capture the next text one
    }

    if (foundTangram && foundPath && foundGrid) break;

    // Click "下一题" if visible, otherwise try submit then next
    const nextBtn = await page.$('button:has-text("下一题"), button:has-text("→ 下一题")');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    } else {
      // Maybe need to submit first
      const submitBtn = await page.$('button:has-text("提交")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        const nextBtn2 = await page.$('button:has-text("下一题"), button:has-text("→ 下一题")');
        if (nextBtn2) await nextBtn2.click();
      }
      await page.waitForTimeout(300);
    }
  }

  // ── Final: home screen after gameplay ──
  // Go home
  const homeBtn = await page.$('#home-btn');
  if (homeBtn) {
    await homeBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: outDir + 's99-final-home.png', fullPage: false });
    console.log('✓ s99-final-home.png');
  }

  await browser.close();
  console.log('\nDone! Found tangram:', foundTangram, 'path:', foundPath, 'grid:', foundGrid);
}

main().catch(e => { console.error(e); process.exit(1); });
