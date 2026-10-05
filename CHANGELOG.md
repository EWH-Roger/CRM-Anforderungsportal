# Changelog

Alle wesentlichen Änderungen am CRM-Anforderungsportal stehen in dieser Datei.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/). Neue Einträge kommen zuerst unter «Unveröffentlicht». Bei jeder Veröffentlichung des Artifacts wird daraus eine neue Version mit Datum.

## [Unveröffentlicht]

### Geändert
- Build und Tests laufen unter Windows und macOS. `tests/env.sh` sucht Edge, Chrome oder Brave, ein anderer Browser lässt sich mit `BROWSER=...` vorgeben.
- Kleinere Vereinfachungen im Code und im Test-Mock, ohne sichtbare Änderung im Portal.

## [0.8.0] - 2026-10-03

### Hinzugefügt
- **Detailansicht:**
  - Entscheidungsleiste unter dem Titel mit Status, Score, Einordnung und Einsparpotenzial.
  - Kleine Nutzen/Aufwand-Matrix, die die Anforderung im Vergleich zu den anderen zeigt.
- Glossar in der README.

### Geändert
- **Detailansicht:** Use Case, Pain, Gain, Akzeptanzkriterien und Systeme stehen in einer Box statt in vielen.
- Labels stehen in normaler Schreibweise statt in Grossbuchstaben.
- Angaben sind klar getrennt statt mit Mittelpunkten verkettet.
- Die Matrix verwendet dieselben Bezeichnungen wie die übrigen Ansichten.

### Behoben
- Rahmen von Eingabefeldern haben in beiden Modi mindestens 3:1 Kontrast (WCAG 1.4.11). Linien und Tabellen bleiben hellblau.

## [0.7.0] - 2026-10-03

### Hinzugefügt
- **Akzeptanzkriterien:** Der Product Owner erfasst sie im Detail vor der Bewertung, eine Zeile pro Kriterium. Sie werden als Checkliste angezeigt und im CSV-Export mitgeführt.
- **Uneinigkeit im Release Board:** Liegen die Bewertungen eines Kriteriums 3 oder mehr Punkte auseinander, erscheint ein Hinweis, die Anforderung vor der Einplanung zu besprechen.
- **Reserve in der Roadmap:** Neue Einstellung «Reserve in %», Standard 20 %. Der automatische Vorschlag lässt diesen Anteil jeder Release-Kapazität frei.
- **Datensicherung:** Das Portal merkt sich den letzten CSV-Export und zeigt ihn in den Einstellungen an. Der Product Owner erhält einen Hinweis, wenn noch nie oder seit über 30 Tagen nicht exportiert wurde.

## [0.6.0] - 2026-10-03

### Hinzugefügt
- Fusszeile «EW Höfe AG | CRM-Anforderungsportal · Version x.y.z» mit hellblauer Linie. Die Version liest `build.sh` aus dem obersten Eintrag dieses Changelogs.

### Geändert
- Farben nach der Corporate Identity der EW Höfe AG:
  - Primärblau `#006FB9`
  - Untertitel in Akzentblau `#0076B8`
  - Linien und Rahmen in Hellblau `#9FC6DF`
- Tabellen im EWH-Stil: dunkelblaue Kopfzeile mit weisser, fetter Schrift, abwechselnd weisse und `#F5F7F8` gefärbte Zeilen. Bei den Kennzahlen im Detail sind die Bezeichnungen fett.

## [0.5.0] - 2026-10-03

### Hinzugefügt
- EWH-Logo in der Kopfzeile. Gemäss Markenvorgabe bleibt es unverändert, im dunklen Modus steht es auf einer weissen Fläche. Die Datei liegt unter `assets/ewh-logo.png`, `build.sh` bettet sie in die Seite ein.

## [0.4.0] - 2026-10-03

### Hinzugefügt
- **Hinweise im Portal:** Am Reiter «Anforderungen» steht eine Zahl mit den Neuigkeiten seit dem letzten Besuch, oben in der Liste eine Box «Neu seit Ihrem letzten Besuch». Jeder Eintrag öffnet die Anforderung, «Als gelesen markieren» leert die Box.
  - Product Owner: neue und erneut eingereichte Anforderungen
  - Release Board: zur Bewertung freigegebene Anforderungen, die das Mitglied noch nicht bewertet hat
  - Einreichende: Statuswechsel der eigenen Anforderungen, bei Rückfragen mit dem Fragetext
  - Eigene Aktionen lösen keinen Hinweis aus. Beim ersten Besuch werden keine alten Einträge als neu gezeigt.
- Übergabedokument [uebergabe.md](uebergabe.md) mit Stand, Arbeitsweise, Entscheiden und offenen Punkten.

## [0.3.1] - 2026-10-02

### Behoben
- **Einreichen, Schritt «Pain»:** Häufigkeit, Zeitaufwand und betroffene Personen stehen auf einer Höhe, auch wenn eine Beschriftung umbricht. Textfelder und Auswahllisten sind gleich hoch.

### Geändert
- Die Beschriftung «Zeitaufwand in h pro Woche und Person» heisst kürzer «Aufwand pro Person (h/Woche)».

## [0.3.0] - 2026-10-02

### Hinzugefügt
- Umschalter für das Farbschema in der Kopfzeile: «System», «Hell» oder «Dunkel».
  - Die Wahl wird im Browser der jeweiligen Person gespeichert und gilt nach dem Neuladen weiter.
  - Sie hat Vorrang vor der Vorgabe von claude.ai.
  - «System» folgt wieder der Einstellung des Betriebssystems bzw. von claude.ai.

## [0.2.1] - 2026-10-02

### Geändert
- Rollenbegriffe: Aus «Gremium» wird «Release Board», aus «Administration» wird «Product Owner». Das gilt für die ganze Oberfläche, den CSV-Export und die README. Die Berechtigungen bleiben unverändert.

## [0.2.0] - 2026-10-02

### Hinzugefügt
- **Einreichen:** Neben dem Formular steht eine Hilfespalte. Sie enthält Tipps für eine gute Anforderung, den Ablauf nach dem Einreichen und die eigenen Anforderungen mit Status und Link zum Detail. Auf schmalen Bildschirmen steht sie unter dem Formular.
- README und Changelog

### Geändert
- **Einreichen:** Das Formular nutzt die volle Breite der Seite.
- **Einreichen:** Die doppelte Überschrift des aktuellen Schritts ist entfernt. Die Schrittleiste zeigt den Schritt bereits an, für Screenreader bleibt die Überschrift erhalten.
- Hinweistexte unter den Feldern brechen nicht mehr mitten im Satz um.

## [0.1.0] - 2026-10-02

Erste Version für den Pilot, veröffentlicht als privates claude.ai-Artifact.

### Hinzugefügt
- **Einreichen:**
  - geführtes Formular in vier Schritten (Worum geht es, Pain, Gain, Systeme) mit Pflichtfeldern, Mindestlängen und Vollständigkeitsanzeige
  - Berechnung des Einsparpotenzials in Stunden pro Jahr
  - Bearbeiten durch die einreichende Person in den Status «Eingereicht» und «In Klärung»
- **Statusmodell:**
  - Status: Eingereicht, In Klärung, In Bewertung, Bewertet, Eingeplant, Umgesetzt, Abgelehnt, Zurückgestellt
  - festgelegte erlaubte Übergänge und ein Statusverlauf
  - Pflichtbegründung bei Ablehnung und Rückstellung
- **Bewertung:**
  - fünf Kriterien mit gewichtetem Nutzen-Index, Score und Quadrant
  - Blindbewertung im Gremium
  - automatischer Wechsel auf «Bewertet», sobald die Mindestanzahl Bewertungen erreicht ist
- **Rückfragen und Antworten** zu jeder Anforderung
- **Auswertung:** Kennzahlen, Nutzen/Aufwand-Matrix, Rangliste, Verteilungen nach Status, CRM-Bereich und Abteilung sowie das Ablösepotenzial der genannten Systeme
- **Roadmap:**
  - Releases mit Kapazität in Aufwandspunkten
  - Drag & Drop und Auswahl auf der Karte
  - automatischer Vorschlag nach Score
  - Warnung bei Überbuchung
  - Auslieferung eines Release
- **Einstellungen:**
  - Ersteinrichtung mit Vorschlägen
  - Gewichte, Mindestanzahl Bewertungen, Arbeitswochen pro Jahr, Wertelisten
  - Gremium, Releases
  - CSV-Export für Excel
- Datenbankregeln: Einstellungen und Releases kann nur die Administration ändern, Bewertungen nur die bewertende Person selbst.
- Tests:
  - Logik-Tests in Node
  - UI-Tests sowie automatische Klicktests gegen einen Mock der Plattform in Edge im Headless-Modus

### Behoben (vor der Veröffentlichung, aus dem Abschlussreview)
- Gremium-Mitglieder ohne eigene Bewertung sahen Ergebnisse im Status «Bewertet».
- Die erste Bewertung einer Person konnte ihre früheren Bewertungen überschreiben.
- Der Einrichtungsassistent erschien vor dem Laden der Daten und konnte bestehende Einstellungen überschreiben.
- Anforderungen konnten in «In Bewertung» hängen bleiben. Die Administration kann sie jetzt als bewertet markieren.
- Links, die nicht mit http oder https beginnen, wurden als anklickbarer Link angezeigt.
- Eine Anforderung liess sich bearbeiten, nachdem sie bereits in Bewertung war. Statuswechsel mit veraltetem Stand konnten Einträge im Verlauf verlieren.
- Lesende und nicht angemeldete Personen konnten Formularfelder ausfüllen.

[Unveröffentlicht]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/releases/tag/v0.1.0
