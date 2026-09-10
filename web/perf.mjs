import { chromium } from 'playwright';

const URL = process.env.URL ?? 'http://localhost:4000/';
const THROTTLE = Number(process.env.THROTTLE ?? 6);

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--enable-gpu-rasterization'],
});
const ctx = await b.newContext({
  viewport: { width: 1280, height: 860 },
  colorScheme: 'dark',
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

// Слабый процессор — на нём вылезает то, чего не видно на маке.
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000); // ждём конца анимации набора

// Считаем длительность кадров во время прокрутки.
await page.evaluate(`
  window.__frames = [];
  window.__last = performance.now();
  (function loop() {
    const now = performance.now();
    window.__frames.push(now - window.__last);
    window.__last = now;
    requestAnimationFrame(loop);
  })();
`);

// Длинные задачи главного потока.
await page.evaluate(`
  window.__long = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__long.push(Math.round(e.duration));
  }).observe({ entryTypes: ['longtask'] });
`);

for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, 90);
  await page.waitForTimeout(24);
}

const r = await page.evaluate(`
  (() => {
    const f = window.__frames.slice(5);
    const sorted = [...f].sort((a, b) => a - b);
    const pct = (p) => sorted[Math.floor(sorted.length * p)] || 0;
    return {
      frames: f.length,
      median: +pct(0.5).toFixed(1),
      p95: +pct(0.95).toFixed(1),
      worst: +Math.max(...f).toFixed(1),
      janky: f.filter((x) => x > 32).length,
      longTasks: window.__long.length,
      longTotal: window.__long.reduce((a, b) => a + b, 0),
    };
  })()
`);

console.log(JSON.stringify({ throttle: THROTTLE, ...r }));
await b.close();
