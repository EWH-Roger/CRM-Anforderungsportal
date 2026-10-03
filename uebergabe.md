# Übergabe CRM-Anforderungsportal

Stand: 03.10.2026, Version 0.6.0

Dieses Dokument ist für alle, die das Portal betreuen oder weiterentwickeln, auch für eine neue Claude-Sitzung. Es fasst zusammen, wo alles liegt, was der aktuelle Stand ist und was als Nächstes ansteht. Die fachliche Beschreibung steht in der [README](README.md), die Änderungen pro Version im [Changelog](CHANGELOG.md).

## 1. Worum es geht

Das Business reicht über das Portal Anforderungen und Use Cases für Erweiterungen des CRM ein. Das Release Board bewertet sie nach Nutzen und Aufwand, und der Product Owner plant sie anhand des Scores in Releases ein. Das Portal ist ein Pilot, um den Prozess zu erproben, bevor über ein unternehmensweites Werkzeug entschieden wird.

## 2. Wo was liegt

| Was | Wo |
|---|---|
| Portal (live) | https://claude.ai/artifact/NH6CUUyfzvpvFoPEotaQmE |
| Quellcode | https://github.com/EWH-Roger/CRM-Anforderungsportal |
| Lokale Arbeitskopie | `D:\Projekte\Form` |
| Spezifikation | [docs/superpowers/specs/2026-10-02-anforderungsportal-design.md](docs/superpowers/specs/2026-10-02-anforderungsportal-design.md) |
| Umsetzungsplan | [docs/superpowers/plans/2026-10-02-anforderungsportal.md](docs/superpowers/plans/2026-10-02-anforderungsportal.md) |
| Fachliche Beschreibung, Entwicklung | [README.md](README.md) |
| Änderungen pro Version | [CHANGELOG.md](CHANGELOG.md) |

Das Artifact gehört dem claude.ai-Konto von Roger Oettli. Veröffentlichen, freigeben und löschen kann nur, wer Owner oder Editor des Artifacts ist.

## 3. Aktueller Stand

- **Live:** Version 0.6.0, auf claude.ai Version 8 des Artifacts. Die laufende Version steht in der Fusszeile des Portals.
- **Freigabe:** Das Artifact ist privat. Ausser dem Owner kann es niemand öffnen, bis es über «Teilen» freigegeben wird.
- **Daten (geprüft am 02.10.2026):**
  - Die Einstellungen sind gespeichert, mit eigenen Abteilungen (u. a. Telekom, Energie, Fernwärme, Gas, Elektrizität) und Systemen (u. a. Innosolv, Hubspot, Freshdesk).
  - Das Release Board hat 1 Mitglied, die Mindestanzahl Bewertungen steht auf 3.
  - Es gibt eine Anforderung, #1 «Telekom ist cool». Das ist ein Testeintrag.
  - Testdaten aus der Entwicklung sind keine in der Datenbank.
- **Git:**
  - Die Versionen 0.4.0 bis 0.6.0 liegen auf `feature/anforderungsportal` und kommen mit Pull Request #4 nach `main`. Bis 0.3.1 ist `main` aktuell (Pull Requests #1 bis #3).
  - Für jede Version gibt es ein Tag (`v0.1.0` bis `v0.6.0`).
- **Tests:** Alle grün, Stand 0.6.0: 44 Logik-Tests, 4 UI-Tests und 40 Klicktestläufe.

## 4. Rollen im Portal

| Rolle | Wie man sie erhält |
|---|---|
| Product Owner | Freigabe Owner oder Editor beim Teilen des Artifacts |
| Release Board | Freigabe Contributor und Eintrag in der Mitgliederliste unter «Einstellungen» |
| Einreichende | Freigabe Contributor |
| Lesende | Freigabe Viewer |

## 5. Arbeitsweise

### Voraussetzungen
- Git Bash
- Node.js 24
- Microsoft Edge
- GitHub-CLI `gh` für Pull Requests

Zusätzliche npm-Pakete braucht es nicht. Wurde Node.js erst nach dem Start einer Shell installiert, findet die Shell `node` noch nicht. Die Testskripte weichen dann auf `C:\Program Files\nodejs\node.exe` aus.

### Ablauf für eine Änderung
1. Auf einem Branch arbeiten, Code in `src/` ändern.
2. Den Test zuerst schreiben, er muss scheitern. Dann die Änderung umsetzen.
   - Reine Fachlogik: `tests/logic.test.js`
   - Oberfläche und Abläufe: `tests/e2e-*.js`, in `tests/e2e-all.sh` eintragen
3. `bash tests/run.sh && bash tests/e2e-all.sh` ausführen. Alles muss grün sein.
4. Visuell prüfen: `bash tests/shot.sh <reiter> <rolle> <breite> [dark]` erzeugt ein Bildschirmfoto in `dist/`.
5. Einen Eintrag in `CHANGELOG.md` unter «Unveröffentlicht» ergänzen.
6. Die neue Version im Changelog eintragen (die Fusszeile liest sie dort), dann `bash build.sh` ausführen und `dist/anforderungsportal.html` unter derselben Artifact-URL neu veröffentlichen. Die Daten bleiben dabei erhalten.
7. Im Changelog aus «Unveröffentlicht» eine Version mit Datum machen, committen, das Tag `vX.Y.Z` setzen, pushen und einen Pull Request nach `main` erstellen.

### Lokale Vorschau und Testdaten
`dist/dev.html` lädt einen Mock der Plattform und lässt sich über URL-Parameter steuern:
- `?seed=1`: lädt Testdaten
- `?role=admin|gremium|business|viewer|anonym`: wählt die Rolle. Die internen Rollennamen sind älter als die heutigen Begriffe: `admin` ist der Product Owner, `gremium` ein Mitglied des Release Boards.
- `?slow=1`: liefert die Daten verzögert, wie es die echte Plattform tun kann

### Wichtige Regeln der Plattform
- Externe Skripte sind nur von freigegebenen CDNs erlaubt, Stylesheets nur von Google Fonts. Deshalb bündelt `build.sh` den gesamten Code direkt in die Seite.
- `alert()`, `confirm()` und `prompt()` funktionieren nicht. Bestätigungen laufen über den eigenen Dialog (`UI.confirmDialog`).
- Downloads funktionieren nur über die Capability `downloads`, nicht über Links.
- Benutzertext wird nur über `UI.h` als Text eingefügt, nie über `innerHTML`.
- In der Datenbank werden nur Benutzer-IDs gespeichert. Namen werden beim Anzeigen aufgelöst.
- Die Datenbankregeln werden beim Veröffentlichen mitgegeben und beim Neuveröffentlichen übernommen. Sie stehen in der README unter «Datenmodell».

## 6. Wichtige Entscheide

- **Plattform:** ein Pilot als claude.ai-Artifact statt Microsoft 365 oder einer eigenen Webanwendung. Das ging schnell und ohne Betriebsaufwand, setzt aber ein claude.ai-Konto bei allen Beteiligten voraus.
- **Bewertung:** Nutzen/Aufwand-Matrix mit fünf Kriterien, 1 bis 5. Score = gewichteter Nutzen-Index ÷ Ø Aufwand.
- **Release Board:** Mehrere Personen bewerten, das Portal bildet den Durchschnitt. Es zählen nur aktuelle Mitglieder. Die Bewertung ist blind: Ein Mitglied sieht die Ergebnisse erst nach der eigenen Bewertung.
- **Roadmap:** nach Releases mit Kapazität in Aufwandspunkten, mit automatischem Vorschlag nach Score.
- **Bewusst nicht im Pilot:**
  - KI-Qualitätscheck der Einreichung
  - Datei-Anhänge (stattdessen Links)
  - Benachrichtigungen
  - serverseitige Rollen- und Statusprüfung
  - Anbindung an das CRM
- **Begriffe:** Seit Version 0.2.1 heissen die Rollen «Release Board» und «Product Owner». Die Spezifikation in `docs/` verwendet noch die alten Begriffe «Gremium» und «Administration». Sie ist als Dokument des ursprünglichen Entwurfs unverändert geblieben.

## 7. Offene Punkte

### Als Nächstes zu tun
1. **Portal freigeben:** Über «Teilen» die Einreichenden und das Release Board als Contributor eintragen, Mitlesende als Viewer.
2. **Release Board einrichten:** Unter «Einstellungen» die Mitglieder und das erste Release mit seiner Kapazität erfassen. **Achtung:** Heute hat das Release Board 1 Mitglied bei einer Mindestanzahl von 3 Bewertungen. Solange es weniger Mitglieder als die Mindestanzahl gibt, erreicht keine Anforderung den Status «Bewertet». Entweder Mitglieder ergänzen oder die Mindestanzahl senken.
3. **Wertelisten prüfen:** Abteilungen, CRM-Bereiche und Systeme stammen teilweise aus Vorschlägen und sollten zur EW Höfe AG passen.
4. **Testeinträge entfernen:** Vor dem Start des Pilots die Anforderung #1 «Telekom ist cool» und andere Probeeinträge löschen. Im Portal selbst geht das derzeit nicht, nur direkt in der Datenbank des Artifacts, zum Beispiel über Claude Code. Danach beginnt die Laufnummer wieder bei 1.

### Bekannte Einschränkungen des Pilots
- Rollen und Statuswechsel sichert nur die Oberfläche. Technisch kann jeder Contributor Anforderungen direkt in der Datenbank ändern.
- Alle mit Lesezugriff können die Bewertungen direkt in der Datenbank lesen. Die Blindbewertung gilt nur in der Oberfläche.
- Senden zwei Personen gleichzeitig ab, kann eine Laufnummer doppelt vergeben werden.

### Kleinere Mängel aus dem Abschlussreview (bewusst zurückgestellt)
- Ein Speicherversuch bei gestörter Verbindung kann eine Anforderung oder einen Kommentar doppelt anlegen.
- Lehnt die Datenbank einen Schreibvorgang ab, ohne dass die Plattform die Berechtigung meldet, schaltet die Seite nicht automatisch auf Lesemodus.
- Beim Neuzeichnen klappt die Liste der ausgelieferten Releases wieder zu, und die Trefferliste der Personensuche verschwindet.
- Die Checkboxen für Systeme sind über ihre Position zugeordnet. Ändert der Product Owner die Systemliste, während jemand das Formular ausfüllt, kann ein Haken beim falschen System landen.
- Zahlen werden mit Punkt angezeigt («1.5»), eingegeben werden sie mit Komma.
- Die Kapazitätsanzeige rundet halbe Punkte.
- Scheitert die Auslieferung eines Release mittendrin, können Anforderungen auf «Eingeplant» in einem ausgelieferten Release zurückbleiben.
- Es gibt keine Warnung, wenn die Mindestanzahl Bewertungen grösser ist als das Release Board.
- Bricht die Verbindung zur Datenbank ganz ab, zeigt die Seite bis zum Neuladen einen Hinweis und den alten Stand.
- Einige Formularfelder haben noch keinen Hilfetext mit Beispiel, etwa Abteilung, Häufigkeit und Grund der Frist.

### Benachrichtigungen
- **Heute (ab 0.4.0):** Hinweise im Portal für Product Owner, Release Board und Einreichende. Sie erscheinen nur, wenn die Person das Portal öffnet.
- **Grenzen:**
  - Der Zeitpunkt «gelesen bis» gilt pro Browser (`localStorage`, Schlüssel `portal-seen`), nicht pro Person.
  - Antworten in den Kommentaren erzeugen keinen Hinweis.
- **Nach dem Pilot vorgesehen:** E-Mail über Outlook. Das Artifact hat keinen eigenen Server und kann nicht selbst versenden. Infrage kommen ein claude.ai-Konnektor beim Absenden oder ein geplanter Agent, der regelmässig zusammenfasst. Beides ist noch abzuklären.

### Mögliche Erweiterungen
- KI-Qualitätscheck vor dem Absenden. Die Plattform bietet dafür die Capability `sample`.
- Löschen und Archivieren von Anforderungen im Portal
- Benachrichtigungen bei Rückfragen und Statuswechseln
- Nach dem Pilot ein Entscheid über den Betrieb, etwa der Wechsel auf eine Plattform mit serverseitiger Prüfung der Rollen

## 8. Bei Problemen

| Symptom | Ursache und Vorgehen |
|---|---|
| Banner «Diese Seite funktioniert nur in claude.ai» | Die Seite wurde ausserhalb von claude.ai geöffnet, etwa als lokale Datei. Für lokale Tests `dist/dev.html` verwenden. |
| «Sie haben Lesezugriff …» | Die Person hat nur die Freigabe Viewer. Beim Teilen auf Contributor setzen. |
| «Speichern nicht möglich …» | Die Freigabe reicht nicht für diese Aktion, etwa Einstellungen ohne Owner oder Editor. Freigabe prüfen. |
| Release Board sieht keine Ergebnisse | So gewollt, solange das Mitglied nicht selbst bewertet hat (Blindbewertung). |
| Anforderung bleibt «In Bewertung» | Der Product Owner kann sie im Detail mit «Als bewertet markieren» abschliessen, sobald die Mindestanzahl Bewertungen erreicht ist. |
| Tests finden `node` nicht | Shell neu starten oder Node.js unter `C:\Program Files\nodejs\` installieren. |
