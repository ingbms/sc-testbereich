import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';

const root = path.resolve(import.meta.dirname, '..');
const base = process.env.TEST_BASE || '';
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.json':'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (base && !pathname.startsWith(`${base}/`)) throw new Error('Wrong base');
    let name = pathname.slice(base.length).replace(/^\//, '');
    if (!path.extname(name)) name += `${name.endsWith('/') || !name ? '' : '/'}index.html`;
    const file = path.resolve(root, 'dist', name);
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Outside dist');
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(4329, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:4329${base}`;
const cached = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(cached && await stat(cached).catch(() => null) ? { executablePath: cached } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
async function loadLazyImages(page) {
  await page.locator('img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
  await page.evaluate(async () => { await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
  await page.evaluate(() => window.scrollTo(0, 0));
}
const errors = [], failures = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
try {
  await mkdir(path.join(root, 'documentation/previews'), { recursive: true });
  const pages = ['', 'ansatz/', 'angebote/', 'angebote/fuehrung/', 'angebote/teams/', 'angebote/persoenlichkeit-beziehungen/', 'birgit-groddeck/', 'stimmen/', 'kontakt/', 'impressum/', 'datenschutz/'];
  for (const route of pages) {
    await page.goto(`${origin}/${route}`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('h1').count(), 1, `One h1: ${route}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Desktop overflow: ${route}`);
    assert.equal(await page.locator('img').evaluateAll(images => images.filter(img => img.complete && !img.naturalWidth).length), 0, `Broken image: ${route}`);
    for (const link of await page.locator('a[href]').evaluateAll(links => links.map(a => a.href))) {
      const parsed = new URL(link);
      if (parsed.origin !== 'http://127.0.0.1:4329') continue;
      const result = await context.request.get(link);
      assert.ok(result.ok(), `Broken internal link ${link}`);
      if (parsed.hash && !/\.(jpg|webp|svg|mp4)$/.test(parsed.pathname)) {
        const html = await result.text();
        assert.ok(html.includes(`id="${decodeURIComponent(parsed.hash.slice(1))}"`), `Missing anchor ${link}`);
      }
    }
  }
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await loadLazyImages(page);
  await page.screenshot({ path: path.join(root, 'documentation/previews/startseite-desktop.png'), fullPage: true });
  await page.locator('[data-gallery]').first().click();
  assert.equal(await page.locator('#media-viewer').evaluate(dialog => dialog.open), true);
  const before = await page.locator('[data-viewer-count]').innerText();
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await page.locator('[data-viewer-count]').innerText(), before);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#media-viewer').evaluate(dialog => dialog.open), false);
  assert.equal(await page.locator('[data-gallery]').first().evaluate(link => document.activeElement === link), true);
  for (const width of [390, 720, 980]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of pages) {
      await page.goto(`${origin}/${route}`, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}: ${route}`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  await loadLazyImages(page);
  await page.locator('h1').click();
  await page.screenshot({ path: path.join(root, 'documentation/previews/startseite-mobil.png'), fullPage: true });
  await page.screenshot({ path: path.join(root, 'documentation/previews/startseite-mobil-ausschnitt.png') });
  // A disabled/unconfigured counter must not persist anything or contact Google.
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  assert.equal(await page.locator('#statistics-consent').count(), 0);
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await noJs.newPage(); await plain.goto(`${origin}/`);
  assert.ok(await plain.locator('#navigation').isVisible());
  assert.ok((await plain.locator('noscript').innerText()).includes('JavaScript'));
  await noJs.close();
  console.log(`Browser checks passed: ${pages.length} pages, 4 widths, internal links/anchors, gallery, menu, no-JS and inactive analytics.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
