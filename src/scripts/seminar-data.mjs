import Papa from 'papaparse';

const dayMs = 86400000;
const string = (value) => String(value ?? '').trim();
export function parseSeminarDate(value) {
  const raw = string(value);
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(raw);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match && !iso) return null;
  const [year, month, day] = match ? [+match[3], +match[2], +match[1]] : [+iso[1], +iso[2], +iso[3]];
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (year < 1900 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { iso: date.toISOString().slice(0, 10), timestamp };
}
export function parsePrice(value) {
  const raw = string(value).replace(/[\s\u00a0]/g, '');
  if (!raw) return null;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(?:\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '') : raw;
  return /^\d+(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : null;
}
export function isInactive(value) {
  return !['', 'false', 'falsch', 'nein', 'no', '0'].includes(string(value).toLowerCase());
}
export function parseGalleryLink(value, active) {
  if (['false', 'falsch', 'nein', 'no', '0'].includes(string(active).toLowerCase())) return '';
  try {
    const link = new URL(string(value));
    return ['https:', 'http:'].includes(link.protocol) && !link.username && !link.password ? link.href : '';
  } catch { return ''; }
}
export function parseSeminars(csv, today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date())) {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: header => header.replace(/^\uFEFF/, '').trim() });
  if (parsed.errors.length || !['NichtAktiv', 'Datum', 'Titel'].every(field => parsed.meta.fields?.includes(field))) throw new Error('Unexpected seminar table format');
  const seminars = [];
  for (const row of parsed.data.slice(0, 1000)) {
    const title = string(row.Titel);
    const start = parseSeminarDate(row.Datum);
    if (!title || !start || isInactive(row.NichtAktiv)) continue;
    const duration = string(row.Dauer);
    const unit = string(row.DauerEinheit);
    const count = Number(duration.replace(',', '.'));
    const days = /^tage?$/i.test(unit) ? count : /^wochen?$/i.test(unit) ? count * 7 : 1;
    const endTimestamp = start.timestamp + (Number.isInteger(days) && days > 0 && days <= 366 ? days - 1 : 0) * dayMs;
    const end = new Date(endTimestamp).toISOString().slice(0, 10);
    const email = string(row['Email-Anmeldung']);
    seminars.push({
      title: title.slice(0, 300), start: start.iso, timestamp: start.timestamp, end, past: end < today,
      registrationDeadline: parseSeminarDate(row.Anmeldeschluss)?.iso || '',
      galleryUrl: parseGalleryLink(row.LinkZurGalerie, row.GalerieAktiv),
      duration: [duration, unit].filter(Boolean).join(' '),
      description: string(row.Beschreibung).slice(0, 30000),
      country: string(row.Land), region: string(row.Region), address: string(row.Adresse),
      note: string(row.Nachsatz).slice(0, 10000), price: parsePrice(row.PreispP), currency: string(row.Waehrung).toUpperCase() || 'EUR',
      email: /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}$/i.test(email) ? email : '',
    });
  }
  return seminars.sort((a, b) => b.timestamp - a.timestamp || a.title.localeCompare(b.title, 'de'));
}
export function splitDescription(markdown, title) {
  let source = markdown.replace(/\r\n/g, '\n').trim();
  const firstHeading = /^#{1,6}\s+(.+)\n*/.exec(source);
  if (firstHeading && firstHeading[1].replace(/[*_]/g, '').trim().toLowerCase() === title.trim().toLowerCase()) source = source.slice(firstHeading[0].length).trim();
  const blocks = source.split(/\n\s*\n/);
  // Keep lists, headings, code and tables together instead of splitting them into an excerpt.
  if (!blocks[0] || /^(?:#{1,6}\s|[-*+]\s|\d+\.\s|>|```|\||<)/.test(blocks[0]) || blocks[0].includes('|')) return { intro: '', remainder: source };
  return { intro: blocks.shift(), remainder: blocks.join('\n\n') };
}
export function formatDateRange(start, end) {
  const formatter = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  const first = formatter.format(new Date(start + 'T12:00:00Z'));
  return start === end ? first : `${first} – ${formatter.format(new Date(end + 'T12:00:00Z'))}`;
}
