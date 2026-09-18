import test from 'node:test';
import assert from 'node:assert/strict';
import Papa from 'papaparse';
import { parseSeminars, parseSeminarDate, parsePrice, splitDescription, parseGalleryLink } from '../src/scripts/seminar-data.mjs';
const headers = ['NichtAktiv','Datum','Dauer','DauerEinheit','Titel','Beschreibung','Land','Region','Adresse','Nachsatz','PreispP','Waehrung','Email-Anmeldung','LinkZurGalerie','GalerieAktiv'];
const csv = rows => Papa.unparse({ fields:headers, data:rows });

test('seminars map all provided columns and preserve multiline Markdown and German prices', () => {
  const markdown = '# Titel\n\nText mit **Stärke**, Komma und "Zitat".\n\n- Punkt eins\n- Punkt zwei';
  const [event] = parseSeminars(csv([['','01.10.2026','2','Tage','Titel',markdown,'Ungarn','Buszak','Am Hof 1','**Bitte mitbringen**','1.200,50','EUR','seminar@example.de']]),'2026-09-16');
  assert.equal(event.description,markdown); assert.equal(event.price,1200.5); assert.equal(event.end,'2026-10-02');
  assert.equal(event.duration,'2 Tage'); assert.equal(event.country,'Ungarn'); assert.equal(event.region,'Buszak');
  assert.equal(event.address,'Am Hof 1'); assert.equal(event.note,'**Bitte mitbringen**'); assert.equal(event.email,'seminar@example.de');
});
test('latest date first; inactive/invalid rows excluded, past retained and ongoing seminars remain current through their last day', () => {
  const rows=[['','01.10.2026',1,'Tag','Oktober'],['x','01.12.2026',1,'Tag','Versteckt'],['FALSE','01.11.2026',1,'Tag','November'],['','15.09.2026',2,'Tage','Läuft noch'],['','14.09.2026',1,'Tag','Vorbei'],['','31.02.2026',1,'Tag','Ungültig']];
  rows.push(['TRUE','01.01.2020',1,'Tag','Versteckte Vergangenheit']);
  const events = parseSeminars(csv(rows),'2026-09-16');
  assert.deepEqual(events.filter(event=>!event.past).map(event=>event.title),['November','Oktober','Läuft noch']);
  assert.deepEqual(events.filter(event=>event.past).map(event=>event.title),['Vorbei']);
  assert.equal(parseSeminars(csv(rows),'2026-09-17').find(event=>event.title==='Läuft noch').past,true);
});
test('gallery links use actual sheet columns, honor explicit deactivation and reject unsafe destinations', () => {
  const link = 'https://example.org/gallery?event=1#photos';
  const [event] = parseSeminars(csv([['','01.01.2020',1,'Tag','Rückblick','','','','','','','','',link,'TRUE']]),'2026-09-16');
  assert.equal(event.galleryUrl,link); assert.equal(event.past,true);
  for (const active of ['',undefined,'TRUE','ja','1','x']) assert.equal(parseGalleryLink(link,active),link);
  for (const active of ['FALSE','nein','0']) assert.equal(parseGalleryLink(link,active),'');
  for (const value of ['', 'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/a', 'https://user:secret@example.org', 'not a link']) assert.equal(parseGalleryLink(value,'TRUE'),'');
});
test('column order does not matter and malformed CSV or unrelated documents are rejected', () => {
  assert.equal(parseSeminars('Titel,Datum,NichtAktiv\r\nSeminar,2026-10-01,','2026-09-16')[0].title,'Seminar');
  const reordered = 'Titel,Datum,Anmeldeschluss,Referenten,NichtAktiv,PreispP\r\nSeminar,2026-10-01,26.09.2026,,,600';
  const [seminar] = parseSeminars(reordered,'2026-09-18');
  assert.equal(seminar.registrationDeadline,'2026-09-26'); assert.equal(seminar.price,600);
  for (const value of ['', '31.02.2026', 'kein Datum']) {
    const [event] = parseSeminars(`Titel,Datum,NichtAktiv,Anmeldeschluss\nSeminar,2026-10-01,,${value}`,'2026-09-18');
    assert.equal(event.registrationDeadline,'');
  }
  assert.equal(parseSeminars('Titel,Datum,NichtAktiv,Anmeldeschluss\nSeminar,2026-10-01,,2026-09-01','2026-09-18')[0].registrationDeadline,'2026-09-01');
  assert.throws(()=>parseSeminars('<html>Login</html>','2026-09-16'));
  assert.throws(()=>parseSeminars('Titel,Datum,NichtAktiv\n"unclosed,2026-10-01,','2026-09-16'));
});
test('dates, zero prices and Markdown title handling have explicit semantics', () => {
  assert.equal(parseSeminarDate('29.02.2025'),null); assert.equal(parseSeminarDate('29.02.2024').iso,'2024-02-29');
  assert.equal(parsePrice('0,00'),0); assert.equal(parsePrice(''),null); assert.equal(parsePrice('1.200'),1200);
  assert.deepEqual(splitDescription('# Titel\n\nEinleitung.\n\n## Lernen\n\n- Klarheit','Titel'),{intro:'Einleitung.',remainder:'## Lernen\n\n- Klarheit'});
});
