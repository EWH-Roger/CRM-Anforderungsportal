# CRM-Anforderungsportal

Ein Portal, über das das Business Anforderungen und Use Cases für Erweiterungen des CRM einreicht. Das Release Board bewertet die Anforderungen, und der Product Owner plant sie anhand der Bewertung in Releases ein.

Das Portal ist eine einzelne HTML-Seite und läuft als claude.ai-Artifact. Die Daten liegen in der Datenbank des Artifacts. Wer die Seite öffnet, wird über das claude.ai-Konto erkannt, ein eigenes Login gibt es nicht.

- **Portal:** https://claude.ai/artifact/NH6CUUyfzvpvFoPEotaQmE (privat, wird über «Teilen» freigegeben)
- **Spezifikation:** [docs/superpowers/specs/2026-10-02-anforderungsportal-design.md](docs/superpowers/specs/2026-10-02-anforderungsportal-design.md)
- **Umsetzungsplan:** [docs/superpowers/plans/2026-10-02-anforderungsportal.md](docs/superpowers/plans/2026-10-02-anforderungsportal.md)
- **Änderungen:** [CHANGELOG.md](CHANGELOG.md)
- **Übergabe:** [uebergabe.md](uebergabe.md) (Stand, Arbeitsweise, offene Punkte)

## Funktionen

| Bereich | Inhalt |
|---|---|
| Einreichen | Geführtes Formular in vier Schritten: Worum geht es, Pain, Gain, Systeme. Es zeigt die Vollständigkeit an und berechnet das Einsparpotenzial in Stunden pro Jahr. Eine Hilfespalte zeigt Tipps, den weiteren Ablauf und die eigenen Anforderungen. |
| Anforderungen | Liste mit Suche und Filtern. Die Detailansicht zeigt den Statusverlauf, Rückfragen und die Bewertung durch das Release Board. |
| Auswertung | Kennzahlen, Nutzen/Aufwand-Matrix, Rangliste nach Score, Verteilungen und Ablösepotenzial der genannten Systeme. |
| Roadmap | Releases mit Kapazität in Aufwandspunkten. Zuordnung per Drag & Drop oder Auswahl, automatischer Vorschlag nach Score, Auslieferung eines Release. |
| Darstellung | Umschalter in der Kopfzeile: «System», «Hell» oder «Dunkel». Die Wahl gilt pro Person und Browser. |
| Einstellungen | Ersteinrichtung, Gewichte der Kriterien, Wertelisten, Release Board, Releases und CSV-Export. Nur für den Product Owner. |

## Rollen und Freigaben

Die Rolle ergibt sich aus der Freigabe des Artifacts in claude.ai («Teilen») und aus der Mitgliederliste des Release Boards in den Einstellungen.

| Rolle | Freigabe | Darf |
|---|---|---|
| Product Owner | Owner oder Editor | alles, einschliesslich Status, Roadmap und Einstellungen |
| Release Board | Contributor und in der Mitgliederliste des Release Boards eingetragen | bewerten, dazu alles, was Einreichende dürfen |
| Einreichende | Contributor | einreichen, Rückfragen beantworten, alles lesen |
| Lesende | Viewer | nur lesen |

## Bewertung

Das Release Board bewertet jede Anforderung nach fünf Kriterien, jeweils auf einer Skala von 1 bis 5:

- Geschäftsnutzen
- Anzahl Betroffene
- Dringlichkeit
- Strategischer Fit
- Aufwand

Die ersten vier sind Nutzen-Kriterien. Daraus berechnet das Portal:

- **Nutzen-Index:** der gewichtete Durchschnitt der vier Nutzen-Kriterien. Die Gewichte lassen sich in den Einstellungen ändern.
- **Score:** Nutzen-Index ÷ Ø Aufwand.
- **Quadrant:** Mit der Schwelle 3 auf beiden Achsen fällt jede Anforderung in eines von vier Feldern: Quick Win, Grosses Vorhaben, Lückenfüller oder Vermeiden.

Es zählen nur Bewertungen von aktuellen Mitgliedern des Release Boards. Ein Mitglied sieht die Bewertungen der anderen erst, nachdem es selbst bewertet hat.

## Projektstruktur

```
src/            Quelltext der Seite
  page.html     Titel, CSS und statisches Markup
  logic.js      Fachlogik ohne DOM- und Datenbankzugriff (Status, Bewertung, Validierung, Roadmap, CSV)
  ui.js         DOM-Helfer, Dialog, Formatierung
  store.js      Datenbank- und Benutzerzugriff, alle Schreibvorgänge
  view-*.js     die fünf Ansichten
  main.js       Navigation und Start
tests/          Tests, Mock der Plattform, Hilfsskripte
build.sh        setzt src/ zu dist/anforderungsportal.html zusammen
docs/           Spezifikation und Umsetzungsplan
```

`dist/` ist nicht im Repository. Der Ordner entsteht beim Build.

## Entwicklung

**Voraussetzungen:**
- Git Bash
- Node.js (getestet mit Version 24)
- Microsoft Edge (für UI-Tests, Klicktests und Bildschirmfotos)

Zusätzliche npm-Pakete braucht es nicht.

```bash
bash build.sh               # erzeugt dist/anforderungsportal.html und dist/dev.html
bash tests/run.sh           # Logik-Tests (Node) und UI-Tests (Edge headless)
bash tests/e2e-all.sh       # alle automatischen Klicktests
bash tests/shot.sh roadmap admin 1280 dark   # Bildschirmfoto: Reiter, Rolle, Breite, Modus
```

**Lokale Vorschau:** `dist/dev.html` lädt einen Mock der Plattform (`tests/mock-claude.js`). Die Seite lässt sich direkt im Browser öffnen und über URL-Parameter steuern:

- `?seed=1`: lädt Testdaten
- `?role=admin|gremium|business|viewer|anonym`: wählt die Rolle
- `?slow=1`: liefert die Daten verzögert

Beispiel: `dist/dev.html?seed=1&role=gremium#r-q3`

Der Mock hält die Daten nur im Arbeitsspeicher. Nach einem Neuladen beginnt er wieder mit den Testdaten.

## Änderungen veröffentlichen

1. Änderung in `src/` vornehmen und die Tests ergänzen.
2. `bash tests/run.sh && bash tests/e2e-all.sh` ausführen. Alle Tests müssen grün sein.
3. `bash build.sh`
4. `dist/anforderungsportal.html` unter derselben Artifact-URL neu veröffentlichen. Die Daten in der Datenbank bleiben dabei erhalten.
5. Einen Eintrag in [CHANGELOG.md](CHANGELOG.md) unter «Unveröffentlicht» ergänzen und bei einer Veröffentlichung eine neue Version anlegen.

Die Seite darf nur Skripte von den CDNs laden, die claude.ai erlaubt, und Stylesheets nur von Google Fonts. Deshalb bündelt `build.sh` den gesamten Code direkt in die Seite.

## Datenmodell

| Pfad | Inhalt | Schreibrecht |
|---|---|---|
| `config/settings` | Release Board, Gewichte, Mindestanzahl Bewertungen, Arbeitswochen pro Jahr, Wertelisten | Product Owner |
| `releases/{id}` | Name, Reihenfolge, Kapazität, Status | Product Owner |
| `requests/{id}` | Anforderung mit Statusverlauf und Release-Zuordnung | ab Contributor |
| `requests/{id}/comments/{id}` | Rückfragen und Antworten | ab Contributor |
| `ratings/{benutzer}` | alle Bewertungen einer Person | nur die Person selbst |

## Bekannte Einschränkungen (Pilot)

- Rollen und Statuswechsel sichert nur die Oberfläche. Technisch kann jeder Contributor Anforderungen direkt in der Datenbank ändern.
- Alle mit Lesezugriff können die Bewertungen direkt in der Datenbank lesen. Die Blindbewertung gilt nur in der Oberfläche.
- Senden zwei Personen gleichzeitig ab, kann eine Laufnummer doppelt vergeben werden.
- Es gibt keine Benachrichtigungen per E-Mail oder Teams und keine Datei-Anhänge. Anhänge werden als Link erfasst.
