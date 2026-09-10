import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = 'http://localhost:4000';
const PAGES = ['/', '/docs', '/login', '/register', '/forgot', '/reset?token=t', '/verify?token=t'];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const problems = [];

async function withPage(theme, w, h, fn) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await fn(page, logs, ctx);
  await ctx.close();
}

console.log('=== 1. ДОСТУПНОСТЬ (axe, WCAG 2.1 AA) ===');
for (const theme of ['light', 'dark']) {
  for (const p of PAGES) {
    await withPage(theme, 1280, 900, async (page) => {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700);
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      for (const v of r.violations) {
        const line = `${theme} ${p} — [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`;
        problems.push(line);
        console.log('  ' + line);
        console.log('      ' + v.nodes[0].target.join(' '));
      }
    });
  }
}
if (problems.length === 0) console.log('  нарушений не найдено');

console.log('\n=== 2. КОНСОЛЬ БРАУЗЕРА ===');
for (const p of PAGES) {
  await withPage('dark', 1280, 900, async (page, logs) => {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const real = logs.filter((l) => !l.includes('Download the React DevTools'));
    if (real.length) {
      console.log(`  ${p}:`);
      real.slice(0, 4).forEach((l) => console.log('      ' + l.slice(0, 180)));
    }
  });
}

console.log('\n=== 3. ГОРИЗОНТАЛЬНАЯ ПРОКРУТКА (320 / 375 / 768) ===');
for (const w of [320, 375, 768]) {
  for (const p of PAGES) {
    await withPage('dark', w, 800, async (page) => {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const over = await page.evaluate(`
        (() => {
          const de = document.documentElement;
          if (de.scrollWidth <= de.clientWidth) return null;
          const bad = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > de.clientWidth + 1) {
              const cs = getComputedStyle(el);
              if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
              bad.push(el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 60) + ' → ' + Math.round(r.right));
            }
          }
          return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, sample: bad.slice(0, 3) };
        })()
      `);
      if (over) {
        console.log(`  ${w}px ${p}: страница шире экрана (${over.scrollWidth} > ${over.clientWidth})`);
        over.sample.forEach((s) => console.log('      ' + s));
      }
    });
  }
}

console.log('\n=== 4. ПОТОК: вход → кабинет → ключ → отзыв ===');
await withPage('dark', 1280, 900, async (page, logs) => {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', 'egor@dev.com');
  await page.fill('input[type=password]', 'Гора#Море42');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('  после входа URL: ' + new URL(page.url()).pathname);
  const hasQuota = await page.locator('text=/94/').count();
  const hasKeys = await page.locator('text=production').count();
  console.log(`  квота видна: ${hasQuota > 0}, ключи видны: ${hasKeys > 0}`);
  await page.screenshot({ path: '/tmp/dash.png' });

  // выпуск ключа
  await page.fill('input[placeholder=production]', 'staging').catch(() => {});
  const btn = page.locator('button', { hasText: 'Выпустить' }).first();
  await btn.click();
  await page.waitForTimeout(1500);
  const shown = await page.locator('text=/pdf_live_XXX/').count();
  console.log('  новый ключ показан: ' + (shown > 0));
  await page.screenshot({ path: '/tmp/dash2.png' });

  const real = logs.filter((l) => !l.includes('DevTools'));
  if (real.length) { console.log('  консоль:'); real.slice(0,4).forEach(l=>console.log('      '+l.slice(0,160))); }
});

console.log('\n=== 5. КЛАВИАТУРА: видимость фокуса ===');
await withPage('dark', 1280, 900, async (page) => {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  const r = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    r.push(await page.evaluate(`
      (() => {
        const a = document.activeElement;
        if (!a || a === document.body) return 'body';
        const cs = getComputedStyle(a);
        const visible = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        return a.tagName.toLowerCase() + (visible ? ' ✓' : ' ✗ нет видимого фокуса');
      })()
    `));
  }
  console.log('  ' + r.join(' → '));
});

await b.close();
