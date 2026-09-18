# Testbereich – Projektstand

Stand: 2026-09-18.

## Auftrag

Eigenständiges Repository `ingbms/sc-testbereich` mit den für die Website nötigen Strukturen und Dateien einschließlich Fotos erstellen und über GitHub Pages veröffentlichen.

## Umsetzung

Ausgangsstand: `ingbms/HP-SmilingRelations`, Commit `fd0cd2f`. 24 veröffentlichte Galeriefotos, fünf verwendete Marken-/Buch-/Presse-/Urkunden-Dateien, lokale Schriften samt Lizenzen, Astro-Quellen, Medienaufbereitung, Tests und Deployment übernommen. Eigene Git-Historie. Alte Entwürfe, ausgeschlossene Fotos, Vorschauen, Google-Backend-Skripte und Exportwerkzeuge sind nicht Bestandteil dieser Kopie.

Termine und Stimmen verwenden weiterhin dieselben öffentlichen Google-Tabellen; nur lesender Zugriff. E-Mail-Kontakt und externe Links bleiben erhalten. Statistik deaktiviert. Alle Seiten erhalten `noindex, nofollow`.

## Prüfung und Veröffentlichung

Lokal erfolgreich: Astro-Prüfung ohne Fehler/Warnungen/Hinweise, neun relevante Unit-Tests und Produktionsbuild mit zwölf Seiten. Browserprüfung aller elf Inhaltsseiten bei 1440/980/720/390 px, interner Links und Sprungziele, Galerie, Menü, Darstellung ohne JavaScript und deaktivierter Statistik. Separate Seminar-/Stimmenprüfungen mit echten Google-Tabellen und Testdaten erfolgreich. Alle HTML-Seiten mit korrektem Unterpfad und noindex. Übernommene Fotos, Assets und Schriftdateien bytegleich mit dem Original.

Medienvorbereitung vor `npm run check` ergänzt, damit auch ein frischer Checkout ohne vorhandene generierte Dateien prüfbar ist. 88 Dateien für das Repository ausgewählt, rund 37 MB. Repository und GitHub Pages (Quelle GitHub Actions) angelegt und veröffentlicht.

Veröffentlicht mit `58c2646`. Workflow erfolgreich: https://github.com/ingbms/sc-testbereich/actions/runs/35338717954.

Live-Prüfung auf https://ingbms.github.io/sc-testbereich/ erfolgreich: elf Inhaltsseiten HTTP 200, Canonical- und Asset-Pfade auf dem neuen Repository, noindex auf allen Seiten. Fotos und Galerie einschließlich voller Auflösung verfügbar. Echte Google-Termine mit Anmeldeschluss 26.09.2026 sowie Stimmen geladen. Desktop/Mobil ohne Überlauf oder JavaScriptfehler, Besucherstatistik deaktiviert.

Auftrag abgeschlossen. Ausgangsrepository unverändert; die vorhandenen unversionierten Nutzertexte dort wurden nicht übernommen oder verändert. Weitere Änderungen können unabhängig in diesem Testbereich erfolgen. Neue Profilfotos stehen weiterhin aus.
