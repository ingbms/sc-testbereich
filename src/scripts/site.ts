export {};

document.documentElement.classList.add('js');
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#navigation');
if (menu && navigation) {
  menu.hidden = false;
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
      navigation.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.focus();
    }
  });
}

const viewer = document.querySelector<HTMLDialogElement>('#media-viewer');
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-gallery]')];
let current = 0;
let opener: HTMLElement | null = null;
function renderMedia(index: number) {
  if (!viewer || !links.length) return;
  current = (index + links.length) % links.length;
  const link = links[current];
  const stage = viewer.querySelector<HTMLElement>('.viewer-stage')!;
  stage.querySelector('video')?.pause();
  const element = document.createElement(link.dataset.kind === 'video' ? 'video' : 'img');
  element.src = link.href;
  if (element instanceof HTMLVideoElement) { element.controls = true; element.preload = 'metadata'; }
  else element.alt = link.dataset.caption || '';
  stage.replaceChildren(element);
  viewer.querySelector<HTMLElement>('.viewer-caption')!.textContent = link.dataset.caption || '';
  viewer.querySelector<HTMLElement>('[data-viewer-count]')!.textContent = `${current + 1} / ${links.length}`;
  viewer.querySelector<HTMLAnchorElement>('[data-viewer-original]')!.href = link.href;
}
links.forEach((link, index) => link.addEventListener('click', event => {
  if (!viewer || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); opener = link; renderMedia(index); viewer.showModal();
  viewer.querySelector<HTMLButtonElement>('[data-viewer-close]')?.focus();
}));
viewer?.querySelector('[data-viewer-close]')?.addEventListener('click', () => viewer.close());
viewer?.querySelector('[data-viewer-prev]')?.addEventListener('click', () => renderMedia(current - 1));
viewer?.querySelector('[data-viewer-next]')?.addEventListener('click', () => renderMedia(current + 1));
viewer?.addEventListener('close', () => { viewer.querySelector('video')?.pause(); viewer.querySelector('.viewer-stage')?.replaceChildren(); opener?.focus(); });
viewer?.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer?.addEventListener('keydown', event => {
  if (event.target instanceof HTMLVideoElement) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); renderMedia(current + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); renderMedia(current - 1); }
});

function validEndpoint(raw: string): string | null {
  try {
    const endpoint = new URL(raw);
    return endpoint.protocol === 'https:' && endpoint.hostname === 'script.google.com' && /^\/macros\/s\/[\w-]+\/exec$/.test(endpoint.pathname) ? endpoint.href : null;
  } catch { return null; }
}
async function loadContent(target: HTMLElement) {
  if (!target.dataset.sheetUrl) return;
  target.setAttribute('aria-busy', 'true');
  try {
    if (target.dataset.liveContent === 'termine') {
      const { loadSeminars } = await import('./seminars'); await loadSeminars(target);
    } else {
      const { loadVoices } = await import('./voices'); await loadVoices(target);
    }
  } catch {
    target.textContent = 'Die Inhalte sind gerade nicht abrufbar. Bitte versuche es später erneut.';
    target.dataset.loaded = 'error';
  } finally { target.setAttribute('aria-busy', 'false'); }
}

document.querySelectorAll<HTMLElement>('[data-live-content]').forEach(target => void loadContent(target));

// Only consent preferences are persisted; no visitor/session identifier is created.
const analyticsEndpoint = validEndpoint(document.body.dataset.analyticsEndpoint || '');
const consentDialog = document.querySelector<HTMLDialogElement>('#statistics-consent');
if (document.body.dataset.analyticsEnabled === 'true' && analyticsEndpoint && consentDialog) {
  const key = 'sr-statistics-consent-v1';
  let sent = false;
  function readConsent(): 'yes' | 'no' | null {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (stored && stored.expires > Date.now() && ['yes', 'no'].includes(stored.choice)) return stored.choice;
    } catch { /* Storage may be unavailable; absence never grants consent. */ }
    return null;
  }
  function send() {
    if (sent || !analyticsEndpoint) return;
    const base = (document.body.dataset.base || '/').replace(/\/$/, '');
    const path = location.pathname.startsWith(`${base}/`) ? location.pathname.slice(base.length) : location.pathname;
    if (!/^\/(?:[a-z0-9-]+\/)*$/.test(path)) return;
    sent = true;
    void fetch(analyticsEndpoint, { method: 'POST', mode: 'no-cors', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ path, consent: 'v1' }) }).catch(() => {});
  }
  function choose(choice: 'yes' | 'no') {
    const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 6);
    try { localStorage.setItem(key, JSON.stringify({ choice, expires: expiry.getTime() })); } catch { /* Choice applies to this page only. */ }
    consentDialog!.close();
    if (choice === 'yes') send();
  }
  consentDialog.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach(button => button.addEventListener('click', () => choose(button.dataset.consent === 'yes' ? 'yes' : 'no')));
  document.querySelectorAll('[data-consent-open]').forEach(button => button.addEventListener('click', () => consentDialog.showModal()));
  consentDialog.addEventListener('cancel', () => choose('no'));
  const consent = readConsent();
  if (consent === 'yes') send();
  else if (!consent) consentDialog.showModal();
}
