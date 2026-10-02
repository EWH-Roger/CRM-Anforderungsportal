# Anforderungsportal CRM – Design-Spezifikation

Datum: 2026-10-02
Autor: Roger Oettli (mit Claude)
Status: Entwurf zur Prüfung

## 1. Ziel

Anforderungen und Use Cases für Erweiterungen des CRM, die das Business einreicht, sollen in einem standardisierten Prozess erfasst, durch ein Gremium bewertet und anhand der Bewertungen in eine Release-Roadmap überführt werden.

**Erfolgskriterien**

- Einreichungen sind qualifiziert: Pain, Gain, betroffene und ablösbare Systeme sind erfasst.
- Jede Anforderung hat einen nachvollziehbaren Status und eine nachvollziehbare Bewertung.
- Aus den Bewertungen lässt sich mit wenig Aufwand eine Roadmap nach Releases mit Kapazitätsgrenze erstellen.
- Die Daten sind jederzeit als CSV exportierbar.

**Rahmen**

- Pilot als claude.ai-Artifact (eine HTML-Seite) mit den Capabilities `db` (gemeinsame Datenbank) und `user` (Benutzererkennung, Profilnamen).
- Interner Gebrauch bei der EW Höfe AG mit einer überschaubaren Anzahl Benutzender.
- Kein KI-Qualitätscheck im Pilot. Er ist als mögliche spätere Erweiterung vorgesehen.
- Keine Datei-Anhänge im Pilot. Stattdessen gibt es ein Link-Feld, zum Beispiel auf SharePoint oder Teams.

## 2. Rollen

| Rolle | Wer | Rechte |
|---|---|---|
| Administration | Roger Oettli (Owner/Editor des Artifacts) | Alles: Status, Roadmap, Einstellungen |
| Gremium | In den Einstellungen gepflegte Personen | Bewerten, zusätzlich alle Rechte der Einreichenden |
| Einreichende | Alle mit Freigabe «Contributor» | Einreichen, Rückfragen beantworten, alles lesen |
| Lesende | Freigabe «Viewer» | Nur lesen |

Sichtbarkeit: Alle Berechtigten sehen alle Anforderungen. Das schafft Transparenz und hilft, Doppeleinreichungen zu vermeiden.

## 3. Prozess und Status

| Status | Auslöser | Bedeutung |
|---|---|---|
| Eingereicht | Einreichende | Formular abgeschickt |
| In Klärung | Administration | Angaben fehlen, Rückfrage an die einreichende Person |
| In Bewertung | Administration | Zur Bewertung durch das Gremium freigegeben |
| Bewertet | automatisch | Mindestanzahl Bewertungen erreicht (Standard: 3) |
| Eingeplant | Roadmap-Zuordnung | Einem Release zugeordnet |
| Umgesetzt | Release ausgeliefert | Release als ausgeliefert markiert |
| Abgelehnt | Administration | Begründung ist Pflicht und für alle sichtbar |
| Zurückgestellt | Administration | Begründung ist Pflicht und für alle sichtbar |

Jeder Statuswechsel wird im Statusverlauf festgehalten: Status, Zeitpunkt, Benutzer-ID und optional ein Kommentar.

Erlaubte Übergänge:

- Eingereicht → In Klärung, In Bewertung, Abgelehnt, Zurückgestellt
- In Klärung → Eingereicht (sobald die Antwort vorliegt), Abgelehnt, Zurückgestellt
- In Bewertung → Bewertet (automatisch), Abgelehnt, Zurückgestellt
- Bewertet ↔ Eingeplant (über die Roadmap)
- Bewertet → Abgelehnt, Zurückgestellt (z. B. nach tiefer Bewertung)
- Eingeplant → Umgesetzt (über das Release)
- Zurückgestellt → Eingereicht (Reaktivierung durch die Administration)

Wird eine Anforderung aus einem Release zurück in den Backlog gezogen, geht sie wieder auf «Bewertet».

## 4. Einreichungsformular

Das Formular wird in vier geführten Schritten ausgefüllt. Jedes Feld hat einen Hilfetext und ein Beispiel. Eine Qualitätsanzeige zeigt die Vollständigkeit in Prozent.

**Schritt 1 – Worum geht es?**

| Feld | Typ | Pflicht |
|---|---|---|
| Titel | Text, max. 120 Zeichen | ja |
| Abteilung | Auswahl (Werteliste) | ja |
| CRM-Bereich | Auswahl (Werteliste) | ja |
| Use Case | Text («Als … möchte ich …, damit …») | nein |

**Schritt 2 – Pain (heutiges Problem)**

| Feld | Typ | Pflicht |
|---|---|---|
| Heutige Situation | Text, mind. 80 Zeichen | ja |
| Häufigkeit | täglich / wöchentlich / monatlich / seltener | ja |
| Zeitaufwand | Stunden pro Woche und Person (Zahl ≥ 0) | ja |
| Anzahl betroffene Personen | Zahl ≥ 1 | ja |
| Folgen | Mehrfachauswahl: Fehler, Doppelerfassung, Medienbrüche, Kundenreklamationen, Compliance-Risiko | nein |

**Schritt 3 – Gain (erwarteter Nutzen)**

| Feld | Typ | Pflicht |
|---|---|---|
| Nutzen für die Abteilung | Text, mind. 50 Zeichen | ja |
| Nutzen für das Unternehmen | Text | nein |
| Erfolgskriterium | Text (messbar formuliert) | ja |
| Frist | Datum | nein |
| Grund für die Frist | Text (Pflicht, wenn eine Frist angegeben ist) | bedingt |

**Schritt 4 – Systeme**

| Feld | Typ | Pflicht |
|---|---|---|
| Betroffene Systeme | Mehrfachauswahl (Systemliste) plus Freitext | nein |
| Ablösbare Systeme | Liste von Einträgen: System (Auswahl oder Freitext) und «Was leistet es heute?» | nein |
| Links | URL-Liste (z. B. SharePoint, Teams) | nein |

**Validierung**

- Absenden ist erst möglich, wenn alle Pflichtfelder gültig ausgefüllt sind.
- Die Qualitätsanzeige zählt die Pflichtfelder und die optionalen Felder, die optionalen gewichtet mit 0,5. Sie hat nur informativen Charakter.

**Abgeleitete Kennzahl**

Einsparpotenzial in Stunden pro Jahr = Zeitaufwand (h/Woche/Person) × Anzahl Personen × 46.

Der Faktor 46 steht für die Arbeitswochen pro Jahr und ist in den Einstellungen anpassbar. Die Kennzahl dient als Information für das Gremium und fliesst nicht automatisch in den Score ein.

## 5. Bewertung

Jedes Gremium-Mitglied bewertet jede Anforderung im Status «In Bewertung» einmal. Die Bewertung lässt sich bis zum Status «Eingeplant» ändern.

| Kriterium | Skala | Art |
|---|---|---|
| Geschäftsnutzen | 1–5 | Nutzen |
| Anzahl Betroffene | 1–5 | Nutzen |
| Dringlichkeit | 1–5 | Nutzen |
| Strategischer Fit | 1–5 | Nutzen |
| Aufwand | 1–5 | Aufwand |

Zu jeder Bewertung gibt es ein optionales Kommentarfeld.

**Blinde Bewertung:** Den Durchschnitt und die Bewertungen der anderen sieht ein Mitglied erst, nachdem es selbst bewertet hat. Die Administration sieht immer alles.

**Berechnung** (wird beim Anzeigen berechnet, nicht gespeichert):

- Es zählen nur Bewertungen von Personen, die aktuell zum Gremium gehören.
- Pro Kriterium wird der Durchschnitt über diese Bewertungen gebildet.
- Nutzen-Index = Σ (Gewicht_k × Ø_k) / Σ Gewicht_k über die vier Nutzen-Kriterien, Wertebereich 1–5. Die Standardgewichte sind alle 1.
- Score = Nutzen-Index / Ø Aufwand. Er wird auf zwei Nachkommastellen gerundet.
- Matrix-Quadrant mit Schwelle 3 auf beiden Achsen:
  - Nutzen ≥ 3 und Aufwand < 3: Quick Win
  - Nutzen ≥ 3 und Aufwand ≥ 3: Grosses Vorhaben
  - Nutzen < 3 und Aufwand < 3: Lückenfüller
  - Nutzen < 3 und Aufwand ≥ 3: Vermeiden
- Erreicht die Zahl der gültigen Bewertungen die Mindestanzahl, setzt die Seite den Status auf «Bewertet». Dies geschieht beim Speichern der Bewertung, welche die Schwelle erreicht.

**Aufwandspunkte für die Roadmap:** Der gerundete Ø-Aufwand (1–5) ist die Standardgrösse. Die Administration kann pro Anforderung einen abweichenden Wert in Aufwandspunkten setzen, zum Beispiel nach einer Schätzung durch die IT.

## 6. Ansichten

### 6.1 Einreichen
- Das Formular aus Abschnitt 4.
- Nach dem Absenden folgt eine Bestätigung mit der Nummer der Anforderung und einem Link zur Detailansicht.

### 6.2 Anforderungen
- Liste mit Nummer, Titel, Abteilung, CRM-Bereich, Status, Score und Datum.
- Filter nach Status, CRM-Bereich und Abteilung, Volltextsuche, Sortierung.
- Schalter «Nur meine».
- Detailansicht:
  - alle Angaben, Einsparpotenzial, Statusverlauf
  - Rückfragen und Antworten
  - Bewertungsbereich für das Gremium
  - Statusaktionen für die Administration
- Bearbeiten durch die einreichende Person ist nur in den Status «Eingereicht» und «In Klärung» möglich.

### 6.3 Auswertung
- Nutzen/Aufwand-Streudiagramm mit allen bewerteten Anforderungen. Die Quadranten sind beschriftet, ein Klick auf einen Punkt öffnet das Detail.
- Rangliste nach Score.
- Kennzahlen:
  - Anzahl pro Status, pro CRM-Bereich und pro Abteilung
  - Ø Durchlaufzeit von «Eingereicht» bis «Bewertet»
  - Summe des Einsparpotenzials
- Ablösepotenzial: Systeme, sortiert nach der Anzahl Anforderungen, die sie als ablösbar nennen.

### 6.4 Roadmap
- Die Spalte «Backlog» enthält alle Anforderungen im Status «Bewertet», sortiert nach Score.
- Pro offenem Release gibt es eine Spalte mit Name, Kapazität, verplanten Punkten und einem Auslastungsbalken. Bei Überbuchung erscheint eine Warnung.
- Drag & Drop zwischen Backlog und Releases (nur Administration). Für Tastatur und Mobilgeräte gibt es zusätzlich ein Auswahlfeld «Release zuordnen».
- **Automatisch vorschlagen:** Der Vorschlag nimmt die Backlog-Einträge in absteigender Reihenfolge nach Score. Jeder Eintrag kommt in das erste offene Release, chronologisch nach Reihenfolge, das noch genügend freie Kapazität hat. Was nirgends passt, bleibt im Backlog. Bestehende Zuordnungen bleiben unverändert. Der Vorschlag wird erst nach Bestätigung gespeichert.
- **Release ausliefern:** Das Release wird als ausgeliefert markiert, und alle zugeordneten Anforderungen gehen auf «Umgesetzt». Ausgelieferte Releases sind einklappbar.

### 6.5 Einstellungen (nur Administration)
- Gremium-Mitglieder, ausgewählt über die Personensuche
- Gewichte der Nutzen-Kriterien (0–3, Schritt 0,5)
- Mindestanzahl Bewertungen
- Arbeitswochen pro Jahr
- Wertelisten: Abteilungen, CRM-Bereiche, Systeme
- Releases: Name, Reihenfolge, Kapazität, Status
- CSV-Export: je eine Datei für Anforderungen (inkl. berechnetem Score) und Bewertungen

## 7. Datenmodell (Artifact-Datenbank)

```
config/settings
  committee: [userId]          (Administration = Freigabe Editor/Owner, kein eigenes Feld)
  weights: {nutzen, betroffene, dringlichkeit, fit}
  minRatings: number, weeksPerYear: number
  departments: [string], crmAreas: [string], systems: [string]

releases/{releaseId}
  name, order: number, capacity: number, status: "offen" | "ausgeliefert"

requests/{requestId}
  number: number, title, department, crmArea, useCase
  pain: {situation, frequency, hoursPerWeek, persons, consequences: [string]}
  gain: {department, company, successCriterion, deadline, deadlineReason}
  systems: {affected: [string], replaceable: [{system, purpose}]}
  links: [url]
  status, statusHistory: [{status, at, by, comment}]
  submittedBy: userId, submittedAt, updatedAt
  releaseId: string | null, effortOverride: number | null
  decisionReason: string | null

ratings/{userId}               (ein Dokument pro Person)
  byRequest: { <requestId>: {nutzen, betroffene, dringlichkeit, fit, aufwand: 1..5,
                             comment, updatedAt} }

requests/{requestId}/comments/{commentId}
  by: userId, at, text
```

Die laufende Nummer ergibt sich als höchste vorhandene Nummer + 1. Im Pilot ist eine seltene Doppelvergabe bei gleichzeitigem Absenden akzeptiert, denn die ID bleibt eindeutig.

Gespeichert werden nur Benutzer-IDs. Namen werden beim Anzeigen über die Profile aufgelöst.

## 8. Berechtigungen (Datenbankregeln)

- Lesen: alle mit Zugriff auf das Artifact.
- `requests`: Schreiben ab Freigabe «Contributor».
- `ratings/{self}`: Jede Person schreibt nur das eigene Bewertungsdokument (Regel `{self}`), alle lesen.
- `config` und `releases`: nur Administration (Freigabe Editor/Owner, Stufe `admin`).

Deklaration:

```
db: { rules: [
  { path: "config",         write: "admin" },
  { path: "releases",       write: "admin" },
  { path: "ratings",        read: "view", write: "owner" },
  { path: "ratings/{self}", write: "interact" }
] }
```

**Bekannte Einschränkungen im Pilot**

- Die Gremium-Zugehörigkeit prüft nur die Oberfläche. Bewertungen von Personen ausserhalb des Gremiums werden in der Berechnung ignoriert.
- Statuswechsel und Roadmap-Zuordnungen auf `requests` schützt nur die Oberfläche. Technisch könnte ein Contributor diese Felder ändern.

Für den internen Pilot ist das akzeptiert. Für einen produktiven Betrieb wäre eine Plattform mit serverseitiger Logik nötig.

## 9. Fehlerfälle

- Datenbank nicht verfügbar oder nicht angemeldet: Hinweis, nur Lesemodus bzw. leere Ansicht mit Erklärung.
- Keine Schreibberechtigung: Das Formular ist sichtbar, aber gesperrt, und nennt den Grund.
- Ein Schreibvorgang wird abgelehnt: Fehlermeldung, die Eingaben bleiben erhalten.
- Leere Datenbank: Ein Einrichtungsassistent für die Administration legt Einstellungen, Wertelisten und das erste Release an.
- Gelöschter Wert in einer Werteliste: Bestehende Anforderungen behalten den Text, der Filter zeigt ihn weiterhin an.

## 10. Tests und Abnahme

- Die Berechnungsfunktionen sind als reine Funktionen umgesetzt und werden separat getestet:
  - Nutzen-Index, Score, Quadrant
  - Durchschnitt nur über Gremium-Bewertungen
  - Einsparpotenzial
  - automatischer Release-Vorschlag inkl. Kapazitätsgrenze und unveränderter bestehender Zuordnungen
- Nach dem Veröffentlichen:
  - Eine Test-Einreichung und eine Test-Bewertung werden angelegt.
  - Die Daten werden über die Datenbank gelesen und die Regeln mit tieferer Berechtigungsstufe geprüft.
  - Danach werden die Testdaten gelöscht.
- Darstellung auf dem Desktop und mit Smartphone-Breite, in hellem und dunklem Modus.

## 11. Ausserhalb des Pilots

- KI-Qualitätscheck der Einreichung
- Datei-Anhänge
- Benachrichtigungen per E-Mail oder Teams
- Serverseitig erzwungene Rollen und Statuslogik
- Anbindung an das CRM oder an ein Ticketsystem
