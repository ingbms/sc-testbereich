import Papa from 'papaparse';
import { parseSeminarDate, isInactive } from './seminar-data.mjs';

export const voiceColumns = ['NichtAktiv','Datum','Uhrzeit','DatumAnzeigen','Nachricht','Name','Land','Nachsatz'];
const text = value => String(value ?? '').trim();
export function parseVoices(csv) {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: header => header.replace(/^\uFEFF/, '').trim() });
  if (parsed.errors.length || !['NichtAktiv','Datum','DatumAnzeigen','Nachricht','Name'].every(field => parsed.meta.fields?.includes(field))) throw new Error('Unexpected voices table');
  return parsed.data.slice(0,1000).flatMap((row, index) => {
    if (isInactive(row.NichtAktiv) || !text(row.Nachricht)) return [];
    const date = parseSeminarDate(row.Datum);
    const time = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text(row.Uhrzeit));
    const seconds = time && +time[1] < 24 && +time[2] < 60 && +(time[3] || 0) < 60 ? +time[1]*3600 + +time[2]*60 + +(time[3] || 0) : 0;
    return [{ name: text(row.Name) || 'Teilnehmerstimme', message: text(row.Nachricht).slice(0,30000), country: text(row.Land), note: text(row.Nachsatz).slice(0,10000),
      date: date?.iso || '', showDate: !!date && text(row.DatumAnzeigen).toUpperCase() === 'J',
      timestamp: date ? date.timestamp + seconds * 1000 : -Infinity, index }];
  }).sort((a,b) => b.timestamp - a.timestamp || a.index - b.index);
}
