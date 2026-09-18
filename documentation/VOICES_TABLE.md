# Stimmen und Bewertungen

Stand: 2026-09-16, Entscheidung D32.

## Live-Quelle und Darstellung

[StimmenBewertungen](https://docs.google.com/spreadsheets/d/1-jv6WJLqWgi5O4OSMAZy_En6ZOK5EpmJ69dfcGUegK4/edit?usp=sharing), Tabellenblatt1, gid 0. Nur lesend verbunden; keine Änderungen/Importe in Google vorgenommen. Konfiguration: `src/data/voices-source.ts`.

Die Seite `/stimmen/` zeigt alle aktiven Einträge, auf der Startseite erscheinen die jüngsten drei als Vorschau. Beide laden bei jedem Seitenaufruf den öffentlichen CSV-Export ohne Anmeldung, Cookies, Referrer oder lokalen Inhaltscache. Kein GitHub-Neubau für Tabellenänderungen nötig; kurze Google-Auslieferungsverzögerungen sind möglich.

Die Navigation oben/unten enthält „Stimmen“. Dezente Verweise ergänzen Startseite, Ansatz, Angebote und Birgit-Seite. Warme Papierflächen, rote Akzente und lokale Schriften entsprechen dem bestehenden Stil. Längere mehrteilige Bewertungen lassen sich aufklappen; die Texte werden nicht umformuliert und es werden keine Sterne/Bewertungspunkte erfunden.

| Spalte, in dieser Reihenfolge | Verwendung |
| --- | --- |
| NichtAktiv | Leer, FALSE, falsch, nein, no oder 0: anzeigen. Andere Einträge deaktivieren die Zeile. |
| Datum | Datum D.M.YYYY oder YYYY-MM-DD. Absteigende Sortierung; fehlende/ungültige Daten am Ende. |
| Uhrzeit | H:mm oder H:mm:ss; bei gleichem Datum die jüngste Uhrzeit zuerst. Leer/ungültig gilt für die Sortierung als 00:00. Keine Uhrzeitanzeige. |
| DatumAnzeigen | Nur J (auch j, umgebende Leerzeichen ignoriert) zeigt ein gültiges Datum an. Leer, N, JA, TRUE, 1 usw. zeigen kein Datum. Verborgene Daten auch nicht in HTML-Attributen/Zugänglichkeitslabels ausgeben. |
| Nachricht | Vollständige Bewertung, Markdown einschließlich Absätzen, Listen, Fett/Kursiv und sicheren Links. Leere Nachrichten nicht anzeigen. |
| Name | Name wie angegeben; leer: „Teilnehmerstimme“. |
| Land | Optional neben dem Namen, keine Ableitung aus anderen Angaben. |
| Nachsatz | Optionaler Zusatz unter der Namenszeile, ebenfalls Markdown. |

Gleiche Datum-/Uhrzeitwerte behalten die Tabellenreihenfolge. HTML wird mit DOMPurify bereinigt, keine Scripts, Bilder/Trackingpixel, Frames oder gefährlichen Links. Texte werden nicht automatisch übersetzt. Datum und Name bleiben bei Darstellung unverändert.

Bei Abruffehlern erscheint ein Hinweis, bei leerer Tabelle ein neutraler Leerzustand. Es werden keine statischen Altbewertungen als Ersatz geladen, damit inzwischen deaktivierte Bewertungen nicht wieder erscheinen. Ohne JavaScript erscheint ein entsprechender Hinweis. Die Datenschutzerklärung nennt die tatsächlichen Tabellenabrufe; Statistik bleibt separat deaktiviert.

## Testbereich

Diese Kopie verwendet dieselbe lesende Google-Quelle wie die Ausgangswebsite. Historische CSV-Exporte und Exportwerkzeuge verbleiben im Ausgangsrepository; sie sind zum Betrieb nicht erforderlich.

## Pruefung

`npm test` prueft Sortierung, Datumsfreigabe und CSV-Verarbeitung. `npm run test:voices` prueft den echten Abruf sowie Desktop/Mobil, Markdown, Reload und Fehlerzustaende. Generierte Screenshots bleiben lokal unter `documentation/previews/`.
