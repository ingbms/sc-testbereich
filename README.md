# sc-testbereich

Eigenständiger Testbereich der Smiling-Relations-Website, erstellt am 18.09.2026 aus `ingbms/HP-SmilingRelations` (Stand `fd0cd2f`). Eigene Git-Historie und eigene GitHub-Pages-Veröffentlichung.

**Website:** https://ingbms.github.io/sc-testbereich/

## Lokal arbeiten

Node.js 24 verwenden.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
```

`npm run build` erzeugt Bilder, Vorschaubilder, Logo und lokale Schriften automatisch. `dist/`, generierte Medien und `node_modules/` werden nicht eingecheckt. Für einen lokalen Build mit dem veröffentlichten Unterpfad `BASE_PATH=/sc-testbereich` setzen; für Browserprüfungen zusätzlich `TEST_BASE=/sc-testbereich`. Browser installieren: `npx playwright install chromium`. Anschließend `npm run test:browser`, `npm run test:seminars` oder `npm run test:voices`.

## Inhalt und Pflege

- `src/`: Seiten, Komponenten, Texte, Darstellung und Browserfunktionen.
- `gallery/DE/`, `gallery/HU/`: 24 verwendete Originalfotos; neue Medien werden beim nächsten Build aufgenommen. `nomedia` wird rekursiv ignoriert.
- `assets/`: verwendetes SVG-Logo, Buch, Presseartikel und beide Urkunden.
- `fonts/`: lokale Schriftdateien mit Lizenzen.
- `scripts/`: Medienaufbereitung; `tests/`: zugehörige Funktions- und Browserprüfungen.
- Termine und Stimmen verwenden dieselben öffentlichen Google-Tabellen wie die Ausgangswebsite, ausschließlich lesend bei jedem Seitenaufruf. Änderungen dort erscheinen auf beiden Websites. Quellen lassen sich in `src/data/events-source.ts` und `src/data/voices-source.ts` austauschen. Pflege: [Seminartermine](documentation/SEMINAR_TABLE.md), [Stimmen](documentation/VOICES_TABLE.md).
- Kontaktadressen und redaktionelle externe Links bleiben erhalten. Galerie-Links aus Google Sheets werden unverändert übernommen und können zur Ausgangswebsite führen.

## Veröffentlichung

Pushes auf `main` prüfen und veröffentlichen die Website über `.github/workflows/pages.yml`. GitHub Pages verwendet **GitHub Actions** als Quelle. Der Workflow setzt den Unterpfad aus dem Repository-Namen automatisch. Reine Dokumentationsänderungen lösen keinen Build aus.

Der Testbereich ist öffentlich erreichbar; `noindex, nofollow` bittet Suchmaschinen, ihn nicht zu indexieren. Besucherstatistik bleibt deaktiviert. Es wurden keine Zugangsdaten, lokale Umgebungsdateien, alten Designentwürfe, ungenutzten Bildvarianten oder Google-Backend-Skripte übernommen.
