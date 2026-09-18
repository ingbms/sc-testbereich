import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import Papa from 'papaparse';

const root = path.resolve(import.meta.dirname, '..');
const base = process.env.TEST_BASE || '';
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (base && !pathname.startsWith(base + '/')) throw new Error('Invalid base');
    let name = decodeURIComponent(pathname.slice(base.length)).replace(/^\//, '');
    if (!path.extname(name)) name += `${!name || name.endsWith('/') ? '' : '/'}index.html`;
    const file = path.resolve(root, 'dist', name);
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Invalid path');
    const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript', '.woff2':'font/woff2', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' };
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(4333, '127.0.0.1', resolve));
const cached = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ headless:true, ...(cached && await stat(cached).catch(()=>null) ? {executablePath:cached} : {}) });
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const url=`http://127.0.0.1:4333${base}/stimmen/`;
const source='https://docs.google.com/spreadsheets/d/1-jv6WJLqWgi5O4OSMAZy_En6ZOK5EpmJ69dfcGUegK4/**';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(url);await page.waitForSelector('[data-live-content="stimmen"][data-loaded="true"]',{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  await mkdir(path.join(root,'documentation/previews'),{recursive:true});
  await page.screenshot({path:path.join(root,'documentation/previews/stimmen-desktop.png'),fullPage:true});
  for (const width of [1440,1251,1101,981,800,721,720,390,320]) {
    await page.setViewportSize({width,height:900});
    if (width<=720 && await page.locator('.menu-toggle').getAttribute('aria-expanded')==='false') await page.locator('.menu-toggle').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow: ${width}`);
    assert.equal(await page.locator('#navigation a:visible').count(),7);
  }
  await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});
  await page.locator('h1').click();await page.screenshot({path:path.join(root,'documentation/previews/stimmen-mobil.png'),fullPage:true});
  const fields=['NichtAktiv','Datum','Uhrzeit','DatumAnzeigen','Nachricht','Name','Land','Nachsatz'];
  let rows=[['','01.01.2025','10:00','J','Alt','Alt'],['','03.08.2026','17:00','','**Neu**<br>Absatz\n\n<script>window.attacked=true</script><img src=x onerror=alert(1)>','Neu','Deutschland','*Nachsatz*'],['x','04.08.2026','','J','Versteckt','Versteckt'],['','03.08.2026','09:00','J','Früh','Früh'],['','01.02.2025','','N','Vierter','Vierter']];
  let requests=0;
  await page.route(source,route=>{requests++;return route.fulfill({status:200,contentType:'text/csv',headers:{'access-control-allow-origin':'*'},body:Papa.unparse({fields,data:rows})});});
  await page.reload();await page.waitForSelector('[data-loaded="true"]');
  assert.deepEqual(await page.locator('.review-author strong').allTextContents(),['Neu','Früh','Vierter','Alt']);
  const first=page.locator('.review-card').first();
  assert.equal(await first.locator('time,[datetime],img,script,iframe').count(),0);
  assert.ok(!(await first.innerHTML()).includes('2026'));
  assert.ok(await first.locator('blockquote strong').count());assert.ok(await first.locator('.review-note em').count());
  assert.equal(await page.locator('.review-author time').count(),2);
  assert.equal(await page.locator('.review-author time').first().innerText(),'03.08.2026');
  await page.goto(`http://127.0.0.1:4333${base}/`);await page.waitForSelector('[data-live-content="stimmen"][data-loaded="true"]');
  assert.deepEqual(await page.locator('.review-author strong').allTextContents(),['Neu','Früh','Vierter']);
  assert.equal(await page.locator('#stimmen a[href$="/stimmen/"]').count(),1);
  rows=[['','01.01.2026','','J','Einleitung.\n\n'+('Langer Text. '.repeat(100)),'Lang']];
  await page.goto(url);await page.waitForSelector('[data-loaded="true"]');
  await page.locator('.review-details summary').click();assert.equal(await page.locator('.review-details').getAttribute('open'),'');
  rows=[];await page.reload();await page.waitForSelector('[data-loaded="true"]');assert.equal(await page.locator('.review-card').count(),0);
  assert.ok((await page.locator('.empty-state').innerText()).includes('Neue Stimmen'));
  await page.unroute(source);await page.route(source,route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.reload();await page.waitForSelector('[data-loaded="error"]');assert.ok((await page.locator('.empty-state').innerText()).includes('nicht abrufbar'));
  const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto(url);assert.ok((await plain.locator('noscript').innerText()).includes('JavaScript'));await plain.close();
  assert.deepEqual(errors,[]);assert.equal(requests,4);
  console.log('Voices browser checks passed: real Sheets/CORS, seven navigation links, responsive layout, newest date/time first, J-only date display, Markdown/XSS, preview, long text, reload, empty/error and no-JS states.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
