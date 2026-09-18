import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'dist');
const server = createServer(async (req, res) => {
  try {
    let name = new URL(req.url, 'http://localhost').pathname;
    if (name.endsWith('/')) name += 'index.html';
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid path');
    const types = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.webp':'image/webp' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(4330, '127.0.0.1', resolve));
const cached = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(cached && await stat(cached).catch(() => null) ? { executablePath: cached } : {}) });
const context = await browser.newContext();
const received = [], errors = [];
await context.route('https://docs.google.com/spreadsheets/**', route => route.fulfill({ status:200, headers:{'access-control-allow-origin':'*'}, contentType:'text/csv', body:route.request().url().includes('1-jv6WJL') ? 'NichtAktiv,Datum,Uhrzeit,DatumAnzeigen,Nachricht,Name,Land,Nachsatz\n,01.01.2026,,,<img src=x onerror=alert(1)>Text,Testperson,,' : 'NichtAktiv,Datum,Titel,Beschreibung\n,20.10.2099,Testtermin,<script>evil()</script>' }));
await context.route('https://script.google.com/**', async route => {
  const request = route.request();
  if (request.method() === 'POST') received.push(JSON.parse(request.postData()));
  const content = { stimmen: [{ aktiv:true, zitat:'<img src=x onerror=alert(1)>', anzeigename:'Testperson', rolle:'Test', reihenfolge:1 }], termine: [
    { aktiv:true,titel:'Testtermin',beginn:'2099-10-20',ende:'2099-10-21',ort:'Testort',kurztext:'<script>evil()</script>',status:'ausgebucht' },
    { aktiv:false,titel:'Verborgener Termin',beginn:'2099-10-20',ort:'Testort' },
    { aktiv:true,titel:'Vergangener Termin',beginn:'2001-10-20',ort:'Testort' },
    { aktiv:true,titel:'Abgesagter Termin',beginn:'2099-10-20',ort:'Testort',status:'abgesagt' }
  ] };
  await route.fulfill({ status:200, headers:{'access-control-allow-origin':'*'}, contentType:'application/json', body:JSON.stringify(request.method() === 'POST' ? {ok:true} : content) });
});
try {
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4330/?email=never-send-this', { waitUntil:'networkidle' });
  assert.equal(received.length,0);
  assert.equal(await page.locator('#statistics-consent').evaluate(dialog => dialog.open),true);
  await page.locator('[data-consent="no"]').click();
  assert.equal(received.length,0);
  assert.equal(await page.locator('.review-card img').count(),0);
  assert.ok((await page.locator('.review-card').innerText()).includes('Testperson'));
  await page.locator('[data-consent-open]').click(); await page.locator('[data-consent="yes"]').click();
  await page.waitForTimeout(150);
  assert.deepEqual(received,[{path:'/',consent:'v1'}]);
  await page.reload({waitUntil:'networkidle'}); assert.equal(received.length,2);
  assert.equal(await page.locator('#statistics-consent').evaluate(dialog => dialog.open),false);
  await page.goto('http://127.0.0.1:4330/angebote/?secret=no',{waitUntil:'networkidle'});
  assert.deepEqual(received.at(-1),{path:'/angebote/',consent:'v1'});
  assert.equal(await page.locator('.seminar-card').count(),1);
  assert.equal(await page.locator('.seminar-card script').count(),0);
  assert.ok((await page.locator('.seminar-booking a').getAttribute('href')).startsWith('mailto:dialog@smiling-relations.de?subject=Seminaranfrage'));
  await page.locator('[data-consent-open]').click(); await page.locator('[data-consent="no"]').click();
  const afterWithdrawal=received.length;
  await page.reload({waitUntil:'networkidle'}); assert.equal(received.length,afterWithdrawal);
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['sr-statistics-consent-v1']);
  assert.deepEqual(errors,[]);
  console.log('Feature tests passed: no request before consent, refusal, consent, reload, withdrawal, minimized payload, live content filtering, dates, mailto and HTML escaping.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
