# Seminartermine aus Google Sheets

Stand: 2026-09-16. Die vom Nutzer bereitgestellte Tabelle wird direkt und ausschließlich lesend eingebunden. Kein Apps Script, API-Schlüssel oder Google-Login der Besucher erforderlich.

Quelle: [SeminarTermine](https://docs.google.com/spreadsheets/d/1bueVi5KHdSxjmI6aEn--IbtZJw8EeYBjMakyUvgeg0U/edit?usp=sharing), Blatt **Tabellenblatt1**, gid **0**. Konfiguration: `src/data/events-source.ts`.

## Zuordnung der Spalten

| Spalte | Website |
| --- | --- |
| NichtAktiv | Leer, FALSE, falsch, nein, no oder 0: anzeigen. Jeder andere Eintrag (z. B. x, TRUE, ja, 1): ausblenden. |
| Datum | Startdatum als deutsches Kalenderdatum oder YYYY-MM-DD. Neuester Termin zuerst, unabhängig von der Zeilenreihenfolge. Ungültige Daten nicht anzeigen. |
| Dauer / DauerEinheit | Dauer anzeigen. Bei ganzen Tagen/Wochen das Enddatum einschließlich des Starttags berechnen; laufende mehrtägige Termine bleiben bis zum Ende sichtbar. |
| Titel | Überschrift der Seminarkarte. |
| Beschreibung | Markdown: Absätze, Überschriften, Listen, Fett/Kursiv, Links, Zitate, Code und Tabellen. Erste Einleitung sichtbar, Rest unter „Beschreibung & Inhalte“ aufklappbar. Doppelte einleitende Titelüberschrift weglassen. |
| Land / Region | Ortsangabe oberhalb des Titels. |
| Adresse | Zusätzliche Adresse, falls vorhanden. Keine externe Karte laden. |
| Anmeldeschluss | Optionales Datum als D.M.YYYY oder YYYY-MM-DD; Anzeige „Anmeldeschluss DD.MM.YYYY“ unter Datum/Dauer mit dezentem roten Akzent. Leere/ungültige Werte ausblenden, den Termin trotzdem erhalten. Falls eingetragen auch im Archiv sichtbar. Keine automatische Sperre der E-Mail-Anfrage oder Änderung der Sortierung. |
| Nachsatz | Zusatzhinweis unterhalb der Beschreibung, ebenfalls Markdown. |
| PreispP / Waehrung | Preis pro Person im deutschen Zahlenformat; fehlende Währung EUR. Ohne Preis kein Preisblock. |
| Email-Anmeldung | Empfänger des Anfrage-Mailto, Betreff/Text mit Seminar und Datum. Bei leerer/ungültiger Adresse zentrale Kontaktadresse verwenden. |
| LinkZurGalerie | Vollständige HTTP-/HTTPS-Adresse. Zeigt „Zur Galerie“ bei aktuellen und vergangenen Veranstaltungen; leere oder ungültige Links ergeben keinen Button. Externe Galerien öffnen in einem neuen Tab, ohne vorherigen Abruf/Einbettung. |
| GalerieAktiv | FALSE, falsch, nein, no oder 0 unterdrücken den Galeriebutton. Leer lässt einen vorhandenen gültigen Link erscheinen; TRUE, ja, 1 oder x ebenfalls. |

Nicht deaktivierte vergangene Termine erscheinen nach Seminarende unter **„Vergangene Veranstaltungen“**, unterhalb der aktuellen Termine. Beide Gruppen sind nach Startdatum absteigend sortiert, bei gleichem Datum alphabetisch nach Titel. Laufende mehrtägige Seminare bleiben einschließlich des Endtags aktuell (Zeitzone Europe/Berlin). Deaktivierte Zeilen bleiben in beiden Gruppen verborgen.

Das Archiv zeigt Datum, Inhalte, Ort und ggf. Galerie, aber keinen historischen Preis und keine Anmeldeaufforderung. Ohne vergangene Veranstaltungen entfällt der Archivbereich. Gibt es ausschließlich vergangene Einträge, bleibt darüber der Hinweis auf individuelle Anfragen sichtbar. Spalten lassen sich umsortieren, solange die Überschriften erhalten bleiben. Die Tabelle wurde nicht geändert.

## Aktualisierung und Datenschutz

Auf jeder Angebotsseiten-Ladung liest JavaScript den öffentlichen CSV-Export mit `credentials: omit`, `cache: no-store` und ohne Referrer. Änderungen benötigen keinen GitHub-Build; Google kann eigene kurze Auslieferungsverzögerungen haben. Keine dauerhafte Speicherung der Inhalte im Besucherbrowser. Andere Seiten laden diese Terminquelle nicht.

Die Beschreibung wird mit Marked verarbeitet und mit DOMPurify bereinigt. Keine Scripts, eingebetteten Frames, Bilder/Trackingpixel, Eventhandler oder gefährlichen Link-Protokolle. Keine externen Markdown-Bilder laden. Bibliotheken werden lokal mitgeliefert und erst auf der Angebotsseite geladen.

Die Tabelle muss für jeden mit Link lesbar bleiben. **NichtAktiv blendet nur auf der Website aus:** In der freigegebenen Tabelle bleiben solche Zeilen lesbar. Keine privaten Teilnehmer-/Anmeldedaten dort speichern.

Bei Abruffehlern oder fehlendem JavaScript bleibt eine E-Mail-Anfrage möglich. Die Datenschutzerklärung nennt den direkten Google-Sheets-Abruf. Besucherstatistik bleibt unabhängig davon deaktiviert.

## Prüfung

- Unit-Tests: vollständige Spaltenzuordnung, CSV mit mehrzeiligem Markdown/Kommas, Preisformate, absteigende Sortierung, inaktive/ungültige Termine, vergangene und laufende Mehrtagestermine einschließlich Datumswechsel, Spaltenreihenfolge, Galerieaktivierung und sichere Linkziele.
- Browser mit echter öffentlicher Tabelle: CORS/Weiterleitungen, Markdown und Ansichten bei 1440/390 px.
- Browser mit Testdaten: neue Inhalte nach Reload, alle Zusatzfelder, eigener E-Mail-Empfänger, keine Script-Ausführung, verständlicher Fehlerzustand, getrennte aktuelle/vergangene Termine, Archiv ohne Anmeldung/Preis, optionale Galeriebuttons, leeres Archiv und ausschließlich vergangene Termine.
- Bilder der Prüfung: `previews/termine-desktop.png`, `previews/termine-mobil.png`.
- Archivansichten mit ausdrücklich synthetischen Testdaten: `previews/termine-archiv-desktop.png`, `previews/termine-archiv-mobil.png`.
