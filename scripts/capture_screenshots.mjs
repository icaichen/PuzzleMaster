import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 400, height: 850 } });

  // Screenshot 1: Home screen
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/01-home.png', fullPage: false });
  console.log('Captured: home screen');

  // Screenshot 2: Click Story Mode
  await page.click('#story-mode-btn');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/02-story-puzzle.png', fullPage: false });
  console.log('Captured: story mode puzzle');

  // Screenshot 3: Click hint button
  const hintBtn = page.locator('button', { hasText: '使用提示币' });
  if (await hintBtn.isVisible()) {
    await hintBtn.click();
    await page.waitForTimeout(300);
    await hintBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/03-hints-revealed.png', fullPage: false });
    console.log('Captured: hints revealed');
  }

  // Screenshot 4: Type answer
  const input = page.locator('input[type="text"]');
  if (await input.isVisible()) {
    await input.fill('test answer');
    await page.waitForTimeout(300);
    await page.click('button:has-text("提交")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-wrong-answer.png', fullPage: false });
    console.log('Captured: wrong answer');
  }

  await browser.close();
  console.log('\nAll screenshots saved to screenshots/');
}

main().catch(e => { console.error(e); process.exit(1); });
