# Changelog

Alle wesentlichen Änderungen am CRM-Anforderungsportal stehen in dieser Datei.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionsnummern folgen [Semantic Versioning](https://semver.org/lang/de/). Neue Einträge kommen zuerst unter «Unveröffentlicht». Bei jeder Veröffentlichung des Artifacts wird daraus eine neue Version mit Datum.

## [Unveröffentlicht]

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

[Unveröffentlicht]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/EWH-Roger/CRM-Anforderungsportal/releases/tag/v0.1.0
