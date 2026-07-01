import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 480, height: 820 } });

  const outDir = new URL('../screenshots/', import.meta.url).pathname;

  async function skipToNext() {
    await page.waitForTimeout(200);
    // Always just submit and click overlay next
    const submit = await page.$('button:has-text("提交")');
    if (submit) {
      try { await submit.click(); } catch {}
      await page.waitForTimeout(500);
    }
    const next = await page.$('#win-next-btn');
    if (next) {
      try { await next.click(); } catch {}
      await page.waitForTimeout(500);
      return true;
    }
    // Maybe auto-win already triggered
    const overlay = await page.$('#win-overlay.visible');
    if (overlay) {
      const btn = await page.$('#win-next-btn');
      if (btn) { await btn.click(); await page.waitForTimeout(500); return true; }
    }
    return false;
  }

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ── Home ──
  await page.screenshot({ path: outDir + 'v3-01-home.png', fullPage: false });

  await page.click('#story-mode-btn');
  await page.waitForTimeout(800);

  let tangram = false, path = false, grid = false;

  for (let i = 0; i < 30 && (!tangram || !path || !grid); i++) {
    await page.waitForTimeout(400);

    const info = await page.evaluate(() => {
      const body = document.body.innerText || '';
      let ptype = 'other';
      if (body.includes('拼图挑战')) ptype = 'tangram';
      else if (body.includes('一笔画')) ptype = 'path';
      else if (body.includes('数字网格') || body.includes('Futoshiki') || body.includes('∧')) ptype = 'grid';
      else if (body.includes('滑块拼图') || body.includes('华容道')) ptype = 'klotski';
      else ptype = 'text';
      const hasStory = body.length > 200 && 
        (body.includes('教授') || body.includes('水手') || body.includes('考古') 
        || body.includes('图书馆') || body.includes('花园') || body.includes('探险')
        || body.includes('工艺') || body.includes('美术') || body.includes('祖母')
        || body.includes('酒馆') || body.includes('王国') || body.includes('七巧板')
        || body.includes('画家') || body.includes('学徒'));
      return { ptype, hasStory };
    });
    console.log(`  #${i + 1}: ${info.ptype} story=${info.hasStory}`);

    // Tangram
    if (info.ptype === 'tangram' && !tangram) {
      await page.screenshot({ path: outDir + 'v3-02-tangram.png', fullPage: false });
      tangram = true;

      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
          // Click piece tray
          await page.mouse.click(box.x + box.width * 0.3, box.y + box.height - 50);
          await page.waitForTimeout(300);
          await page.screenshot({ path: outDir + 'v3-03-tangram-selected.png', fullPage: false });

          await page.keyboard.press('r');
          await page.waitForTimeout(200);
          await page.screenshot({ path: outDir + 'v3-04-tangram-rotated.png', fullPage: false });
        }
      }
    }

    // Path
    if (info.ptype === 'path' && !path) {
      await page.screenshot({ path: outDir + 'v3-05-path.png', fullPage: false });
      path = true;

      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
          await page.waitForTimeout(150);
          await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.4);
          await page.waitForTimeout(150);
          await page.screenshot({ path: outDir + 'v3-06-path-drawn.png', fullPage: false });
        }
      }
    }

    // Grid
    if (info.ptype === 'grid' && !grid) {
      await page.screenshot({ path: outDir + 'v3-07-grid.png', fullPage: false });
      grid = true;
    }

    if (tangram && path && grid) break;

    await skipToNext();
  }

  await browser.close();
  console.log(`\nDone: tangram=${tangram} path=${path} grid=${grid}`);
}

main().catch(e => { console.error(e); process.exit(1); });
