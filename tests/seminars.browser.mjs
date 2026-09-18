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
await new Promise(resolve => server.listen(4331, '127.0.0.1', resolve));
const cached = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ headless:true, ...(cached && await stat(cached).catch(()=>null) ? {executablePath:cached} : {}) });
const page = await browser.newPage({ viewport:{width:1440,height:1000} });
const url = `http://127.0.0.1:4331${base}/angebote/#termine`;
const errors=[]; page.on('pageerror', error=>errors.push(error.message));
try {
  // Actual anonymous Google fetch, including real redirects/CORS and the owner's Markdown.
  await page.goto(url);
  await page.waitForSelector('[data-live-content="termine"][data-loaded="true"]',{timeout:20000});
  // The owner can change the live data at any time. Exact fields are tested below with fixtures.
  if (await page.locator('.seminar-details summary').count()) await page.locator('.seminar-details summary').first().click();
  assert.equal(await page.locator('.seminar-card h1,.seminar-card h2').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await mkdir(path.join(root,'documentation/previews'),{recursive:true});
  await page.locator('#termine').screenshot({path:path.join(root,'documentation/previews/termine-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#termine').screenshot({path:path.join(root,'documentation/previews/termine-mobil.png')});
  const headers=['NichtAktiv','Datum','Dauer','DauerEinheit','Titel','Beschreibung','Land','Region','Adresse','Nachsatz','PreispP','Waehrung','Email-Anmeldung','LinkZurGalerie','GalerieAktiv','Anmeldeschluss'];
  let rows=[
    ['', '01.10.2099', '2', 'Tage', 'Oktober', '# Oktober\n\n**Einleitung**\n\n## Inhalt\n\n- Punkt\n\n<script>window.attacked=true</script><img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1))','Ungarn','Buszak','Straße 1','*Hinweis*','1200,50','EUR','seminar@example.de'],
    ['', '01.12.2099', '1','Tag','Dezember','Text','','','','','0','EUR','','https://example.org/current-gallery','TRUE'],
    ['x','01.01.2100','1','Tag','Unsichtbar'],
    ['', '01.01.2000','1','Tag','Vergangen','Ein Rückblick.','','','','','600','EUR','','https://example.org/gallery','TRUE'],
    ['', '01.01.2001','1','Tag','Neuerer Rückblick','','','','','','','','','https://example.org/hidden','FALSE'],
    ['x','01.01.2002','1','Tag','Versteckter Rückblick'],
    ['', '01.01.1999','1','Tag','Ungültiger Galerielink','','','','','','','','','javascript:alert(1)','TRUE']
  ];
  rows[0][15]='26.09.2099';
  rows[1][15]='31.02.2099';
  rows[3][15]='30.12.1999';
  let requests=0;
  await page.route('https://docs.google.com/spreadsheets/**',route=>{ requests++; return route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'text/csv',body:Papa.unparse({fields:headers,data:rows})}); });
  await page.reload(); await page.waitForSelector('[data-loaded="true"]');
  assert.deepEqual(await page.locator('[data-live-content="termine"]>.seminar-card .seminar-body>h3').allTextContents(),['Dezember','Oktober']);
  const archive = page.locator('.seminar-archive');
  assert.equal(await archive.locator('h2').innerText(),'Vergangene Veranstaltungen');
  assert.deepEqual(await archive.locator('.seminar-body>h3').allTextContents(),['Neuerer Rückblick','Vergangen','Ungültiger Galerielink']);
  assert.equal(await archive.locator('a[href^="mailto:"],.seminar-price').count(),0);
  assert.equal(await archive.locator('.seminar-gallery').count(),1);
  assert.equal(await archive.locator('.seminar-gallery').getAttribute('href'),'https://example.org/gallery');
  assert.equal(await archive.locator('.seminar-gallery').getAttribute('rel'),'noopener noreferrer');
  assert.equal(await page.locator('[data-live-content="termine"]>.seminar-card .seminar-gallery').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await archive.screenshot({path:path.join(root,'documentation/previews/termine-archiv-mobil.png')});
  await page.setViewportSize({width:1440,height:1000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await archive.screenshot({path:path.join(root,'documentation/previews/termine-archiv-desktop.png')});
  const october=page.locator('.seminar-card').nth(1);
  assert.equal(await october.locator('.seminar-deadline').innerText(),'Anmeldeschluss\n26.09.2099');
  assert.equal(await october.locator('.seminar-deadline time').getAttribute('datetime'),'2099-09-26');
  assert.equal(await page.locator('.seminar-card').first().locator('.seminar-deadline').count(),0);
  assert.equal(await archive.locator('.seminar-deadline time').innerText(),'30.12.1999');
  assert.equal(await october.locator('script,img,iframe').count(),0);
  assert.equal(await october.locator('a[href^="javascript:"]').count(),0);
  assert.ok((await october.locator('.seminar-booking a').getAttribute('href')).startsWith('mailto:seminar@example.de?subject='));
  assert.ok((await october.innerText()).includes('1.200,50'));
  assert.ok((await october.innerText()).includes('Straße 1'));
  assert.ok(await october.locator('.seminar-note em').count());
  rows=[['','01.01.2100','1','Tag','Neu aus Tabelle']];
  await page.reload(); await page.waitForSelector('[data-loaded="true"]');
  assert.deepEqual(await page.locator('.seminar-body>h3').allTextContents(),['Neu aus Tabelle']);
  assert.equal(requests,2);
  assert.equal(await page.locator('.seminar-archive').count(),0);
  assert.equal(await page.locator('.seminar-deadline').count(),0);
  rows=[['','01.01.2000','1','Tag','Nur Vergangenheit']];
  await page.reload(); await page.waitForSelector('[data-loaded="true"]');
  assert.equal(await page.locator('.seminar-archive .seminar-card').count(),1);
  assert.ok((await page.locator('[data-live-content="termine"]>.empty-state').innerText()).includes('Aktuell'));
  rows=[];
  await page.reload(); await page.waitForSelector('[data-loaded="true"]');
  assert.equal(await page.locator('.seminar-archive').count(),0);
  await page.unroute('https://docs.google.com/spreadsheets/**');
  await page.route('https://docs.google.com/spreadsheets/**',route=>route.fulfill({status:200,headers:{'access-control-allow-origin':'*'},contentType:'text/html',body:'<html>Login</html>'}));
  await page.reload(); await page.waitForSelector('[data-loaded="error"]');
  assert.equal(await page.locator('[data-live-content="termine"]').getAttribute('aria-busy'),'false');
  assert.ok((await page.locator('[data-live-content="termine"]').innerText()).includes('E-Mail'));
  assert.deepEqual(errors,[]);
  console.log('Seminar browser checks passed: real public Sheets/CORS, Markdown, responsive layout, current/past groups, descending dates, inactive rows, safe optional gallery links, archive without booking, custom email, refreshed/empty contents, XSS protection and failure state.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
