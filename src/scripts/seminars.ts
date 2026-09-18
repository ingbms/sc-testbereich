import { renderMarkdown as markdown } from './rich-text';
import { parseSeminars, splitDescription, formatDateRange } from './seminar-data.mjs';
import { site } from '../data/site';
import '../styles/seminars.css';

function element(tag: string, content = '', className = '') {
  const node = document.createElement(tag); node.textContent = content;
  if (className) node.className = className;
  return node;
}

type Seminar = ReturnType<typeof parseSeminars>[number];
function renderSeminar(seminar: Seminar) {
  const card = element('article', '', `seminar-card${seminar.past ? ' seminar-card--past' : ''}`);
  const date = new Date(seminar.start + 'T12:00:00Z');
  const datePanel = element('div', '', 'seminar-date');
  datePanel.append(element('span', new Intl.DateTimeFormat('de-DE', { month: 'short', timeZone: 'UTC' }).format(date), 'seminar-month'), element('strong', String(date.getUTCDate()).padStart(2, '0'), 'seminar-day'), element('span', String(date.getUTCFullYear()), 'seminar-year'));
  const body = element('div', '', 'seminar-body');
  const place = [seminar.region, seminar.country].filter(Boolean).join(' · ');
  if (place) body.append(element('p', place, 'eyebrow'));
  body.append(element('h3', seminar.title));
  const facts = element('div', '', 'seminar-facts');
  const time = element('time', formatDateRange(seminar.start, seminar.end)); time.setAttribute('datetime', seminar.start); facts.append(time);
  if (seminar.duration) facts.append(element('span', seminar.duration));
  body.append(facts);
  if (seminar.registrationDeadline) {
    const deadline = element('p', '', 'seminar-deadline');
    const time = element('time', formatDateRange(seminar.registrationDeadline, seminar.registrationDeadline));
    time.setAttribute('datetime', seminar.registrationDeadline);
    deadline.append(element('span', 'Anmeldeschluss'), time); body.append(deadline);
  }
  if (seminar.address) body.append(element('p', seminar.address, 'seminar-address'));
  const description = splitDescription(seminar.description, seminar.title);
  if (description.intro) body.append(markdown(description.intro));
  if (description.remainder) {
    const details = document.createElement('details'); details.className = 'seminar-details';
    details.append(element('summary', 'Beschreibung & Inhalte'), markdown(description.remainder)); body.append(details);
  }
  if (seminar.note) { const note = markdown(seminar.note); note.classList.add('seminar-note'); body.append(note); }
  const booking = element('div', '', 'seminar-booking');
  if (seminar.past) booking.append(element('span', 'Veranstaltung beendet', 'seminar-status'));
  if (!seminar.past && seminar.price !== null) {
    let price: string;
    try { price = new Intl.NumberFormat('de-DE', { style: 'currency', currency: seminar.currency }).format(seminar.price); }
    catch { price = `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(seminar.price)} ${seminar.currency}`; }
    const pricing = element('p', '', 'seminar-price'); pricing.append(element('strong', price), element('span', 'pro Person')); booking.append(pricing);
  }
  if (!seminar.past) {
    const email = seminar.email || site.email;
    const link = document.createElement('a'); link.className = 'button'; link.textContent = 'Per E-Mail anfragen →';
    const dateLabel = formatDateRange(seminar.start, seminar.end);
    const recipient = encodeURIComponent(email).replace('%40', '@');
    link.href = `mailto:${recipient}?subject=${encodeURIComponent(`Seminaranfrage: ${seminar.title} · ${dateLabel}`)}&body=${encodeURIComponent(`Hallo Birgit,\n\nich interessiere mich für das Seminar „${seminar.title}“ (${dateLabel}${place ? `, ${place}` : ''}).\n\nBitte sende mir weitere Informationen zur Anmeldung.\n\nViele Grüße\n`)}`;
    booking.append(link);
  }
  if (seminar.galleryUrl) {
    const gallery = document.createElement('a'); gallery.className = 'button button-outline seminar-gallery';
    gallery.href = seminar.galleryUrl; gallery.textContent = 'Zur Galerie →';
    gallery.rel = 'noopener noreferrer';
    if (new URL(seminar.galleryUrl).origin !== location.origin) gallery.target = '_blank';
    booking.append(gallery);
  }
  card.append(datePanel, body, booking);
  return card;
}
export async function loadSeminars(target: HTMLElement) {
  try {
    const endpoint = new URL(target.dataset.sheetUrl || '');
    if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'docs.google.com' || !/^\/spreadsheets\/d\/[\w-]+\/export$/.test(endpoint.pathname)) throw new Error('Invalid sheet endpoint');
    const response = await fetch(endpoint.href, { credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Table unavailable');
    const csv = await response.text();
    if (csv.length > 2000000) throw new Error('Table too large');
    const seminars = parseSeminars(csv);
    const upcoming = seminars.filter(seminar => !seminar.past);
    const past = seminars.filter(seminar => seminar.past);
    target.replaceChildren(...(upcoming.length ? upcoming.map(renderSeminar) : [element('p', 'Aktuell sind keine öffentlichen Seminartermine angekündigt. Individuelle Trainings kannst du jederzeit per E-Mail anfragen.', 'empty-state')]));
    if (past.length) {
      const archive = element('section', '', 'seminar-archive'); archive.id = 'vergangene-veranstaltungen';
      archive.setAttribute('aria-labelledby', 'seminar-archive-heading');
      const heading = element('h2', 'Vergangene Veranstaltungen'); heading.id = 'seminar-archive-heading';
      const list = element('div', '', 'seminar-archive-list'); list.append(...past.map(renderSeminar));
      archive.append(heading, list); target.append(archive);
    }
    target.dataset.loaded = 'true';
  } catch {
    target.replaceChildren(element('p', 'Die aktuellen Seminartermine sind gerade nicht abrufbar. Bitte frage deinen Wunschtermin per E-Mail an.', 'empty-state'));
    target.dataset.loaded = 'error';
  } finally { target.setAttribute('aria-busy', 'false'); }
}
