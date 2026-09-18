import test from 'node:test';
import assert from 'node:assert/strict';
import Papa from 'papaparse';
import { parseVoices, voiceColumns } from '../src/scripts/voices-data.mjs';
const csv = rows => Papa.unparse({fields:voiceColumns,data:rows});

test('voices sort by date and time descending, exclude inactive/empty rows and retain undated ones last', () => {
  const rows=[['','10.01.2026','09:00','','Früh','A'],['','09.01.2026','23:00','','Älter','B'],['','10.01.2026','17:00:01','','Spät','C'],['x','11.01.2026','','','Versteckt','D'],['','','','','Ohne Datum','E'],['','12.01.2026','','','','Leer']];
  assert.deepEqual(parseVoices(csv(rows)).map(v=>v.name),['C','A','B','E']);
});
test('date visibility requires J and a valid date, without changing sort order', () => {
  for (const value of ['J','j',' J ']) assert.equal(parseVoices(csv([['','10.01.2026','',value,'Text','Name']]))[0].showDate,true);
  for (const value of ['','N','JA','TRUE','1']) assert.equal(parseVoices(csv([['','10.01.2026','',value,'Text','Name']]))[0].showDate,false);
  assert.equal(parseVoices(csv([['','31.02.2026','','J','Text','Name']]))[0].showDate,false);
});
test('voices preserve Markdown/newlines, map columns by header, and reject broken responses', () => {
  const [voice]=parseVoices('Name,Nachricht,DatumAnzeigen,Datum,NichtAktiv,Land,Nachsatz\r\nTest,"**Text**, mit Komma\n\nAbsatz",J,2026-01-01,,Deutschland,*Danke*');
  assert.equal(voice.message,'**Text**, mit Komma\n\nAbsatz');assert.equal(voice.note,'*Danke*');assert.equal(voice.country,'Deutschland');
  assert.throws(()=>parseVoices('<html>Login</html>'));
});
