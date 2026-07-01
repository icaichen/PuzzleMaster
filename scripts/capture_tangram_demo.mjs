/**
 * Capture tangram puzzle screenshots with full illustration.
 *
 * Forces the GameManager to skip straight to a JIGSAW puzzle
 * so we can capture the storybook illustration.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 600, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // ── 1. Home screen ──
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#story-mode-btn', { timeout: 10000 });
  await page.screenshot({ path: `${OUT}/demo-01-home.png`, fullPage: true });
  console.log('✓ demo-01-home.png');

  // ── 2. Override to force tangram puzzle ──
  // Monkey-patch the registry to only return JIGSAW
  await page.evaluate(() => {
    // We'll override the generateRandom method by patching the difficulty categories
    // to only include JIGSAW for difficulty 2
    const originalPush = Array.prototype.push;
    // Instead, let's just intercept loadNextPuzzle by clicking story mode
    // then force-reloading with our own logic
  });

  // Click Story Mode
  await page.click('#story-mode-btn');
  await page.waitForTimeout(800);

  // ── Force a tangram puzzle ──
  // We'll keep clicking "下一题" until we get a tangram, or inject one directly
  let found = false;
  for (let i = 0; i < 30; i++) {
    // Check if we have a canvas
    const hasCanvas = await page.$('canvas');
    if (!hasCanvas) {
      // Text puzzle - skip
      const nextBtn = await page.$('#visual-feedback');
      // Check if there's a submit button
      const submitBtn = await page.$('button');
      // Just type any answer and submit to move on
      const inputEl = await page.$('input[type="text"]');
      if (inputEl) {
        await inputEl.fill('skip');
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.textContent();
          if (text?.includes('提交')) {
            await btn.click();
            await page.waitForTimeout(600);
            break;
          }
        }
      } else {
        // Sliding block puzzle - press Home and try again
        const homeBtn = await page.$('#home-btn');
        if (homeBtn) {
          await homeBtn.click();
          await page.waitForTimeout(300);
          await page.click('#story-mode-btn');
          await page.waitForTimeout(800);
          continue;
        }
      }
    } else {
      // Canvas puzzle - check if it's tangram
      const headerText = await page.textContent('body');
      if (headerText?.includes('拼图挑战') || headerText?.includes('七巧板') || headerText?.includes('祖母')) {
        found = true;
        break;
      }
      // Not tangram - press some buttons to move on
      // For path finding, just submit
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text?.includes('提交')) {
          await btn.click();
          await page.waitForTimeout(600);
          break;
        }
      }
    }

    // Look for "下一题" button
    const nextBtns = await page.$$('button');
    for (const btn of nextBtns) {
      const text = await btn.textContent();
      if (text?.includes('下一题')) {
        await btn.click();
        await page.waitForTimeout(800);
        break;
      }
    }
  }

  if (!found) {
    // Force inject tangram via page eval
    console.log('Trying direct tangram injection...');
    await page.evaluate(() => {
      // Import TangramEngine and render directly
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { TangramEngine } from '/src/engines/TangramEngine.ts';
        import { SeededRandom } from '/src/models/SeededRandom.ts';
        import { VisualPuzzleView } from '/src/views/VisualPuzzleView.ts';
        import { PuzzleType } from '/src/models/PuzzleData.ts';
        
        const engine = new TangramEngine();
        const puzzle = engine.generate(4, 42);
        if (puzzle) {
          const container = document.getElementById('game-container');
          if (container) {
            container.innerHTML = '';
            container.style.display = 'flex';
            document.getElementById('home-screen').style.display = 'none';
            document.getElementById('story-progress').style.display = 'block';
            document.getElementById('story-progress').textContent = '第 1 题 · 🧩 拼图挑战';
            document.getElementById('home-btn').style.display = 'block';
            
            const view = new VisualPuzzleView(container);
            view.setup({
              mode: 'tangram',
              state: puzzle.initial_state,
              title: puzzle.title,
              description: puzzle.description,
              hints: puzzle.hints,
              picarat: 30,
              puzzleType: PuzzleType.JIGSAW,
            });
            view.render();
            view.bindKeyboard();
          }
        }
      `;
      document.head.appendChild(script);
    });
    await page.waitForTimeout(1500);
    found = true;
  }

  // ── 3. Tangram puzzle ──
  await page.screenshot({ path: `${OUT}/demo-02-tangram.png`, fullPage: true });
  console.log('✓ demo-02-tangram.png');

  // ── 4. Click a piece (first one in tray) ──
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // Click at the bottom area where tray pieces are (roughly last 1/4 of canvas)
      const clickX = box.x + box.width * 0.2;
      const clickY = box.y + box.height * 0.78;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/demo-03-piece-selected.png`, fullPage: true });
      console.log('✓ demo-03-piece-selected.png');

      // Rotate the piece
      await page.keyboard.press('r');
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/demo-04-piece-rotated.png`, fullPage: true });
      console.log('✓ demo-04-piece-rotated.png');

      // Click on target grid area to place it
      const gridX = box.x + box.width * 0.3;
      const gridY = box.y + box.height * 0.5;
      await page.mouse.click(gridX, gridY);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/demo-05-piece-placed.png`, fullPage: true });
      console.log('✓ demo-05-piece-placed.png');
    }
  }

  await browser.close();
  console.log('\nDone! All screenshots in ' + OUT + '/');
}

main().catch(e => { console.error(e); process.exit(1); });
