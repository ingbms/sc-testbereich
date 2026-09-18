import { parseVoices } from './voices-data.mjs';
import { renderMarkdown } from './rich-text';

function node(tag: string, text = '', className = '') {
  const element = document.createElement(tag); element.textContent = text;
  if (className) element.className = className;
  return element;
}
function renderVoice(voice: ReturnType<typeof parseVoices>[number], preview: boolean) {
  const figure = node('figure', '', 'review-card');
  const mark = node('span', '„', 'review-mark'); mark.setAttribute('aria-hidden', 'true');
  const quote = node('blockquote');
  const content = renderMarkdown(voice.message, 'review-copy');
  if (!preview && voice.message.length > 850 && content.children.length > 1) {
    const first = content.firstElementChild!;
    const intro = node('div', '', 'review-copy'); intro.append(first); quote.append(intro);
    const details = node('details', '', 'review-details');
    details.append(node('summary', 'Ganze Stimme lesen'), content); quote.append(details);
  } else quote.append(content);
  const caption = node('figcaption', '', 'review-author');
  caption.append(node('strong', voice.name));
  if (voice.country) caption.append(node('span', voice.country));
  // Hidden dates are used for ordering only, never emitted in the DOM or accessible labels.
  if (voice.showDate) {
    const date = node('time', new Intl.DateTimeFormat('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', timeZone:'UTC' }).format(new Date(voice.date+'T12:00:00Z')));
    date.setAttribute('datetime', voice.date); caption.append(date);
  }
  figure.append(mark, quote, caption);
  if (voice.note) { const note = renderMarkdown(voice.note, 'review-copy review-note'); figure.append(note); }
  return figure;
}
export async function loadVoices(target: HTMLElement) {
  try {
    const endpoint = new URL(target.dataset.sheetUrl || '');
    if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'docs.google.com' || !/^\/spreadsheets\/d\/[\w-]+\/export$/.test(endpoint.pathname)) throw new Error('Invalid sheet endpoint');
    const response = await fetch(endpoint.href, { credentials:'omit', cache:'no-store', referrerPolicy:'no-referrer', signal:AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Table unavailable');
    const csv = await response.text(); if (csv.length > 2000000) throw new Error('Table too large');
    const voices = parseVoices(csv);
    const limit = Number(target.dataset.limit) || voices.length;
    target.replaceChildren(...(voices.length ? voices.slice(0,limit).map(voice => renderVoice(voice, !!target.dataset.limit)) : [node('p', 'Hier teilen Teilnehmende ihre Erfahrungen. Neue Stimmen folgen in Kürze.', 'empty-state')]));
    target.dataset.loaded = 'true';
  } catch {
    target.replaceChildren(node('p', 'Die Stimmen sind gerade nicht abrufbar. Bitte versuche es später noch einmal.', 'empty-state'));
    target.dataset.loaded = 'error';
  } finally { target.setAttribute('aria-busy','false'); }
}
