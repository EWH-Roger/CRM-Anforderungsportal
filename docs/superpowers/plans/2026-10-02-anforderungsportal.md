# CRM-Anforderungsportal – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein claude.ai-Artifact, über das das Business qualifizierte CRM-Anforderungen einreicht, ein Gremium sie bewertet und die Administration sie anhand der Bewertung Releases zuordnet.

**Architecture:** Eine einzige HTML-Seite. Sie wird aus mehreren Quelldateien in `src/` zu `dist/anforderungsportal.html` zusammengesetzt, die gesamte Logik ist inline. Die reine Fachlogik (`src/logic.js`) hat keine DOM- und keine Datenbankzugriffe. Sie wird in Node getestet, die UI-Helfer in Edge im Headless-Modus. Die Daten liegen in der Artifact-Datenbank (Capability `db`), die Benutzererkennung kommt über die Capability `user`. Für lokale Sichtprüfungen simuliert `tests/mock-claude.js` beide Capabilities im Speicher.

**Tech Stack:** Vanilla JavaScript (ES2020, klassische Skripte, keine Module, keine Bibliotheken), HTML, CSS, Google Font «Rubik». Bash (Git Bash) für Build und Tests, Node.js 24 für die Logik-Tests (ohne npm-Pakete), Microsoft Edge im Headless-Modus für DOM-Tests und Bildschirmfotos.

**Spec:** `docs/superpowers/specs/2026-10-02-anforderungsportal-design.md`

## Global Constraints

- Alle Texte der Oberfläche sind in Schweizer Hochdeutsch. Es wird nie «ß» verwendet, immer «ss» (grösser, Massnahme).
- Die Seite wird beim Veröffentlichen in ein Gerüst gesetzt. Die Quelldatei hat daher kein `<!doctype>`, kein `<html>`, `<head>` oder `<body>`. Sie beginnt mit `<title>`.
- Externe Ressourcen: nur das Google-Fonts-Stylesheet. Alles andere ist inline.
- `alert()`, `confirm()` und `prompt()` funktionieren im Artifact nicht. Bestätigungen laufen über das eigene `<dialog id="confirm">`.
- Downloads nur über die Capability `downloads`, nie über `<a download>`.
- Jede Farbe ist ein Token auf `:root`. Dunkle Werte gibt es unter `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` und unter `:root[data-theme="dark"]`. `body` hat einen expliziten Hintergrund.
- Die Seite funktioniert ab 400 px Breite, mit mindestens 16 px seitlichem Rand und ohne horizontales Scrollen der Seite.
- Gespeichert werden nur Benutzer-IDs, nie Namen. Namen werden beim Anzeigen über `user.profiles()` aufgelöst.
- Benutzertext wird nur als Textknoten eingefügt (Helfer `UI.h`), nie über `innerHTML`.
- Score = gewichteter Nutzen-Index ÷ Ø Aufwand, auf 2 Nachkommastellen gerundet. Die Quadranten-Schwelle liegt bei 3 auf beiden Achsen.
- Einsparpotenzial = h pro Woche und Person × Personen × Arbeitswochen pro Jahr (Standard 46), gerundet.
- Mindestlängen: Situation 80 Zeichen, Nutzen für die Abteilung 50 Zeichen. Der Titel hat höchstens 120 Zeichen.
- Rollen:
  - Administration = `user.canEdit()`, entspricht der Freigabe Editor/Owner.
  - Gremium = IDs in `config/settings.committee`.
  - Einreichen setzt mindestens die Freigabe «Contributor» voraus.
- Datenbankregeln:
  ```
  config: write admin
  releases: write admin
  ratings: read view / write owner
  ratings/{self}: write interact
  ```

## Review Focus

1. **Gleichzeitige Änderungen während der Eingabe.** Kommt ein Datenbank-Snapshot herein, während jemand tippt, darf die Eingabe nicht verloren gehen und der Fokus nicht springen. Abgedeckt durch `UI.preserve` mit Test in Task 6.
2. **Ansicht ohne Schreibrecht oder ohne Anmeldung.** Die Seite zeigt einen klaren Hinweis, die Formulare sind gesperrt, es entstehen keine Fehler in der Konsole. Sichtprüfung mit `role=viewer` in Task 8.
3. **Gremium ändert sich nach abgegebenen Bewertungen.** Es zählen nur Bewertungen aktueller Mitglieder. Test in Task 3.
4. **Dezimalkomma bei Zahlen** (`1,5` Stunden, Gewicht `0,5`). Die Eingabe wird korrekt gelesen. Test in Task 4.
5. **HTML oder Skript im Benutzertext.** Der Text erscheint wörtlich und wird nicht ausgeführt. Test in Task 6.

---

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| `src/page.html` | `<title>`, Font-Link, gesamtes CSS, statisches Markup (Kopf, Reiter, Banner, `<main id="view">`, Toast, Dialog) und die Marke `<!-- SCRIPTS -->` |
| `src/logic.js` | Globales `Logic`: Status, Bewertung, Validierung, Roadmap-Vorschlag, Kennzahlen, CSV. Rein, ohne DOM |
| `src/ui.js` | Globales `App` und `UI`: DOM-Helfer, Toast, Dialog, Formatierung, Eingabeerhalt beim Neuzeichnen |
| `src/store.js` | Globales `Store`: Capabilities laden, Snapshots abonnieren, alle Schreibvorgänge, CSV-Export |
| `src/view-settings.js` | `SettingsView`: Einrichtung, Gewichte, Wertelisten, Gremium, Releases, Export |
| `src/view-submit.js` | `SubmitView`: geführtes Formular in vier Schritten, Bearbeiten |
| `src/view-requests.js` | `RequestsView`: Liste mit Filtern, Detail mit Bewertung, Rückfragen, Statusaktionen |
| `src/view-analysis.js` | `AnalysisView`: Kennzahlen, Matrix, Rangliste, Verteilungen |
| `src/view-roadmap.js` | `RoadmapView`: Backlog, Release-Spalten, Drag & Drop, Vorschlag, Auslieferung |
| `src/main.js` | Reiter-Navigation, Kopfzeile, Banner, Start |
| `build.sh` | Erzeugt `dist/anforderungsportal.html` (zum Veröffentlichen) und `dist/dev.html` (mit Mock) |
| `tests/harness.js` | Mini-Testframework (`test`, `eq`, `ok`, `report`) |
| `tests/run-node.js`, `tests/run.html`, `tests/run.sh` | Logik-Tests in Node, UI-Tests in Edge headless; Exit-Code 1 bei Fehlern |
| `tests/*.test.js` | Tests für `Logic` und `UI` |
| `tests/mock-claude.js` | Simuliert `window.claude` (`db`, `user`, `downloads`), mit `?seed=1` und `?role=` |
| `tests/shot.sh` | Screenshot von `dist/dev.html` für Sichtprüfungen |

Die Reihenfolge im Build ist fest: `logic.js`, `ui.js`, `store.js`, `view-settings.js`, `view-submit.js`, `view-requests.js`, `view-analysis.js`, `view-roadmap.js`, `main.js`. Alle Dateien definieren je ein globales `const`. Die Dateien greifen gegenseitig erst zur Laufzeit aufeinander zu, nie beim Laden.

---

### Task 1: Projektgerüst, Test-Runner und Build

**Files:**
- Create: `.gitignore`, `build.sh`, `src/logic.js`, `src/page.html` (Platzhalter), `tests/harness.js`, `tests/run-node.js`, `tests/run.sh`, `tests/logic.test.js`

**Interfaces:**
- Produces: globale Testfunktionen `test(name, fn)`, `eq(actual, expected, msg?)` (Vergleich über `JSON.stringify`), `ok(cond, msg?)`, `report()`. `tests/run.sh` gibt PASS/FAIL je Test und je Testlauf eine Zeile `SUMMARY logic x/y` bzw. `SUMMARY x/y` (UI) aus, Exit 1 bei Fehlern. `build.sh` erzeugt `dist/anforderungsportal.html` und `dist/dev.html`.

- [ ] **Step 1: Git-Repository anlegen**

```bash
cd /d/Projekte/Form && git init -b main && mkdir -p src tests dist
printf 'dist/\n' > .gitignore
```

- [ ] **Step 2: Test-Harness schreiben**

`tests/harness.js`:
```js
/* Mini-Testframework für Edge headless. */
const __results = [];
function test(name, fn) {
  try { fn(); __results.push({ name, ok: true }); }
  catch (e) { __results.push({ name, ok: false, msg: e && e.message ? e.message : String(e) }); }
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg ? msg + ' ' : '') + 'erwartet ' + b + ', erhalten ' + a);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'Bedingung nicht erfüllt'); }
function report() {
  const fails = __results.filter(r => !r.ok);
  document.getElementById('out').textContent =
    __results.map(r => (r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : ' :: ' + r.msg)).join('\n') +
    '\nSUMMARY ' + (__results.length - fails.length) + '/' + __results.length;
}
```

`tests/run-node.js` (Logik-Tests in Node, ohne Pakete):
```js
/* Führt die Logik-Tests in Node aus: harness, logic und Tests teilen sich einen vm-Kontext. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = vm.createContext({ console });
for (const f of ['harness.js', '../src/logic.js', 'logic.test.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx, { filename: f });
}
const results = vm.runInContext('__results', ctx);
const fails = results.filter(r => !r.ok);
for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : ' :: ' + r.msg));
console.log(`SUMMARY logic ${results.length - fails.length}/${results.length}`);
process.exit(fails.length ? 1 : 0);
```

`tests/run.sh`:
```bash
#!/usr/bin/env bash
# Logik-Tests in Node; UI-Tests (ab Task 6) in Edge headless. Exit 1 bei Fehlern.
set -uo pipefail
here="$(cd "$(dirname "$0")" && (pwd -W 2>/dev/null || pwd))"
NODE="$(command -v node || echo "/c/Program Files/nodejs/node.exe")"
status=0
"$NODE" "$here/run-node.js" || status=1
if [ -f "$here/run.html" ]; then
  EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  dom="$("$EDGE" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=3000 --dump-dom "file:///$here/run.html" 2>/dev/null)"
  text="$(printf '%s' "$dom" | sed -n '/<pre id="out">/,/<\/pre>/p' | sed 's/<[^>]*>//g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&amp;/\&/g')"
  printf '%s\n' "$text"
  printf '%s' "$text" | grep -q '^SUMMARY' || { echo "Kein UI-Testergebnis erhalten"; status=1; }
  printf '%s' "$text" | grep -q '^FAIL' && status=1
fi
exit $status
```

`tests/logic.test.js`:
```js
/* Tests für src/logic.js */
test('Logic ist geladen', () => ok(typeof Logic === 'object', 'Logic fehlt'));
```

- [ ] **Step 3: Test laufen lassen, er muss scheitern**

Run: `bash tests/run.sh`
Expected: `FAIL Logic ist geladen :: Logic is not defined`, Exit-Code 1.

- [ ] **Step 4: Minimales `src/logic.js` und Build schreiben**

`src/logic.js`:
```js
/* Reine Fachlogik des CRM-Anforderungsportals. Keine DOM- und keine Datenbankzugriffe. */
const Logic = (() => {
  'use strict';
  return {};
})();
```

`src/page.html` (Platzhalter, wird in Task 6 ersetzt):
```html
<title>CRM-Anforderungsportal</title>
<main id="view"></main>
<!-- SCRIPTS -->
```

`build.sh`:
```bash
#!/usr/bin/env bash
# Setzt src/ zu einer einzigen veröffentlichbaren Seite zusammen.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
JS="src/logic.js src/ui.js src/store.js src/view-settings.js src/view-submit.js src/view-requests.js src/view-analysis.js src/view-roadmap.js src/main.js"
{
  sed '/<!-- SCRIPTS -->/,$d' src/page.html
  echo '<script>'
  for f in $JS; do [ -f "$f" ] && { cat "$f"; echo; }; done
  echo '</script>'
  sed '1,/<!-- SCRIPTS -->/d' src/page.html
} > dist/anforderungsportal.html
{
  echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
  [ -f tests/mock-claude.js ] && { echo '<script>'; cat tests/mock-claude.js; echo '</script>'; }
  cat dist/anforderungsportal.html
  echo '</body></html>'
} > dist/dev.html
grep -q '</script>' <(cat $(for f in $JS; do [ -f "$f" ] && echo "$f"; done)) && { echo "FEHLER: '</script>' im JavaScript"; exit 1; }
echo "dist/anforderungsportal.html: $(wc -c < dist/anforderungsportal.html) Bytes"
```

- [ ] **Step 5: Tests und Build laufen lassen**

Run: `bash tests/run.sh && bash build.sh`
Expected: `PASS Logic ist geladen`, `SUMMARY logic 1/1`, danach `dist/anforderungsportal.html: … Bytes`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore build.sh src tests docs
git commit -m "chore: Projektgerüst, Test-Runner und Build" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Logik – Status und Übergänge

**Files:**
- Modify: `src/logic.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Produces auf `Logic`:
  - `STATUS_LABEL: Record<status,string>`, `STATUSES: string[]`, `RESULTS_VISIBLE: string[]`
  - `canTransition(from, to): boolean`
  - `manualTargets(from): string[]`: Ziele, die die Administration per Knopf auslösen darf
  - `needsReason(to): boolean`: ob eine Begründung verlangt wird, nämlich bei `klaerung`, `abgelehnt` und `zurueckgestellt`
  - `withStatus(request, to, by, at, comment): patch`: wirft `Error` bei einem verbotenen Wechsel. Das Patch enthält `status` und das um einen Eintrag verlängerte `statusHistory`. Bei abgelehnt/zurückgestellt kommt `decisionReason` dazu. Bei eingereicht wird `decisionReason: null` gesetzt. Bei bewertet, eingereicht, abgelehnt und zurückgestellt wird `releaseId: null` gesetzt.
- Status-Schlüssel: `eingereicht`, `klaerung`, `bewertung`, `bewertet`, `eingeplant`, `umgesetzt`, `abgelehnt`, `zurueckgestellt`.

- [ ] **Step 1: Failing Tests anhängen** (an `tests/logic.test.js`)

```js
test('Übergänge: erlaubte und verbotene Wechsel', () => {
  ok(Logic.canTransition('eingereicht', 'bewertung'));
  ok(!Logic.canTransition('eingereicht', 'eingeplant'));
  ok(Logic.canTransition('eingeplant', 'bewertet'));
  ok(Logic.canTransition('bewertet', 'abgelehnt'));
  ok(!Logic.canTransition('umgesetzt', 'eingereicht'));
  ok(Logic.canTransition('zurueckgestellt', 'eingereicht'));
  ok(!Logic.canTransition('unbekannt', 'eingereicht'));
});
test('manualTargets lässt automatische Status weg', () => {
  eq(Logic.manualTargets('eingereicht'), ['klaerung', 'bewertung', 'abgelehnt', 'zurueckgestellt']);
  eq(Logic.manualTargets('bewertung'), ['abgelehnt', 'zurueckgestellt']);
  eq(Logic.manualTargets('bewertet'), ['abgelehnt', 'zurueckgestellt']);
  eq(Logic.manualTargets('eingeplant'), []);
  eq(Logic.manualTargets('klaerung'), ['eingereicht', 'abgelehnt', 'zurueckgestellt']);
});
test('needsReason', () => {
  ok(Logic.needsReason('abgelehnt')); ok(Logic.needsReason('klaerung')); ok(!Logic.needsReason('bewertung'));
});
test('withStatus ergänzt Verlauf und Begründung', () => {
  const r = { status: 'eingereicht', statusHistory: [{ status: 'eingereicht', at: 't0', by: 'u1', comment: '' }] };
  const p = Logic.withStatus(r, 'abgelehnt', 'u2', 't1', 'Bereits im Standard vorhanden');
  eq(p.status, 'abgelehnt');
  eq(p.statusHistory.length, 2);
  eq(p.statusHistory[1], { status: 'abgelehnt', at: 't1', by: 'u2', comment: 'Bereits im Standard vorhanden' });
  eq(p.decisionReason, 'Bereits im Standard vorhanden');
  eq(r.statusHistory.length, 1, 'Original unverändert:');
});
test('withStatus wirft bei verbotenem Wechsel', () => {
  let threw = false;
  try { Logic.withStatus({ status: 'eingereicht', statusHistory: [] }, 'umgesetzt', 'u', 't', ''); } catch (e) { threw = true; }
  ok(threw);
});
test('withStatus: zurück in den Backlog leert das Release', () => {
  const p = Logic.withStatus({ status: 'eingeplant', releaseId: 'r1', statusHistory: [] }, 'bewertet', 'u', 't', '');
  eq(p.releaseId, null);
});
test('withStatus: Reaktivieren löscht die Begründung', () => {
  const p = Logic.withStatus({ status: 'zurueckgestellt', decisionReason: 'x', statusHistory: [] }, 'eingereicht', 'u', 't', '');
  eq(p.decisionReason, null);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `bash tests/run.sh`
Expected: Die neuen Tests zeigen FAIL mit `Logic.canTransition is not a function` oder ähnlich.

- [ ] **Step 3: Implementierung**

`src/logic.js` vollständig ersetzen durch:
```js
/* Reine Fachlogik des CRM-Anforderungsportals. Keine DOM- und keine Datenbankzugriffe. */
const Logic = (() => {
  'use strict';

  // ---- Status ----
  const STATUS_LABEL = {
    eingereicht: 'Eingereicht', klaerung: 'In Klärung', bewertung: 'In Bewertung', bewertet: 'Bewertet',
    eingeplant: 'Eingeplant', umgesetzt: 'Umgesetzt', abgelehnt: 'Abgelehnt', zurueckgestellt: 'Zurückgestellt',
  };
  const STATUSES = Object.keys(STATUS_LABEL);
  const TRANSITIONS = {
    eingereicht: ['klaerung', 'bewertung', 'abgelehnt', 'zurueckgestellt'],
    klaerung: ['eingereicht', 'abgelehnt', 'zurueckgestellt'],
    bewertung: ['bewertet', 'abgelehnt', 'zurueckgestellt'],
    bewertet: ['eingeplant', 'abgelehnt', 'zurueckgestellt'],
    eingeplant: ['bewertet', 'umgesetzt'],
    umgesetzt: [],
    abgelehnt: [],
    zurueckgestellt: ['eingereicht'],
  };
  const MANUAL_TARGETS = ['eingereicht', 'klaerung', 'bewertung', 'abgelehnt', 'zurueckgestellt'];
  const REASON_REQUIRED = ['klaerung', 'abgelehnt', 'zurueckgestellt'];
  const RESULTS_VISIBLE = ['bewertet', 'eingeplant', 'umgesetzt'];
  const CLEARS_RELEASE = ['bewertet', 'eingereicht', 'abgelehnt', 'zurueckgestellt'];

  function canTransition(from, to) { return (TRANSITIONS[from] || []).includes(to); }
  function manualTargets(from) { return (TRANSITIONS[from] || []).filter(s => MANUAL_TARGETS.includes(s)); }
  function needsReason(to) { return REASON_REQUIRED.includes(to); }
  function withStatus(request, to, by, at, comment) {
    if (!canTransition(request.status, to)) {
      throw new Error(`Der Wechsel von «${STATUS_LABEL[request.status] || request.status}» zu «${STATUS_LABEL[to] || to}» ist nicht erlaubt.`);
    }
    const patch = { status: to, statusHistory: [...(request.statusHistory || []), { status: to, at, by, comment: comment || '' }] };
    if (to === 'abgelehnt' || to === 'zurueckgestellt') patch.decisionReason = comment || '';
    if (to === 'eingereicht') patch.decisionReason = null;
    if (CLEARS_RELEASE.includes(to)) patch.releaseId = null;
    return patch;
  }

  return { STATUS_LABEL, STATUSES, RESULTS_VISIBLE, canTransition, manualTargets, needsReason, withStatus };
})();
```

- [ ] **Step 4: Tests laufen lassen**

Run: `bash tests/run.sh`
Expected: alle PASS, `SUMMARY logic 8/8`.

- [ ] **Step 5: Commit**

```bash
git add src/logic.js tests/logic.test.js
git commit -m "feat: Statusmodell mit erlaubten Übergängen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Logik – Bewertung, Score und Quadrant

**Files:**
- Modify: `src/logic.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: Struktur `ratingDocs = { [userId]: { byRequest: { [requestId]: Rating } } }` mit `Rating = {nutzen, betroffene, dringlichkeit, fit, aufwand: 1..5, comment, updatedAt}`. Weiter `settings = {committee: string[], weights: {nutzen, betroffene, dringlichkeit, fit}, minRatings}`.
- Produces auf `Logic`:
  - `BENEFIT_KEYS`, `CRITERIA`, `CRITERIA_LABEL`, `QUADRANT_LABEL`
  - `isValidRating(r): boolean`
  - `committeeRatings(requestId, ratingDocs, committee): {[userId]: Rating}`
  - `evaluate(requestId, ratingDocs, settings): Evaluation` mit `Evaluation = {count, ratings, avg: {kriterium: number}|null, benefit|null, effort|null, score|null, quadrant|null}`
  - `benefitIndex(avg, weights): number`
  - `score(benefit, effort): number`
  - `quadrant(benefit, effort): 'quickwin'|'gross'|'lueckenfueller'|'vermeiden'`
  - `effortPoints(request, evaluation): number|null`: `request.effortOverride` hat Vorrang (auch 0), sonst der gerundete Ø-Aufwand
  - `shouldMarkRated(status, count, minRatings): boolean`

- [ ] **Step 1: Failing Tests anhängen**

```js
const SET = { committee: ['a', 'b'], weights: { nutzen: 1, betroffene: 1, dringlichkeit: 1, fit: 1 }, minRatings: 2, weeksPerYear: 46 };
const RT = (n, b, d, f, a) => ({ nutzen: n, betroffene: b, dringlichkeit: d, fit: f, aufwand: a });
test('evaluate: Durchschnitt nur über aktuelle Gremium-Mitglieder', () => {
  const docs = { a: { byRequest: { x: RT(5, 5, 5, 5, 2) } }, b: { byRequest: { x: RT(3, 3, 3, 3, 4) } }, c: { byRequest: { x: RT(1, 1, 1, 1, 5) } } };
  const ev = Logic.evaluate('x', docs, SET);
  eq(ev.count, 2); eq(ev.avg.nutzen, 4); eq(ev.effort, 3); eq(ev.benefit, 4); eq(ev.score, 1.33); eq(ev.quadrant, 'gross');
  eq(Object.keys(ev.ratings), ['a', 'b']);
});
test('evaluate: ohne Bewertungen', () => {
  const ev = Logic.evaluate('x', {}, SET);
  eq(ev.count, 0); eq(ev.score, null); eq(ev.avg, null);
});
test('evaluate ignoriert unvollständige oder ungültige Bewertungen', () => {
  eq(Logic.evaluate('x', { a: { byRequest: { x: { nutzen: 5 } } } }, SET).count, 0);
  eq(Logic.evaluate('x', { a: { byRequest: { x: RT(6, 1, 1, 1, 1) } } }, SET).count, 0);
});
test('benefitIndex gewichtet', () => {
  eq(Logic.benefitIndex(RT(5, 1, 1, 1, 0), { nutzen: 3, betroffene: 1, dringlichkeit: 0, fit: 0 }), 4);
  eq(Logic.benefitIndex(RT(5, 1, 1, 1, 0), { nutzen: 0, betroffene: 0, dringlichkeit: 0, fit: 0 }), 0);
  eq(Logic.benefitIndex(RT(4, 2, 2, 4, 0), {}), 3, 'fehlende Gewichte zählen 1:');
});
test('quadrant: Schwelle 3', () => {
  eq(Logic.quadrant(3, 2.99), 'quickwin'); eq(Logic.quadrant(3, 3), 'gross');
  eq(Logic.quadrant(2.99, 1), 'lueckenfueller'); eq(Logic.quadrant(1, 5), 'vermeiden');
});
test('score rundet auf zwei Stellen', () => { eq(Logic.score(4, 3), 1.33); eq(Logic.score(5, 1), 5); });
test('effortPoints: Override vor Durchschnitt', () => {
  eq(Logic.effortPoints({ effortOverride: 8 }, { count: 2, avg: { aufwand: 2.5 } }), 8);
  eq(Logic.effortPoints({ effortOverride: null }, { count: 2, avg: { aufwand: 2.5 } }), 3);
  eq(Logic.effortPoints({}, { count: 0 }), null);
  eq(Logic.effortPoints({ effortOverride: 0 }, { count: 0 }), 0);
});
test('shouldMarkRated', () => {
  ok(Logic.shouldMarkRated('bewertung', 2, 2)); ok(!Logic.shouldMarkRated('bewertung', 1, 2)); ok(!Logic.shouldMarkRated('bewertet', 3, 2));
});
```

- [ ] **Step 2: Tests laufen lassen, die neuen müssen scheitern**

Run: `bash tests/run.sh`
Expected: 8 neue FAIL (`Logic.evaluate is not a function` usw.).

- [ ] **Step 3: Implementierung**

In `src/logic.js` vor `return {...}` einfügen:
```js
  // ---- Bewertung ----
  const BENEFIT_KEYS = ['nutzen', 'betroffene', 'dringlichkeit', 'fit'];
  const CRITERIA = [...BENEFIT_KEYS, 'aufwand'];
  const CRITERIA_LABEL = { nutzen: 'Geschäftsnutzen', betroffene: 'Anzahl Betroffene', dringlichkeit: 'Dringlichkeit', fit: 'Strategischer Fit', aufwand: 'Aufwand' };
  const QUADRANT_LABEL = { quickwin: 'Quick Win', gross: 'Grosses Vorhaben', lueckenfueller: 'Lückenfüller', vermeiden: 'Vermeiden' };

  function isValidRating(r) { return !!r && CRITERIA.every(k => Number.isInteger(r[k]) && r[k] >= 1 && r[k] <= 5); }
  function committeeRatings(requestId, ratingDocs, committee) {
    const out = {};
    for (const uid of committee || []) {
      const r = ratingDocs && ratingDocs[uid] && ratingDocs[uid].byRequest ? ratingDocs[uid].byRequest[requestId] : null;
      if (isValidRating(r)) out[uid] = r;
    }
    return out;
  }
  function benefitIndex(avg, weights) {
    let sw = 0, s = 0;
    for (const k of BENEFIT_KEYS) {
      const w = weights && Number.isFinite(weights[k]) ? weights[k] : 1;
      sw += w; s += w * avg[k];
    }
    return sw ? s / sw : 0;
  }
  function score(benefit, effort) { return Math.round((benefit / effort) * 100) / 100; }
  function quadrant(benefit, effort) {
    if (benefit >= 3) return effort < 3 ? 'quickwin' : 'gross';
    return effort < 3 ? 'lueckenfueller' : 'vermeiden';
  }
  function evaluate(requestId, ratingDocs, settings) {
    const ratings = committeeRatings(requestId, ratingDocs, settings.committee);
    const list = Object.values(ratings);
    if (!list.length) return { count: 0, ratings, avg: null, benefit: null, effort: null, score: null, quadrant: null };
    const avg = {};
    for (const k of CRITERIA) avg[k] = list.reduce((sum, r) => sum + r[k], 0) / list.length;
    const benefit = benefitIndex(avg, settings.weights);
    const effort = avg.aufwand;
    return { count: list.length, ratings, avg, benefit, effort, score: score(benefit, effort), quadrant: quadrant(benefit, effort) };
  }
  function effortPoints(request, evaluation) {
    if (request && Number.isFinite(request.effortOverride)) return request.effortOverride;
    return evaluation && evaluation.count ? Math.round(evaluation.avg.aufwand) : null;
  }
  function shouldMarkRated(status, count, minRatings) { return status === 'bewertung' && count >= minRatings; }
```
Und die Rückgabe erweitern:
```js
  return {
    STATUS_LABEL, STATUSES, RESULTS_VISIBLE, canTransition, manualTargets, needsReason, withStatus,
    BENEFIT_KEYS, CRITERIA, CRITERIA_LABEL, QUADRANT_LABEL, isValidRating, committeeRatings, evaluate,
    benefitIndex, score, quadrant, effortPoints, shouldMarkRated,
  };
```

- [ ] **Step 4: Tests laufen lassen**

Run: `bash tests/run.sh`
Expected: `SUMMARY logic 16/16`.

- [ ] **Step 5: Commit**

```bash
git add src/logic.js tests/logic.test.js
git commit -m "feat: Bewertung, Score und Matrix-Einordnung" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Logik – Validierung, Vollständigkeit und Einsparpotenzial

**Files:**
- Modify: `src/logic.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: Formularobjekt
  ```
  { title, department, crmArea, useCase,
    pain: {situation, frequency, hoursPerWeek, persons, consequences: string[]},
    gain: {department, company, successCriterion, deadline: string|null, deadlineReason},
    systems: {affected: string[], replaceable: [{system, purpose}]},
    links: string[] }
  ```
  Die Zahlen dürfen Zahl oder String sein.
- Produces auf `Logic`:
  - `FREQUENCIES = ['täglich','wöchentlich','monatlich','seltener']`
  - `CONSEQUENCES = ['Fehler','Doppelerfassung','Medienbrüche','Kundenreklamationen','Compliance-Risiko']`
  - `LIMITS = {titleMax:120, situationMin:80, gainMin:50}`
  - `parseNum(v): number`: akzeptiert Komma, leer ergibt `NaN`
  - `validateSubmission(form): {valid, errors: {[key]: string}, quality: 0..100}`. Die Fehlerschlüssel sind `title`, `department`, `crmArea`, `pain.situation`, `pain.frequency`, `pain.hoursPerWeek`, `pain.persons`, `gain.department`, `gain.successCriterion`, `gain.deadlineReason` und `links`.
  - `savingsHoursPerYear(pain, weeksPerYear): number`

- [ ] **Step 1: Failing Tests anhängen**

```js
const FULL = () => ({
  title: 'Offerten aus dem CRM', department: 'Verkauf', crmArea: 'Verträge', useCase: 'Als Beraterin möchte ich …',
  pain: { situation: 'x'.repeat(80), frequency: 'wöchentlich', hoursPerWeek: 1.5, persons: 4, consequences: ['Fehler'] },
  gain: { department: 'y'.repeat(50), company: 'Kundenzufriedenheit', successCriterion: 'Durchlaufzeit 5 auf 2 Tage', deadline: null, deadlineReason: '' },
  systems: { affected: ['Excel'], replaceable: [{ system: 'Excel', purpose: 'Preise' }] },
  links: ['https://example.sharepoint.com/a'],
});
test('validateSubmission: vollständig ist gültig mit 100 %', () => {
  const r = Logic.validateSubmission(FULL()); eq(r.errors, {}); ok(r.valid); eq(r.quality, 100);
});
test('validateSubmission: leeres Formular', () => {
  const r = Logic.validateSubmission({});
  ok(!r.valid);
  eq(Object.keys(r.errors).sort(), ['crmArea', 'department', 'gain.department', 'gain.successCriterion', 'pain.frequency', 'pain.hoursPerWeek', 'pain.persons', 'pain.situation', 'title']);
  eq(r.quality, 0);
});
test('Mindestlängen für Pain und Gain', () => {
  const f = FULL(); f.pain.situation = 'x'.repeat(79); f.gain.department = 'y'.repeat(49);
  const e = Logic.validateSubmission(f).errors;
  ok(e['pain.situation'] && e['pain.situation'].includes('aktuell 79'), e['pain.situation']);
  ok(e['gain.department']);
});
test('Leerzeichen zählen nicht zur Mindestlänge', () => {
  const f = FULL(); f.pain.situation = ' '.repeat(100);
  ok(Logic.validateSubmission(f).errors['pain.situation']);
});
test('Nur Pflichtfelder ergibt 75 %', () => {
  const f = FULL(); f.useCase = ''; f.pain.consequences = []; f.gain.company = ''; f.systems = { affected: [], replaceable: [] }; f.links = [];
  const r = Logic.validateSubmission(f); ok(r.valid); eq(r.quality, 75);
});
test('Frist ohne Grund ist ungültig', () => {
  const f = FULL(); f.gain.deadline = '2027-01-01';
  ok(Logic.validateSubmission(f).errors['gain.deadlineReason']);
  f.gain.deadlineReason = 'Neue Vorgabe'; ok(Logic.validateSubmission(f).valid);
});
test('Zahlen: Dezimalkomma, 0 Stunden erlaubt, Personen ganzzahlig ab 1', () => {
  eq(Logic.parseNum('1,5'), 1.5); ok(Number.isNaN(Logic.parseNum(''))); ok(Number.isNaN(Logic.parseNum('abc')));
  const f = FULL(); f.pain.hoursPerWeek = '0'; ok(!Logic.validateSubmission(f).errors['pain.hoursPerWeek']);
  f.pain.hoursPerWeek = '1,5'; ok(!Logic.validateSubmission(f).errors['pain.hoursPerWeek']);
  f.pain.hoursPerWeek = '-1'; ok(Logic.validateSubmission(f).errors['pain.hoursPerWeek']);
  f.pain.hoursPerWeek = 1; f.pain.persons = '2,5'; ok(Logic.validateSubmission(f).errors['pain.persons']);
  f.pain.persons = 0; ok(Logic.validateSubmission(f).errors['pain.persons']);
});
test('Ungültiger Link wird genannt', () => {
  const f = FULL(); f.links = ['https://ok.example/x', 'sharepoint/xyz'];
  ok(Logic.validateSubmission(f).errors.links.includes('sharepoint/xyz'));
});
test('Titel über 120 Zeichen', () => {
  const f = FULL(); f.title = 't'.repeat(121); ok(Logic.validateSubmission(f).errors.title);
});
test('Unbekannte Häufigkeit ist ungültig', () => {
  const f = FULL(); f.pain.frequency = 'stündlich'; ok(Logic.validateSubmission(f).errors['pain.frequency']);
});
test('savingsHoursPerYear', () => {
  eq(Logic.savingsHoursPerYear({ hoursPerWeek: 1.5, persons: 4 }, 46), 276);
  eq(Logic.savingsHoursPerYear({ hoursPerWeek: '1,5', persons: '4' }, 46), 276);
  eq(Logic.savingsHoursPerYear({}, 46), 0);
  eq(Logic.savingsHoursPerYear(undefined, 46), 0);
});
```

- [ ] **Step 2: Tests laufen lassen, die neuen müssen scheitern**

Run: `bash tests/run.sh`
Expected: 11 neue FAIL.

- [ ] **Step 3: Implementierung**

In `src/logic.js` vor `return {...}` einfügen:
```js
  // ---- Einreichung ----
  const FREQUENCIES = ['täglich', 'wöchentlich', 'monatlich', 'seltener'];
  const CONSEQUENCES = ['Fehler', 'Doppelerfassung', 'Medienbrüche', 'Kundenreklamationen', 'Compliance-Risiko'];
  const LIMITS = { titleMax: 120, situationMin: 80, gainMin: 50 };
  const REQUIRED_KEYS = ['title', 'department', 'crmArea', 'pain.situation', 'pain.frequency', 'pain.hoursPerWeek', 'pain.persons', 'gain.department', 'gain.successCriterion'];

  function parseNum(v) {
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim().replace(',', '.');
    return s === '' ? NaN : Number(s);
  }
  const len = v => String(v == null ? '' : v).trim().length;

  function validateSubmission(f) {
    const e = {};
    const p = f.pain || {}, g = f.gain || {};
    if (!len(f.title)) e.title = 'Bitte einen Titel angeben.';
    else if (len(f.title) > LIMITS.titleMax) e.title = `Der Titel darf höchstens ${LIMITS.titleMax} Zeichen lang sein.`;
    if (!len(f.department)) e.department = 'Bitte die Abteilung wählen.';
    if (!len(f.crmArea)) e.crmArea = 'Bitte den betroffenen CRM-Bereich wählen.';
    if (len(p.situation) < LIMITS.situationMin) e['pain.situation'] = `Bitte die heutige Situation genauer beschreiben: mindestens ${LIMITS.situationMin} Zeichen (aktuell ${len(p.situation)}).`;
    if (!FREQUENCIES.includes(p.frequency)) e['pain.frequency'] = 'Bitte die Häufigkeit wählen.';
    const hours = parseNum(p.hoursPerWeek);
    if (!Number.isFinite(hours) || hours < 0) e['pain.hoursPerWeek'] = 'Bitte den Zeitaufwand in Stunden pro Woche angeben (0 oder mehr, z. B. 1,5).';
    const persons = parseNum(p.persons);
    if (!Number.isInteger(persons) || persons < 1) e['pain.persons'] = 'Bitte die Anzahl betroffener Personen als ganze Zahl ab 1 angeben.';
    if (len(g.department) < LIMITS.gainMin) e['gain.department'] = `Bitte den Nutzen für die Abteilung genauer beschreiben: mindestens ${LIMITS.gainMin} Zeichen (aktuell ${len(g.department)}).`;
    if (!len(g.successCriterion)) e['gain.successCriterion'] = 'Bitte ein messbares Erfolgskriterium angeben.';
    if (len(g.deadline) && !len(g.deadlineReason)) e['gain.deadlineReason'] = 'Bitte den Grund für die Frist angeben.';
    const badLink = (f.links || []).find(u => !/^https?:\/\/\S+$/i.test(u));
    if (badLink) e.links = `Dieser Link ist ungültig: ${badLink}. Links beginnen mit http:// oder https://.`;
    return { valid: Object.keys(e).length === 0, errors: e, quality: quality(f, e) };
  }
  function quality(f, errors) {
    const optional = [
      len(f.useCase) > 0,
      ((f.pain && f.pain.consequences) || []).length > 0,
      len(f.gain && f.gain.company) > 0,
      ((f.systems && f.systems.affected) || []).length > 0,
      ((f.systems && f.systems.replaceable) || []).length > 0,
      (f.links || []).length > 0,
    ];
    const got = REQUIRED_KEYS.filter(k => !errors[k]).length + 0.5 * optional.filter(Boolean).length;
    const total = REQUIRED_KEYS.length + 0.5 * optional.length;
    return Math.round((got / total) * 100);
  }
  function savingsHoursPerYear(pain, weeksPerYear) {
    const h = parseNum(pain && pain.hoursPerWeek), n = parseNum(pain && pain.persons);
    if (!Number.isFinite(h) || !Number.isFinite(n)) return 0;
    return Math.round(h * n * weeksPerYear);
  }
```
Rückgabe erweitern um `FREQUENCIES, CONSEQUENCES, LIMITS, parseNum, validateSubmission, savingsHoursPerYear`.

- [ ] **Step 4: Tests laufen lassen**

Run: `bash tests/run.sh`
Expected: `SUMMARY logic 27/27`.

- [ ] **Step 5: Commit**

```bash
git add src/logic.js tests/logic.test.js
git commit -m "feat: Validierung, Vollständigkeit und Einsparpotenzial" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Logik – Roadmap-Vorschlag, Kennzahlen und CSV

**Files:**
- Modify: `src/logic.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Produces auf `Logic`:
  - `suggestRoadmap(backlog: [{id, number, score, points}], releases: [{id, order, capacity, status, used}]): [{requestId, releaseId}]`
    - Nimmt die Einträge absteigend nach Score, bei Gleichstand die kleinere Nummer zuerst.
    - Jeder Eintrag kommt in das erste offene Release mit genügend freier Kapazität.
    - Einträge ohne Punkte werden übersprungen.
    - Die Eingaben bleiben unverändert.
  - `releaseUsage(releaseId, items: [{releaseId, points}]): number`
  - `nextNumber(requests): number`
  - `countBy(items, keyFn): [{key, count}]`: `keyFn` darf ein Array liefern. Sortiert nach Anzahl absteigend, dann alphabetisch.
  - `leadTimeDays(statusHistory): number|null`
  - `average(nums): number|null`: ignoriert Werte, die keine Zahl sind
  - `replacementPotential(requests): [{key, count}]`: zählt jedes System pro Anforderung einmal, getrimmt
  - `toCsv(columns: [{key,label}], rows): string`: Semikolon, CRLF, BOM am Anfang. Werte werden nach CSV-Regeln quotiert, Strings mit `= + - @` am Anfang erhalten ein vorangestelltes `'`.

- [ ] **Step 1: Failing Tests anhängen**

```js
test('suggestRoadmap: nach Score, erstes offenes Release mit Platz', () => {
  const backlog = [
    { id: 'a', number: 1, score: 1.0, points: 3 }, { id: 'b', number: 2, score: 2.5, points: 4 },
    { id: 'c', number: 3, score: 2.0, points: 5 }, { id: 'd', number: 4, score: 0.5, points: 1 },
  ];
  const releases = [
    { id: 'r2', order: 2, capacity: 6, status: 'offen', used: 0 },
    { id: 'r1', order: 1, capacity: 8, status: 'offen', used: 2 },
    { id: 'r0', order: 0, capacity: 99, status: 'ausgeliefert', used: 0 },
  ];
  eq(Logic.suggestRoadmap(backlog, releases), [
    { requestId: 'b', releaseId: 'r1' }, { requestId: 'c', releaseId: 'r2' }, { requestId: 'd', releaseId: 'r1' },
  ]);
});
test('suggestRoadmap: ohne Punkte übersprungen, Gleichstand nach Nummer', () => {
  const backlog = [{ id: 'x', number: 5, score: 2, points: 2 }, { id: 'y', number: 3, score: 2, points: 2 }, { id: 'z', number: 1, score: 9, points: null }];
  eq(Logic.suggestRoadmap(backlog, [{ id: 'r', order: 1, capacity: 2, status: 'offen', used: 0 }]), [{ requestId: 'y', releaseId: 'r' }]);
});
test('suggestRoadmap verändert die Eingaben nicht', () => {
  const backlog = [{ id: 'a', number: 1, score: 1, points: 1 }, { id: 'b', number: 2, score: 2, points: 1 }];
  const releases = [{ id: 'r', order: 1, capacity: 5, status: 'offen', used: 1 }];
  Logic.suggestRoadmap(backlog, releases);
  eq(backlog.map(b => b.id), ['a', 'b']); eq(releases[0].used, 1); eq(releases[0].free, undefined);
});
test('suggestRoadmap ohne offene Releases', () => {
  eq(Logic.suggestRoadmap([{ id: 'a', number: 1, score: 1, points: 1 }], []), []);
});
test('releaseUsage', () => {
  eq(Logic.releaseUsage('r', [{ releaseId: 'r', points: 3 }, { releaseId: 'r', points: null }, { releaseId: 'q', points: 5 }]), 3);
});
test('nextNumber', () => { eq(Logic.nextNumber([]), 1); eq(Logic.nextNumber([{ number: 4 }, { number: 9 }, {}]), 10); });
test('countBy mit Mehrfachwerten, sortiert', () => {
  eq(Logic.countBy([{ s: ['A', 'B'] }, { s: ['B'] }, { s: [] }, { s: null }], x => x.s), [{ key: 'B', count: 2 }, { key: 'A', count: 1 }]);
});
test('leadTimeDays', () => {
  eq(Logic.leadTimeDays([{ status: 'eingereicht', at: '2026-10-01T00:00:00Z' }, { status: 'bewertung', at: '2026-10-02T00:00:00Z' }, { status: 'bewertet', at: '2026-10-11T12:00:00Z' }]), 10.5);
  eq(Logic.leadTimeDays([{ status: 'eingereicht', at: '2026-10-01T00:00:00Z' }]), null);
  eq(Logic.leadTimeDays(undefined), null);
});
test('average ignoriert fehlende Werte', () => { eq(Logic.average([2, null, 4]), 3); eq(Logic.average([null]), null); });
test('replacementPotential zählt pro Anforderung einmal', () => {
  eq(Logic.replacementPotential([
    { systems: { replaceable: [{ system: 'Excel' }, { system: 'Excel ' }] } },
    { systems: { replaceable: [{ system: 'Access' }, { system: 'Excel' }] } },
    {},
  ]), [{ key: 'Excel', count: 2 }, { key: 'Access', count: 1 }]);
});
test('toCsv: Semikolon, Anführungszeichen, BOM, Formelschutz', () => {
  const csv = Logic.toCsv([{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    [{ a: 'x;y', b: 'sagt "hallo"' }, { a: '=SUMME(1)', b: 3 }, { a: null, b: 'Zeile\nzwei' }]);
  eq(csv, '\uFEFFA;B\r\n"x;y";"sagt ""hallo"""\r\n\'=SUMME(1);3\r\n;"Zeile\nzwei"');
});
```

- [ ] **Step 2: Tests laufen lassen, die neuen müssen scheitern**

Run: `bash tests/run.sh`
Expected: 11 neue FAIL.

- [ ] **Step 3: Implementierung**

In `src/logic.js` vor `return {...}` einfügen:
```js
  // ---- Roadmap ----
  function suggestRoadmap(backlog, releases) {
    const open = releases.filter(r => r.status === 'offen').slice().sort((a, b) => a.order - b.order)
      .map(r => ({ id: r.id, free: r.capacity - (r.used || 0) }));
    const items = backlog.filter(b => Number.isFinite(b.points) && b.points >= 0).slice()
      .sort((a, b) => (b.score - a.score) || (a.number - b.number));
    const out = [];
    for (const it of items) {
      const rel = open.find(r => r.free >= it.points);
      if (rel) { rel.free -= it.points; out.push({ requestId: it.id, releaseId: rel.id }); }
    }
    return out;
  }
  function releaseUsage(releaseId, items) {
    return items.filter(i => i.releaseId === releaseId).reduce((sum, i) => sum + (Number.isFinite(i.points) ? i.points : 0), 0);
  }

  // ---- Kennzahlen ----
  function nextNumber(requests) { return requests.reduce((m, r) => Math.max(m, Number(r.number) || 0), 0) + 1; }
  function countBy(items, keyFn) {
    const m = new Map();
    for (const it of items) {
      for (const k of [].concat(keyFn(it) == null ? [] : keyFn(it))) {
        if (k == null || k === '') continue;
        m.set(k, (m.get(k) || 0) + 1);
      }
    }
    return [...m.entries()].map(([key, count]) => ({ key, count }))
      .sort((a, b) => (b.count - a.count) || String(a.key).localeCompare(String(b.key), 'de'));
  }
  function leadTimeDays(history) {
    const s = (history || []).find(x => x.status === 'eingereicht');
    const b = (history || []).find(x => x.status === 'bewertet');
    if (!s || !b) return null;
    return Math.max(0, (Date.parse(b.at) - Date.parse(s.at)) / 86400000);
  }
  function average(nums) {
    const v = nums.filter(Number.isFinite);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  function replacementPotential(requests) {
    return countBy(requests, r => [...new Set(((r.systems && r.systems.replaceable) || [])
      .map(x => String(x.system || '').trim()).filter(Boolean))]);
  }

  // ---- CSV ----
  function csvCell(v) {
    if (v === null || v === undefined) return '';
    let s = String(v);
    if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = "'" + s;
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(columns, rows) {
    const lines = [columns.map(c => csvCell(c.label)).join(';'), ...rows.map(r => columns.map(c => csvCell(r[c.key])).join(';'))];
    return '\uFEFF' + lines.join('\r\n');
  }
```
Rückgabe erweitern um `suggestRoadmap, releaseUsage, nextNumber, countBy, leadTimeDays, average, replacementPotential, toCsv`.

- [ ] **Step 4: Tests laufen lassen**

Run: `bash tests/run.sh`
Expected: `SUMMARY logic 38/38`.

- [ ] **Step 5: Commit**

```bash
git add src/logic.js tests/logic.test.js
git commit -m "feat: Roadmap-Vorschlag, Kennzahlen und CSV-Export" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Seitengerüst, UI-Helfer, Store, Navigation und Mock

**Files:**
- Create: `src/ui.js`, `src/store.js`, `src/main.js`, `tests/ui.test.js`, `tests/mock-claude.js`, `tests/shot.sh`
- Create (Platzhalter, werden in Task 7–11 ersetzt): `src/view-settings.js`, `src/view-submit.js`, `src/view-requests.js`, `src/view-analysis.js`, `src/view-roadmap.js`
- Replace: `src/page.html`
- Create: `tests/run.html`

**Interfaces:**
- Consumes: alles aus `Logic`.
- Produces:
  - `App.render()`: zeichnet die aktive Ansicht neu. `App.go(tab)` wechselt den Reiter. Reiter: `einreichen | anforderungen | auswertung | roadmap | einstellungen`.
  - `UI`:
    - `h(tag, attrs, ...children)`: Attribute; `on*` als Listener; `class`; `dataset`; `true` ergibt ein leeres Attribut; `null`/`false` werden ausgelassen; Kinder werden als Textknoten eingefügt
    - `toast(msg, kind?)`, `confirmDialog(message, {confirmLabel?, reasonLabel?}): Promise<{ok, reason?}>`
    - `fmtDate(iso)`, `fmtDateTime(iso)`, `fmtNum(n, digits?)`, `pill(status)`
    - `preserve(container, renderFn)`: leert den Container, zeichnet neu und stellt Werte von Feldern mit `data-dirty`, den Fokus und die Scrollposition wieder her
    - `clearDirty(...ids)`
    - `field(id, label, control, hint?)`, `showErrors(root, errors, keyToId)`
    - `select(id, options, value, {placeholder?, label?, onchange?})`
    - `nameMap(ids): Promise<{[id]: name}>`, `nameSpan(id)`
  - `Store`:
    - Zustand `state = {ready, db, user, downloads, me, isAdmin, canWrite, settings, loaded: {settings, requests, releases, ratings}, requests, releases, ratings, error}`
    - Laden und Abfragen: `init()`, `subscribe(fn)`, `settings()`, `isCommittee()`, `evaluation(r)`, `myRating(id)`, `canSeeResults(r)`, `points(r)`
    - Schreiben: `saveSettings(next)`, `createRequest(data): {id, number}|null`, `updateRequest(id, patch, okMsg?)`, `changeStatus(r, to, comment, extra?, okMsg?)`, `saveRating(r, rating)`
    - Kommentare: `watchComments(id, fn): unsubscribe`, `addComment(id, text)`
    - Releases und Export: `saveRelease({id?, name, order, capacity, status})`, `deleteRelease(id)`, `assign(r, releaseId|null)`, `deliverRelease(rel)`, `applySuggestion(pairs)`, `exportCsv()`
    - Alle Schreibfunktionen liefern bei einem Fehler `null` und zeigen selbst einen Fehler-Toast.
  - Jede Ansicht ist ein globales Objekt mit `render(root, state)`.

- [ ] **Step 1: Failing UI-Tests schreiben**

`tests/ui.test.js`:
```js
/* Tests für src/ui.js */
test('h fügt Benutzertext wörtlich ein', () => {
  const el = UI.h('p', {}, '<img src=x onerror="window.__xss=1"><b>fett</b>');
  eq(el.children.length, 0); eq(el.textContent, '<img src=x onerror="window.__xss=1"><b>fett</b>'); ok(!window.__xss);
});
test('h: Attribute, Listener, ausgelassene Werte', () => {
  let clicked = 0;
  const el = UI.h('button', { class: 'btn', disabled: true, title: null, hidden: false, onclick: () => clicked++, 'data-x': 0 }, 'A', null, ['B', false]);
  eq(el.className, 'btn'); ok(el.hasAttribute('disabled')); ok(!el.hasAttribute('title')); ok(!el.hasAttribute('hidden'));
  eq(el.getAttribute('data-x'), '0'); eq(el.textContent, 'AB'); el.disabled = false; el.click(); eq(clicked, 1);
});
test('preserve behält geänderte Eingaben und den Fokus', () => {
  const box = document.getElementById('sandbox');
  const draw = () => box.append(UI.h('input', { id: 't-a', value: 'alt' }), UI.h('input', { id: 't-b', value: 'fix' }));
  UI.preserve(box, draw);
  const a = document.getElementById('t-a'); a.value = 'neu getippt'; a.dispatchEvent(new Event('input', { bubbles: true })); a.focus();
  UI.preserve(box, draw);
  eq(document.getElementById('t-a').value, 'neu getippt'); eq(document.getElementById('t-b').value, 'fix');
  eq(document.activeElement.id, 't-a');
  UI.clearDirty('t-a'); UI.preserve(box, draw); eq(document.getElementById('t-a').value, 'alt');
  box.replaceChildren();
});
test('fmtNum und fmtDate', () => {
  eq(UI.fmtNum(NaN), '–'); eq(UI.fmtNum(null), '–'); ok(UI.fmtNum(1.234, 2).startsWith('1')); eq(UI.fmtDate(''), '–');
  eq(UI.fmtDate('2026-10-02T10:00:00Z'), '02.10.2026');
});
```

`tests/run.html` (nur UI-Tests; `run.sh` führt es automatisch aus, sobald die Datei existiert):
```html
<!doctype html>
<meta charset="utf-8">
<pre id="out">NOT RUN</pre>
<div id="sandbox"></div>
<script src="harness.js"></script>
<script src="../src/logic.js"></script>
<script src="../src/ui.js"></script>
<script src="ui.test.js"></script>
<script>report();</script>
```

- [ ] **Step 2: Tests laufen lassen, die UI-Tests müssen scheitern**

Run: `bash tests/run.sh`
Expected: 4 FAIL mit `UI is not defined`.

- [ ] **Step 3: `src/ui.js` schreiben**

```js
/* Gemeinsame Oberflächen-Helfer. */
const App = { render() {}, go() {} };

const UI = (() => {
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  let toastTimer;
  function toast(message, kind = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = message; t.dataset.kind = kind; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, kind === 'err' ? 7000 : 3500);
  }

  function confirmDialog(message, opts = {}) {
    const dlg = document.getElementById('confirm');
    const reasonWrap = document.getElementById('confirm-reason-wrap');
    const reason = document.getElementById('confirm-reason');
    const err = document.getElementById('confirm-err');
    const okBtn = document.getElementById('confirm-ok');
    document.getElementById('confirm-msg').textContent = message;
    document.getElementById('confirm-reason-label').textContent = opts.reasonLabel || '';
    okBtn.textContent = opts.confirmLabel || 'Bestätigen';
    reasonWrap.hidden = !opts.reasonLabel; reason.value = ''; err.hidden = true;
    return new Promise(resolve => {
      okBtn.onclick = e => {
        if (opts.reasonLabel && !reason.value.trim()) { e.preventDefault(); err.textContent = 'Bitte einen Text eingeben.'; err.hidden = false; reason.focus(); }
      };
      const onClose = () => {
        dlg.removeEventListener('close', onClose);
        resolve(dlg.returnValue === 'ok' ? { ok: true, reason: reason.value.trim() } : { ok: false });
      };
      dlg.addEventListener('close', onClose);
      dlg.returnValue = '';
      dlg.showModal();
      if (opts.reasonLabel) reason.focus();
    });
  }

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
  const fmtDateTime = iso => iso ? new Date(iso).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';
  function fmtNum(n, digits = 0) {
    return Number.isFinite(n) ? n.toLocaleString('de-CH', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '–';
  }
  const pill = status => h('span', { class: 'pill s-' + status }, Logic.STATUS_LABEL[status] || status);

  function markDirty(e) { if (e.target && e.target.id) e.target.dataset.dirty = '1'; }
  document.addEventListener('input', markDirty, true);
  document.addEventListener('change', markDirty, true);
  function clearDirty(...ids) { for (const id of ids) { const el = document.getElementById(id); if (el) delete el.dataset.dirty; } }

  function preserve(container, renderFn) {
    const saved = {};
    for (const el of container.querySelectorAll('[id][data-dirty]')) {
      saved[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? { checked: el.checked } : { value: el.value };
    }
    const active = document.activeElement;
    const focusId = active && container.contains(active) ? active.id : null;
    let sel = null;
    try { if (focusId && active.selectionStart != null) sel = [active.selectionStart, active.selectionEnd]; } catch (e) { sel = null; }
    const scroll = window.scrollY;
    container.replaceChildren();
    renderFn();
    for (const [id, v] of Object.entries(saved)) {
      const el = document.getElementById(id);
      if (!el || !container.contains(el)) continue;
      if ('checked' in v) el.checked = v.checked; else el.value = v.value;
      el.dataset.dirty = '1';
    }
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el && container.contains(el)) {
        el.focus({ preventScroll: true });
        if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* Feldtyp ohne Auswahl */ } }
      }
    }
    window.scrollTo(0, scroll);
  }

  function field(id, label, control, hint) {
    return h('div', { class: 'field' },
      h('label', { for: id }, label),
      hint ? h('p', { class: 'hint' }, hint) : null,
      control,
      h('p', { class: 'err', id: id + '-err', hidden: true }));
  }
  function showErrors(root, errors, keyToId) {
    root.querySelectorAll('p.err[id$="-err"]').forEach(p => { p.hidden = true; p.textContent = ''; });
    root.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    for (const [k, msg] of Object.entries(errors)) {
      const id = keyToId[k];
      const p = id && document.getElementById(id + '-err');
      if (p) { p.textContent = msg; p.hidden = false; }
      const el = id && document.getElementById(id);
      if (el) el.setAttribute('aria-invalid', 'true');
    }
  }
  function select(id, options, value, opts = {}) {
    const s = h('select', { id, 'aria-label': opts.label || null, onchange: opts.onchange || null });
    if (opts.placeholder != null) s.append(h('option', { value: '' }, opts.placeholder));
    for (const o of options) {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      s.append(h('option', { value: v, selected: String(v) === String(value == null ? '' : value) }, l));
    }
    return s;
  }

  async function nameMap(ids) {
    const user = typeof Store !== 'undefined' ? Store.state.user : null;
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!user || !uniq.length) return {};
    const ps = await user.profiles(uniq);
    const out = {};
    for (const id of uniq) out[id] = (ps[id] && ps[id].name) || 'Unbekannte Person';
    return out;
  }
  function nameSpan(id) {
    const s = h('span', { class: 'person' }, id ? '…' : 'Unbekannte Person');
    if (id) nameMap([id]).then(m => { s.textContent = m[id] || 'Unbekannte Person'; });
    return s;
  }

  return { h, toast, confirmDialog, fmtDate, fmtDateTime, fmtNum, pill, preserve, clearDirty, field, showErrors, select, nameMap, nameSpan };
})();
```

- [ ] **Step 4: UI-Tests laufen lassen**

Run: `bash tests/run.sh`
Expected: `SUMMARY logic 38/38` und `SUMMARY 4/4` (UI).

- [ ] **Step 5: `src/page.html` schreiben** (vollständig ersetzen)

```html
<title>CRM-Anforderungsportal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap">
<style>
/* Layout: Kopfzeile mit Reitern, darunter eine Arbeitsfläche aus Panels; Detail zweispaltig, schmal einspaltig. */
:root {
  --bg: #F3F6F9; --surface: #FFFFFF; --surface-2: #E8EEF4; --ink: #00335A; --muted: #4F6E8A; --line: #D2DCE6;
  --accent: #0B6CB8; --accent-ink: #FFFFFF; --focus: #E39B00;
  --ok: #1D7A4C; --warn: #9A5B00; --bad: #B3261E;
  --font: "Rubik", "Segoe UI", system-ui, -apple-system, sans-serif;
  --r: 6px;
  --step--1: 0.8125rem; --step-0: 0.9375rem; --step-1: 1.125rem; --step-2: 1.5rem;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0A1622; --surface: #102236; --surface-2: #17304A; --ink: #E2ECF6; --muted: #9AB3C9; --line: #25405C;
    --accent: #5BADF0; --accent-ink: #04121F; --focus: #F7C24A; --ok: #5CC28E; --warn: #E3A94B; --bad: #F08A80;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0A1622; --surface: #102236; --surface-2: #17304A; --ink: #E2ECF6; --muted: #9AB3C9; --line: #25405C;
  --accent: #5BADF0; --accent-ink: #04121F; --focus: #F7C24A; --ok: #5CC28E; --warn: #E3A94B; --bad: #F08A80;
  color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 400 var(--step-0)/1.5 var(--font); padding-inline: 16px; padding-block: 0 56px; }
.shell { max-width: 1180px; margin-inline: auto; }
header.top { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px 24px; padding-block: 24px 12px; }
h1 { font-size: var(--step-2); font-weight: 600; margin: 0; letter-spacing: -0.01em; text-wrap: balance; }
.sub { margin: 2px 0 0; color: var(--muted); }
.who { color: var(--muted); font-size: var(--step--1); }
.who strong { color: var(--ink); font-weight: 500; }
nav.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; position: sticky; top: env(safe-area-inset-top, 0px); background: var(--bg); z-index: 5; }
nav.tabs a { padding: 10px 14px; color: var(--muted); text-decoration: none; font-weight: 500; border-bottom: 3px solid transparent; white-space: nowrap; }
nav.tabs a:hover { color: var(--ink); }
nav.tabs a[aria-current="page"] { color: var(--ink); border-bottom-color: var(--accent); }
main { padding-block: 20px; }
.banner { margin: 16px 0 0; padding: 12px 14px; border-radius: var(--r); background: color-mix(in srgb, var(--warn) 12%, var(--surface)); border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent); }
.stack { display: grid; gap: 16px; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 20px; min-width: 0; }
.panel.narrow { max-width: 780px; }
.panel h2 { font-size: var(--step-1); font-weight: 600; margin: 0 0 12px; text-wrap: balance; }
h3 { font-size: var(--step-0); font-weight: 600; margin: 0 0 8px; }
.eyebrow { font-size: var(--step--1); text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 500; margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.row.end { justify-content: flex-end; }
.spread { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.spread h2 { margin: 0; font-size: var(--step-1); }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 16px; }
.grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 12px; align-items: start; }
.field { display: grid; gap: 4px; min-width: 0; }
.field > label, .lbl { font-weight: 500; }
.hint { margin: 0; color: var(--muted); font-size: var(--step--1); max-width: 68ch; }
.err { margin: 0; color: var(--bad); font-size: var(--step--1); }
input[type="text"], input[type="search"], input[type="date"], select, textarea {
  font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 4px; padding: 8px 10px; width: 100%; min-width: 0;
}
textarea { resize: vertical; min-height: 4.5em; }
[aria-invalid="true"] { border-color: var(--bad) !important; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.checks { display: flex; flex-wrap: wrap; gap: 6px 18px; }
.checks label { display: flex; gap: 6px; align-items: center; }
fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 16px; min-width: 0; }
legend { font-size: var(--step-1); font-weight: 600; padding: 0; margin-bottom: 4px; }
.btn { font: inherit; font-weight: 500; border: 1px solid var(--accent); background: var(--accent); color: var(--accent-ink); border-radius: 4px; padding: 8px 14px; cursor: pointer; }
.btn.ghost { background: transparent; color: var(--accent); }
.btn.danger { background: transparent; border-color: var(--bad); color: var(--bad); }
.btn.small { padding: 4px 10px; font-size: var(--step--1); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.linkbtn { font: inherit; background: none; border: 0; color: var(--accent); padding: 0; cursor: pointer; text-align: left; }
.note { color: var(--muted); margin: 0; }
.empty { color: var(--muted); padding-block: 24px; margin: 0; }
.form-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: flex-end; margin-bottom: 16px; }
.form-head h2 { margin: 0; }
.quality { display: grid; gap: 4px; min-width: 200px; font-size: var(--step--1); color: var(--muted); font-variant-numeric: tabular-nums; }
.meter { height: 6px; background: var(--surface-2); border-radius: 3px; overflow: hidden; }
.meter span { display: block; height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.2s; }
.stepper { display: flex; flex-wrap: wrap; gap: 4px; list-style: none; padding: 0; margin: 0 0 20px; }
.stepper li { flex: 1 1 140px; }
.stepper button { width: 100%; text-align: left; font: inherit; font-size: var(--step--1); background: none; border: 0; border-top: 3px solid var(--line); padding: 8px 0 0; color: var(--muted); cursor: pointer; }
.stepper button[aria-current="step"] { border-top-color: var(--accent); color: var(--ink); font-weight: 500; }
.stepper .n { font-variant-numeric: tabular-nums; margin-right: 6px; }
.formnav { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-top: 20px; }
.reprow { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 8px; }
@media (max-width: 560px) { .reprow { grid-template-columns: minmax(0, 1fr); } }
.tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); }
table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
th, td { padding: 9px 12px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: var(--step--1); font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }
tr.click { cursor: pointer; }
tr.click:hover td, tr.click:focus-visible td { background: var(--surface-2); }
th.num, td.num { text-align: right; }
.filters { display: grid; grid-template-columns: minmax(0, 2fr) repeat(4, minmax(0, 1fr)) auto; gap: 8px; align-items: center; margin-bottom: 12px; }
@media (max-width: 900px) { .filters { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.pill { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: var(--step--1); font-weight: 500; white-space: nowrap; color: var(--c); background: color-mix(in srgb, var(--c) 13%, transparent); border: 1px solid color-mix(in srgb, var(--c) 35%, transparent); }
.s-eingereicht, .s-zurueckgestellt { --c: var(--muted); }
.s-klaerung { --c: var(--warn); }
.s-bewertung, .s-bewertet { --c: var(--accent); }
.s-eingeplant, .s-umgesetzt { --c: var(--ok); }
.s-abgelehnt { --c: var(--bad); }
.chip { display: inline-block; font-size: var(--step--1); padding: 1px 8px; border-radius: 4px; background: var(--surface-2); color: var(--ink); }
.detail { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 16px; align-items: start; }
@media (max-width: 920px) { .detail { grid-template-columns: minmax(0, 1fr); } }
.detail-head { display: grid; gap: 6px; margin-bottom: 16px; }
.detail-head h2 { font-size: var(--step-2); margin: 0; font-weight: 600; text-wrap: balance; }
.meta { color: var(--muted); font-size: var(--step--1); margin: 0; }
.prose p { margin: 0 0 10px; white-space: pre-wrap; max-width: 68ch; overflow-wrap: anywhere; }
.prose ul { margin: 0 0 10px; padding-left: 1.2em; }
dl.kv { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; margin: 0; }
dl.kv dt { color: var(--muted); }
dl.kv dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
.history { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.history li { display: grid; gap: 2px; font-size: var(--step--1); }
.posts { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 10px; }
.posts li { background: var(--surface-2); border-radius: var(--r); padding: 10px 12px; overflow-wrap: anywhere; }
.posts .body { margin: 4px 0 0; white-space: pre-wrap; }
.ratinggrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: 12px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: 12px; }
.kpi { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 14px 16px; }
.kpi .v { font-size: var(--step-2); font-weight: 600; font-variant-numeric: tabular-nums; }
.kpi .l { color: var(--muted); font-size: var(--step--1); }
.chart { width: 100%; height: auto; display: block; max-width: 760px; }
.chart .grid { stroke: var(--line); stroke-width: 1; }
.chart .divider { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 4; }
.chart text { fill: var(--muted); font: 400 12px var(--font); }
.chart .qlabel { fill: var(--muted); font-weight: 500; letter-spacing: 0.05em; }
.chart .pt { cursor: pointer; outline: none; }
.chart .pt circle { fill: var(--accent); stroke: var(--surface); stroke-width: 2; }
.chart .pt .hit { fill: transparent; stroke: none; }
.chart .pt:hover circle:not(.hit), .chart .pt:focus-visible circle:not(.hit) { stroke: var(--ink); }
.chart .pt text { fill: var(--ink); font-weight: 500; }
.bars { display: grid; gap: 8px; list-style: none; margin: 0; padding: 0; }
.bars li { display: grid; grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) 2.5rem; gap: 10px; align-items: center; font-size: var(--step--1); }
.bars .name { overflow-wrap: anywhere; }
.bars .track { display: block; height: 10px; }
.bars .fill { display: block; height: 100%; background: var(--accent); border-radius: 0 4px 4px 0; min-width: 2px; }
.bars .val { text-align: right; font-variant-numeric: tabular-nums; color: var(--ink); }
.board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(260px, 1fr); gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.col { background: var(--surface-2); border-radius: var(--r); padding: 12px; display: grid; gap: 8px; align-content: start; min-height: 220px; }
.col.over { outline: 2px dashed var(--accent); outline-offset: -2px; }
.col-head { display: grid; gap: 6px; margin-bottom: 4px; }
.col-head h3 { margin: 0; display: flex; justify-content: space-between; gap: 8px; }
.load { font-size: var(--step--1); color: var(--muted); font-variant-numeric: tabular-nums; }
.load.overbooked { color: var(--bad); font-weight: 500; }
.meter.over span { background: var(--bad); }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 10px 12px; display: grid; gap: 6px; }
.card[draggable="true"] { cursor: grab; }
.card .t { font-weight: 500; }
.card .m { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: var(--step--1); color: var(--muted); font-variant-numeric: tabular-nums; }
.card select { padding: 4px 8px; font-size: var(--step--1); }
.proposal { border-color: var(--accent); margin-bottom: 12px; }
.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); background: var(--ink); color: var(--bg); padding: 10px 16px; border-radius: var(--r); max-width: min(92vw, 520px); z-index: 20; box-shadow: 0 6px 24px rgb(0 0 0 / 0.18); }
.toast[data-kind="err"] { background: var(--bad); color: var(--surface); }
dialog { border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); color: var(--ink); padding: 20px; width: min(92vw, 480px); }
dialog::backdrop { background: rgb(0 20 40 / 0.45); }
.dlg { display: grid; gap: 12px; }
.dlg p { margin: 0; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
</style>
<div class="shell">
  <header class="top">
    <div>
      <h1>CRM-Anforderungsportal</h1>
      <p class="sub">Anforderungen an das CRM einreichen, bewerten und in Releases einplanen</p>
    </div>
    <div id="who" class="who"></div>
  </header>
  <nav class="tabs" id="tabs" aria-label="Bereiche">
    <a href="#einreichen" data-tab="einreichen">Einreichen</a>
    <a href="#anforderungen" data-tab="anforderungen">Anforderungen</a>
    <a href="#auswertung" data-tab="auswertung">Auswertung</a>
    <a href="#roadmap" data-tab="roadmap">Roadmap</a>
    <a href="#einstellungen" data-tab="einstellungen" id="tab-settings" hidden>Einstellungen</a>
  </nav>
  <div id="banner" class="banner" role="status" hidden></div>
  <main id="view"><p class="empty">Portal wird geladen …</p></main>
</div>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<dialog id="confirm">
  <form method="dialog" class="dlg">
    <p id="confirm-msg"></p>
    <div id="confirm-reason-wrap" class="field" hidden>
      <label id="confirm-reason-label" for="confirm-reason"></label>
      <textarea id="confirm-reason" rows="3"></textarea>
    </div>
    <p id="confirm-err" class="err" hidden></p>
    <div class="row end">
      <button value="cancel" class="btn ghost">Abbrechen</button>
      <button value="ok" id="confirm-ok" class="btn">Bestätigen</button>
    </div>
  </form>
</dialog>
<!-- SCRIPTS -->
```

- [ ] **Step 6: `src/store.js` schreiben**

```js
/* Zugriff auf Datenbank, Benutzer und Downloads; hält den gemeinsamen Zustand. */
const Store = (() => {
  const DEFAULT_SETTINGS = {
    committee: [], weights: { nutzen: 1, betroffene: 1, dringlichkeit: 1, fit: 1 },
    minRatings: 3, weeksPerYear: 46, departments: [], crmAreas: [], systems: [],
  };
  const state = {
    ready: false, db: null, user: null, downloads: null, me: { id: null, name: '' }, isAdmin: false, canWrite: null,
    settings: null, loaded: { settings: false, requests: false, releases: false, ratings: false },
    requests: [], releases: [], ratings: {}, error: null,
  };
  const listeners = new Set();
  let queued = false;
  function emit() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; listeners.forEach(fn => fn(state)); });
  }
  const subscribe = fn => { listeners.add(fn); };

  function errorText(e) {
    switch (e && e.code) {
      case 'invalid_argument': return 'Speichern nicht möglich. Prüfen Sie, ob Sie die Freigabe «Contributor» haben, und versuchen Sie es erneut.';
      case 'quota_exceeded': return 'Der Speicher des Portals ist voll. Bitte die Administration informieren.';
      case 'resource_exhausted': return 'Zu viele Anfragen in kurzer Zeit. Bitte einen Moment warten und erneut versuchen.';
      case 'revoked': return 'Der Zugriff auf das Portal wurde entzogen. Bitte die Seite neu laden.';
      case 'not_granted': case 'capability_disabled': case 'capability_removed':
        return 'Die Datenbank ist in dieser Ansicht nicht verfügbar. Bitte das Portal angemeldet in claude.ai öffnen.';
      default: return 'Die Verbindung zur Datenbank ist gestört. Bitte später erneut versuchen.';
    }
  }
  function onError(e) { state.error = errorText(e); emit(); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const now = () => new Date().toISOString();

  async function init() {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') {
      state.error = 'Diese Seite funktioniert nur in claude.ai. Bitte den Link zum Portal dort öffnen.';
      state.ready = true; emit(); return;
    }
    const [db, user, downloads] = await Promise.all([c.use('db'), c.use('user'), c.use('downloads')]);
    Object.assign(state, { db, user, downloads });
    if (user) {
      state.me = await user.me();
      state.isAdmin = await user.canEdit();
      state.canWrite = await user.can('data.write');
    }
    if (!db) {
      state.error = 'Die Datenbank des Portals ist in dieser Ansicht nicht verfügbar. Bitte angemeldet in claude.ai öffnen.';
      state.ready = true; emit(); return;
    }
    db.doc('config/settings').onSnapshot(s => {
      state.settings = s.exists ? { ...DEFAULT_SETTINGS, ...s.data() } : null;
      state.loaded.settings = true; emit();
    }, onError);
    db.collection('requests').onSnapshot(s => {
      state.requests = s.docs.map(d => ({ ...d.data(), id: d.id }));
      state.loaded.requests = true; emit();
    }, onError);
    db.collection('releases').onSnapshot(s => {
      state.releases = s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (a.order || 0) - (b.order || 0));
      state.loaded.releases = true; emit();
    }, onError);
    db.collection('ratings').onSnapshot(s => {
      const r = {};
      for (const d of s.docs) r[d.id] = d.data();
      state.ratings = r; state.loaded.ratings = true; emit();
    }, onError);
    state.ready = true; emit();
  }

  const settings = () => state.settings || DEFAULT_SETTINGS;
  const isCommittee = () => !!state.me.id && settings().committee.includes(state.me.id);
  const evaluation = r => Logic.evaluate(r.id, state.ratings, settings());
  const myRating = requestId => {
    const mine = state.me.id && state.ratings[state.me.id];
    return (mine && mine.byRequest && mine.byRequest[requestId]) || null;
  };
  const canSeeResults = r => state.isAdmin || Logic.RESULTS_VISIBLE.includes(r.status) || !!myRating(r.id);
  const points = r => Logic.effortPoints(r, evaluation(r));

  // Führt einen Schreibvorgang aus; bei «unavailable» genau ein zweiter Versuch. Fehler → Toast und null.
  async function write(fn, okMsg) {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fn();
        if (okMsg) UI.toast(okMsg);
        return res === undefined ? true : res;
      } catch (e) {
        if (e && e.code === 'unavailable' && attempt === 0) { await sleep(300 + Math.random() * 700); continue; }
        UI.toast(e && e.message && !e.code ? e.message : errorText(e), 'err');
        return null;
      }
    }
  }

  const saveSettings = next => write(() => state.db.doc('config/settings').set(next), 'Einstellungen gespeichert.');

  function createRequest(data) {
    return write(async () => {
      const ref = state.db.collection('requests').doc();
      const at = now();
      const number = Logic.nextNumber(state.requests);
      await ref.set({
        ...data, number, status: 'eingereicht',
        statusHistory: [{ status: 'eingereicht', at, by: state.me.id, comment: '' }],
        submittedBy: state.me.id, submittedAt: at, updatedAt: at, releaseId: null, effortOverride: null, decisionReason: null,
      });
      return { id: ref.id, number };
    });
  }
  const updateRequest = (id, patch, okMsg) => write(() => state.db.doc('requests/' + id).update({ ...patch, updatedAt: now() }), okMsg);
  function changeStatus(r, to, comment, extra = {}, okMsg) {
    let patch;
    try { patch = Logic.withStatus(r, to, state.me.id, now(), comment); }
    catch (e) { UI.toast(e.message, 'err'); return Promise.resolve(null); }
    return updateRequest(r.id, { ...patch, ...extra }, okMsg);
  }

  async function saveRating(r, rating) {
    const ref = state.db.doc('ratings/' + state.me.id);
    const exists = !!state.ratings[state.me.id];
    const entry = { ...rating, updatedAt: now() };
    const ok = await write(() => exists ? ref.update({ byRequest: { [r.id]: entry } }) : ref.set({ byRequest: { [r.id]: entry } }), 'Bewertung gespeichert.');
    if (ok == null) return null;
    const mine = (state.ratings[state.me.id] && state.ratings[state.me.id].byRequest) || {};
    const docs = { ...state.ratings, [state.me.id]: { byRequest: { ...mine, [r.id]: entry } } };
    const ev = Logic.evaluate(r.id, docs, settings());
    if (Logic.shouldMarkRated(r.status, ev.count, settings().minRatings)) {
      await changeStatus(r, 'bewertet', `Mindestanzahl von ${settings().minRatings} Bewertungen erreicht`);
    }
    return ok;
  }

  function watchComments(requestId, fn) {
    return state.db.collection('requests/' + requestId + '/comments').orderBy('at')
      .onSnapshot(s => fn(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
  }
  const addComment = (requestId, text) =>
    write(() => state.db.collection('requests/' + requestId + '/comments').add({ by: state.me.id, at: now(), text }));

  function saveRelease(rel) {
    const { id, ...data } = rel;
    return write(() => (id ? state.db.doc('releases/' + id) : state.db.collection('releases').doc()).set(data), 'Release gespeichert.');
  }
  const deleteRelease = id => write(() => state.db.doc('releases/' + id).delete(), 'Release gelöscht.');
  function assign(r, releaseId) {
    if (releaseId) {
      if (r.status === 'eingeplant') return updateRequest(r.id, { releaseId });
      return changeStatus(r, 'eingeplant', '', { releaseId });
    }
    return changeStatus(r, 'bewertet', 'Zurück in den Backlog');
  }
  async function deliverRelease(rel) {
    const ok = await write(() => state.db.doc('releases/' + rel.id).update({ status: 'ausgeliefert' }));
    if (ok == null) return null;
    for (const r of state.requests.filter(x => x.releaseId === rel.id && x.status === 'eingeplant')) {
      await changeStatus(r, 'umgesetzt', `Release ${rel.name} ausgeliefert`);
    }
    UI.toast(`Release ${rel.name} ist als ausgeliefert markiert.`);
    return true;
  }
  async function applySuggestion(pairs) {
    let n = 0;
    for (const p of pairs) {
      const r = state.requests.find(x => x.id === p.requestId);
      if (r && (await assign(r, p.releaseId)) != null) n++;
    }
    UI.toast(`${n} Anforderungen eingeplant.`);
  }

  async function exportCsv() {
    if (!state.downloads) { UI.toast('Der Download ist in dieser Ansicht nicht verfügbar.', 'err'); return; }
    const s = settings();
    const names = await UI.nameMap([...state.requests.map(r => r.submittedBy), ...Object.keys(state.ratings)]);
    const relName = Object.fromEntries(state.releases.map(r => [r.id, r.name]));
    const fix = n => Number.isFinite(n) ? n.toFixed(2) : '';
    const rows = state.requests.slice().sort((a, b) => a.number - b.number).map(r => {
      const ev = evaluation(r), p = r.pain || {}, g = r.gain || {}, sy = r.systems || {};
      return {
        number: r.number, title: r.title, status: Logic.STATUS_LABEL[r.status], department: r.department, crmArea: r.crmArea,
        useCase: r.useCase, situation: p.situation, frequency: p.frequency, hours: p.hoursPerWeek, persons: p.persons,
        consequences: (p.consequences || []).join(', '), gainDepartment: g.department, gainCompany: g.company,
        success: g.successCriterion, deadline: g.deadline, deadlineReason: g.deadlineReason,
        affected: (sy.affected || []).join(', '),
        replaceable: (sy.replaceable || []).map(x => x.purpose ? `${x.system} (${x.purpose})` : x.system).join(', '),
        links: (r.links || []).join(' '), savings: Logic.savingsHoursPerYear(p, s.weeksPerYear), ratings: ev.count,
        benefit: fix(ev.benefit), effort: fix(ev.effort), score: fix(ev.score),
        quadrant: ev.quadrant ? Logic.QUADRANT_LABEL[ev.quadrant] : '', points: points(r), release: relName[r.releaseId] || '',
        submittedBy: names[r.submittedBy] || '', submittedAt: r.submittedAt, decisionReason: r.decisionReason,
      };
    });
    const cols = [
      ['number', 'Nr.'], ['title', 'Titel'], ['status', 'Status'], ['department', 'Abteilung'], ['crmArea', 'CRM-Bereich'],
      ['useCase', 'Use Case'], ['situation', 'Heutige Situation'], ['frequency', 'Häufigkeit'], ['hours', 'h pro Woche und Person'],
      ['persons', 'Betroffene Personen'], ['consequences', 'Folgen'], ['gainDepartment', 'Nutzen Abteilung'],
      ['gainCompany', 'Nutzen Unternehmen'], ['success', 'Erfolgskriterium'], ['deadline', 'Frist'], ['deadlineReason', 'Grund Frist'],
      ['affected', 'Betroffene Systeme'], ['replaceable', 'Ablösbare Systeme'], ['links', 'Links'], ['savings', 'Einsparpotenzial h/Jahr'],
      ['ratings', 'Anzahl Bewertungen'], ['benefit', 'Nutzen-Index'], ['effort', 'Ø Aufwand'], ['score', 'Score'], ['quadrant', 'Einordnung'],
      ['points', 'Aufwandspunkte'], ['release', 'Release'], ['submittedBy', 'Eingereicht von'], ['submittedAt', 'Eingereicht am'],
      ['decisionReason', 'Begründung'],
    ].map(([key, label]) => ({ key, label }));
    const byId = Object.fromEntries(state.requests.map(r => [r.id, r]));
    const rrows = [];
    for (const [uid, doc] of Object.entries(state.ratings)) {
      for (const [rid, rt] of Object.entries((doc && doc.byRequest) || {})) {
        const r = byId[rid];
        if (!r) continue;
        rrows.push({
          number: r.number, title: r.title, person: names[uid] || '', committee: s.committee.includes(uid) ? 'ja' : 'nein',
          nutzen: rt.nutzen, betroffene: rt.betroffene, dringlichkeit: rt.dringlichkeit, fit: rt.fit, aufwand: rt.aufwand,
          comment: rt.comment, updatedAt: rt.updatedAt,
        });
      }
    }
    rrows.sort((a, b) => a.number - b.number);
    const rcols = [['number', 'Nr.'], ['title', 'Titel'], ['person', 'Person'], ['committee', 'Im Gremium'],
      ...Logic.CRITERIA.map(k => [k, Logic.CRITERIA_LABEL[k]]), ['comment', 'Kommentar'], ['updatedAt', 'Geändert am']]
      .map(([key, label]) => ({ key, label }));
    const date = new Date().toISOString().slice(0, 10);
    for (const [filename, data] of [[`anforderungen-${date}.csv`, Logic.toCsv(cols, rows)], [`bewertungen-${date}.csv`, Logic.toCsv(rcols, rrows)]]) {
      try { await state.downloads.save({ filename, data }); }
      catch (e) {
        if (!e || e.code !== 'declined') UI.toast('Der Export konnte nicht gespeichert werden. Bitte erneut versuchen.', 'err');
        return;
      }
    }
  }

  return {
    DEFAULT_SETTINGS, state, init, subscribe, settings, isCommittee, evaluation, myRating, canSeeResults, points,
    saveSettings, createRequest, updateRequest, changeStatus, saveRating, watchComments, addComment,
    saveRelease, deleteRelease, assign, deliverRelease, applySuggestion, exportCsv,
  };
})();
```

- [ ] **Step 7: Platzhalter für die Ansichten und `src/main.js` schreiben**

Jede der fünf Dateien erhält einen Platzhalter, der in den folgenden Tasks vollständig ersetzt wird. Zum Beispiel `src/view-settings.js`:
```js
/* Ansicht «Einstellungen» – wird in Task 7 umgesetzt. */
const SettingsView = { render(root) { root.append(UI.h('p', { class: 'empty' }, 'Einstellungen folgen.')); } };
```
Analog dazu:
- `src/view-submit.js` mit `const SubmitView = { render(root) {...}, edit() {} };`
- `src/view-requests.js` mit `const RequestsView = { render(root) {...}, select() {} };`
- `src/view-analysis.js` mit `const AnalysisView = { render(root) {...} };`
- `src/view-roadmap.js` mit `const RoadmapView = { render(root) {...} };`

Jeweils mit dem Text «… folgen.».

`src/main.js`:
```js
/* Navigation, Kopfzeile, Hinweise und Start. */
(() => {
  const VIEWS = { einreichen: SubmitView, anforderungen: RequestsView, auswertung: AnalysisView, roadmap: RoadmapView, einstellungen: SettingsView };
  const view = document.getElementById('view');
  let tab = 'einreichen';

  function fromHash() {
    let raw = '';
    try { raw = decodeURIComponent((location.hash || '').slice(1)); } catch (e) { raw = ''; }
    if (raw.startsWith('r-')) { RequestsView.select(raw.slice(2)); return 'anforderungen'; }
    return VIEWS[raw] ? raw : 'einreichen';
  }
  function go(t) {
    tab = VIEWS[t] ? t : 'einreichen';
    try { history.replaceState(null, '', '#' + tab); } catch (e) { /* Rahmen erlaubt keine Hash-Änderung */ }
    window.scrollTo(0, 0);
    render();
  }
  function renderWho(s) {
    const el = document.getElementById('who');
    if (!s.me.id) { el.replaceChildren(); return; }
    const roles = [s.isAdmin && 'Administration', Store.isCommittee() && 'Gremium'].filter(Boolean).join(' · ') || 'Einreichende';
    el.replaceChildren(UI.h('strong', {}, s.me.name || 'Angemeldet'), ' · ' + roles);
  }
  function renderBanner(s) {
    const el = document.getElementById('banner');
    let msg = null;
    if (s.error) msg = s.error;
    else if (s.ready && s.db && s.loaded.settings && !s.settings) {
      msg = s.isAdmin
        ? 'Das Portal ist noch nicht eingerichtet. Bitte unter «Einstellungen» die Wertelisten prüfen und speichern.'
        : 'Das Portal wird gerade eingerichtet. Einreichen ist möglich, sobald die Administration die Einrichtung abgeschlossen hat.';
    } else if (s.ready && s.canWrite === false) {
      msg = 'Sie haben Lesezugriff. Zum Einreichen und Bewerten braucht es die Freigabe «Contributor». Bitte bei der Administration melden.';
    }
    el.hidden = !msg; el.textContent = msg || '';
  }
  function render() {
    const s = Store.state;
    if (tab === 'einstellungen' && s.ready && !s.isAdmin) tab = 'anforderungen';
    document.getElementById('tab-settings').hidden = !s.isAdmin;
    for (const a of document.querySelectorAll('#tabs a')) {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    renderWho(s); renderBanner(s);
    if (!s.ready) return;
    UI.preserve(view, () => VIEWS[tab].render(view, s));
  }

  document.getElementById('tabs').addEventListener('click', e => {
    const a = e.target.closest('a[data-tab]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.tab === 'anforderungen') RequestsView.select(null);
    go(a.dataset.tab);
  });
  App.render = render; App.go = go;
  tab = fromHash();
  Store.subscribe(render);
  render();
  Store.init();
})();
```

- [ ] **Step 8: Mock und Screenshot-Skript schreiben**

`tests/mock-claude.js`:
```js
/* Nur für lokale Sichtprüfungen: simuliert window.claude (db, user, downloads) im Speicher.
   URL-Parameter: ?seed=1 lädt TESTDATEN, ?role=admin|gremium|business|viewer|anonym */
(() => {
  const docs = new Map();
  const subs = new Set();
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const segs = p => p.split('/').length;
  const meta = { fromCache: false, hasPendingWrites: false };
  const snapDoc = path => { const d = docs.get(path); return { id: path.split('/').pop(), exists: d !== undefined, data: () => clone(d), metadata: meta }; };
  function runQuery(q) {
    let list = [...docs.keys()].filter(p => p.startsWith(q.path + '/') && segs(p) === segs(q.path) + 1).map(snapDoc);
    for (const [f, op, v] of q.wheres) {
      list = list.filter(d => { const x = d.data()[f];
        return op === '==' ? x === v : op === '!=' ? x !== v : op === '<' ? x < v : op === '<=' ? x <= v : op === '>' ? x > v
          : op === '>=' ? x >= v : op === 'in' ? v.includes(x) : op === 'array-contains' ? Array.isArray(x) && x.includes(v) : true; });
    }
    if (q.order) { const [f, dir] = q.order; list.sort((a, b) => { const x = a.data()[f], y = b.data()[f]; const c = x < y ? -1 : x > y ? 1 : 0; return dir === 'desc' ? -c : c; }); }
    else list.sort((a, b) => (a.id < b.id ? -1 : 1));
    if (q.lim) list = list.slice(0, q.lim);
    return { docs: list, size: list.length, empty: !list.length, docChanges: () => [], metadata: meta };
  }
  const deliver = s => s.fn(s.kind === 'doc' ? snapDoc(s.path) : runQuery(s.q));
  function notify() { for (const s of subs) setTimeout(() => deliver(s), 0); }
  function merge(a, b) {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) {
      out[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v;
    }
    return out;
  }
  let n = 0;
  const newId = () => 'm' + Date.now().toString(36) + (n++);
  const role = new URLSearchParams(location.search).get('role') || 'admin';
  const readOnly = role === 'viewer';
  const deny = () => { throw { code: 'invalid_argument', message: 'Nur Lesezugriff (Mock)' }; };
  function docRef(path) {
    return {
      id: path.split('/').pop(), path,
      get: async () => snapDoc(path),
      set: async d => { if (readOnly) deny(); docs.set(path, clone(d)); notify(); },
      update: async d => { if (readOnly) deny(); if (!docs.has(path)) throw { code: 'invalid_argument', message: 'Dokument fehlt' }; docs.set(path, merge(docs.get(path), clone(d))); notify(); },
      delete: async () => { if (readOnly) deny(); docs.delete(path); notify(); },
      onSnapshot: fn => { const s = { kind: 'doc', path, fn }; subs.add(s); setTimeout(() => deliver(s), 0); return () => subs.delete(s); },
      collection: p => colRef(path + '/' + p),
    };
  }
  function query(q) {
    return {
      where: (f, op, v) => query({ ...q, wheres: [...q.wheres, [f, op, v]] }),
      orderBy: (f, dir = 'asc') => query({ ...q, order: [f, dir] }),
      limit: k => query({ ...q, lim: k }),
      get: async () => runQuery(q),
      onSnapshot: fn => { const s = { kind: 'col', q, fn }; subs.add(s); setTimeout(() => deliver(s), 0); return () => subs.delete(s); },
    };
  }
  function colRef(path) {
    return { ...query({ path, wheres: [], order: null, lim: 0 }), path,
      doc: id => docRef(path + '/' + (id || newId())),
      add: async d => { const r = docRef(path + '/' + newId()); await r.set(d); return r; } };
  }
  const PEOPLE = { u_admin: 'Test Administration', u_gremium: 'Test Gremium', u_business: 'Test Business', u_viewer: 'Test Lesend' };
  const prof = id => ({ id, name: PEOPLE[id] || '', avatarUrl: '', color: '#0B6CB8', email: null, isMe: id === 'u_' + role, guest: false });
  const me = role === 'anonym'
    ? { id: null, name: '', avatarUrl: '', color: '#888', email: null, isOwner: false, canEdit: false }
    : { ...prof('u_' + role), isOwner: role === 'admin', canEdit: role === 'admin' };
  const user = {
    isOwner: async () => me.isOwner, canEdit: async () => me.canEdit, can: async () => !readOnly && role !== 'anonym',
    me: async () => me, id: async () => me.id, name: async () => me.name,
    profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, prof(id)])),
    search: async q => Object.keys(PEOPLE).map(prof).filter(p => p.name.toLowerCase().includes(String(q).toLowerCase())),
  };
  const downloads = { save: async ({ filename, data }) => { console.log('DOWNLOAD', filename, String(data).slice(0, 300)); return { status: 'saved' }; } };
  window.claude = { use: async name => ({ db: { doc: docRef, collection: colRef }, user, downloads })[name] || null };

  if (new URLSearchParams(location.search).has('seed')) {
    const t = d => new Date(Date.UTC(2026, 8, d, 9)).toISOString();
    const hist = (...steps) => steps.map(([status, d, by]) => ({ status, at: t(d), by, comment: '' }));
    docs.set('config/settings', { committee: ['u_admin', 'u_gremium'], weights: { nutzen: 1, betroffene: 1, dringlichkeit: 1, fit: 1 },
      minRatings: 2, weeksPerYear: 46, departments: ['Verkauf', 'Kundendienst', 'Marketing'],
      crmAreas: ['Kontakte und Firmen', 'Verträge', 'Kampagnen', 'Reporting'], systems: ['Excel', 'Outlook', 'Access-Datenbank Anlässe'] });
    docs.set('releases/r1', { name: '2027.1', order: 1, capacity: 6, status: 'offen' });
    docs.set('releases/r2', { name: '2027.2', order: 2, capacity: 6, status: 'offen' });
    const base = (num, title, dept, area, status, history, extra = {}) => ({
      number: num, title, department: dept, crmArea: area, useCase: '',
      pain: { situation: 'TESTDATEN: Beschreibung der heutigen Situation mit genügend Text, damit die Mindestlänge von achtzig Zeichen erreicht ist.', frequency: 'wöchentlich', hoursPerWeek: 2, persons: 5, consequences: ['Doppelerfassung'] },
      gain: { department: 'TESTDATEN: Nutzen für die Abteilung mit ausreichend Text für die Mindestlänge.', company: '', successCriterion: 'TESTDATEN: messbares Kriterium', deadline: null, deadlineReason: '' },
      systems: { affected: ['Excel'], replaceable: [{ system: 'Excel', purpose: 'Liste' }] }, links: [],
      status, statusHistory: history, submittedBy: 'u_business', submittedAt: history[0].at, updatedAt: history[history.length - 1].at,
      releaseId: null, effortOverride: null, decisionReason: null, ...extra });
    docs.set('requests/q1', base(1, 'Test: Offerten aus dem CRM erstellen', 'Verkauf', 'Verträge', 'bewertet', hist(['eingereicht', 1, 'u_business'], ['bewertung', 2, 'u_admin'], ['bewertet', 6, 'u_gremium'])));
    docs.set('requests/q2', base(2, 'Test: Kampagnenantworten automatisch erfassen', 'Marketing', 'Kampagnen', 'eingeplant', hist(['eingereicht', 3, 'u_business'], ['bewertung', 4, 'u_admin'], ['bewertet', 9, 'u_gremium'], ['eingeplant', 10, 'u_admin']), { releaseId: 'r1' }));
    docs.set('requests/q3', base(3, 'Test: Reklamationen dem Vertrag zuordnen', 'Kundendienst', 'Kontakte und Firmen', 'bewertung', hist(['eingereicht', 12, 'u_business'], ['bewertung', 13, 'u_admin'])));
    docs.set('requests/q4', base(4, 'Test: Monatsreport ohne Excel', 'Verkauf', 'Reporting', 'eingereicht', hist(['eingereicht', 20, 'u_business'])));
    const RT = (a, b, c, d, e) => ({ nutzen: a, betroffene: b, dringlichkeit: c, fit: d, aufwand: e, comment: '', updatedAt: t(6) });
    docs.set('ratings/u_admin', { byRequest: { q1: RT(5, 4, 4, 4, 2), q2: RT(3, 3, 2, 4, 4), q3: RT(4, 3, 5, 3, 3) } });
    docs.set('ratings/u_gremium', { byRequest: { q1: RT(4, 4, 3, 5, 2), q2: RT(3, 2, 3, 3, 4) } });
  }
})();
```

`tests/shot.sh`:
```bash
#!/usr/bin/env bash
# Screenshot von dist/dev.html. Verwendung: tests/shot.sh <reiter|r-q1> [rolle] [breite] [dark]
set -uo pipefail
cd "$(dirname "$0")/.."
tab="${1:-einreichen}"; role="${2:-admin}"; width="${3:-1280}"; theme="${4:-light}"
root="$(pwd -W 2>/dev/null || pwd)"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
extra=""; [ "$theme" = "dark" ] && extra="--blink-settings=preferredColorScheme=0"
out="$root/dist/shot-$tab-$role-$width-$theme.png"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --window-size="$width,1800" --virtual-time-budget=4000 $extra \
  --screenshot="$out" "file:///$root/dist/dev.html?seed=1&role=$role#$tab" >/dev/null 2>&1
echo "$out"
```

- [ ] **Step 9: Build, Tests und Sichtprüfung**

Run: `bash tests/run.sh && bash build.sh && bash tests/shot.sh einreichen admin`
Expected:
- Tests `SUMMARY logic 38/38` und `SUMMARY 4/4`.
- Build ohne Fehler.
- Der Screenshot (mit dem Read-Tool öffnen) zeigt Titel, Untertitel, «Test Administration · Administration · Gremium», fünf Reiter mit «Einreichen» aktiv und den Text «Einreichen folgen.».

- [ ] **Step 10: Commit**

```bash
git add src tests
git commit -m "feat: Seitengerüst, UI-Helfer, Datenzugriff und Navigation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Ansicht «Einstellungen» mit Einrichtung, Gremium, Releases und Export

**Files:**
- Replace: `src/view-settings.js`

**Interfaces:**
- Consumes:
  - `Store.state`, `Store.settings()`, `Store.saveSettings`, `Store.saveRelease`, `Store.deleteRelease`, `Store.exportCsv`
  - `UI.h`, `UI.field`, `UI.nameSpan`, `UI.confirmDialog`, `UI.toast`, `UI.clearDirty`
  - `Logic.BENEFIT_KEYS`, `Logic.CRITERIA_LABEL`, `Logic.parseNum`
- Produces: `SettingsView.render(root, state)`.

- [ ] **Step 1: `src/view-settings.js` vollständig ersetzen**

```js
/* Ansicht «Einstellungen»: nur für die Administration. */
const SettingsView = (() => {
  const { h } = UI;
  // Vorschläge für die Ersteinrichtung; die Administration passt sie an.
  const SUGGESTED = {
    departments: ['Verkauf', 'Kundendienst', 'Marketing', 'Finanzen', 'Geschäftsleitung'],
    crmAreas: ['Kontakte und Firmen', 'Verträge', 'Kampagnen', 'Aktivitäten und Aufgaben', 'Reporting', 'Schnittstellen'],
    systems: ['Excel', 'Outlook', 'SharePoint'],
  };
  const lines = v => [...new Set(v.split('\n').map(x => x.trim()).filter(Boolean))];
  const val = id => document.getElementById(id).value;

  function render(root, st) {
    const isNew = !st.settings;
    const cur = Store.settings();
    const base = isNew ? { ...cur, ...SUGGESTED, committee: st.me.id ? [st.me.id] : [] } : cur;
    root.append(h('div', { class: 'stack' },
      isNew ? h('section', { class: 'panel', style: 'border-color:var(--accent)' },
        h('h2', {}, 'Portal einrichten'),
        h('p', { class: 'note' }, 'Das Portal hat noch keine Einstellungen. Die Felder enthalten Vorschläge. Passen Sie die Listen an Ihre Organisation an und speichern Sie. Danach können Anforderungen eingereicht werden. Sie selbst werden als erstes Gremium-Mitglied eingetragen.')) : null,
      generalForm(base, isNew),
      isNew ? null : committeePanel(st, cur),
      isNew ? null : releasesPanel(st),
      isNew ? null : h('section', { class: 'panel' },
        h('h2', {}, 'Export'),
        h('p', { class: 'note' }, 'Speichert zwei CSV-Dateien: alle Anforderungen mit berechneten Werten und alle Bewertungen. Trennzeichen ist das Semikolon, damit Excel die Dateien direkt öffnet.'),
        h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => Store.exportCsv() }, 'CSV exportieren')))));
  }

  function generalForm(base, isNew) {
    const num = (id, label, value, hint) => UI.field(id, label, h('input', { type: 'text', inputmode: 'decimal', id, value: String(value) }), hint);
    const list = (id, label, values, hint) => UI.field(id, label, h('textarea', { id, rows: 6 }, values.join('\n')), hint);
    const ids = [...Logic.BENEFIT_KEYS.map(k => 'set-w-' + k), 'set-min', 'set-weeks', 'set-dep', 'set-crm', 'set-sys'];
    const form = h('form', { class: 'panel', novalidate: true },
      h('h2', {}, 'Bewertung und Wertelisten'),
      h('div', { class: 'ratinggrid' }, ...Logic.BENEFIT_KEYS.map(k => num('set-w-' + k, 'Gewicht ' + Logic.CRITERIA_LABEL[k], base.weights[k] ?? 1, '0 bis 3, in Schritten von 0,5'))),
      h('div', { class: 'ratinggrid', style: 'margin-top:12px' },
        num('set-min', 'Mindestanzahl Bewertungen', base.minRatings, 'Ab dieser Anzahl gilt eine Anforderung als bewertet.'),
        num('set-weeks', 'Arbeitswochen pro Jahr', base.weeksPerYear, 'Für die Berechnung des Einsparpotenzials.')),
      h('div', { class: 'grid2', style: 'margin-top:12px' },
        list('set-dep', 'Abteilungen', base.departments, 'Ein Eintrag pro Zeile.'),
        list('set-crm', 'CRM-Bereiche', base.crmAreas, 'Ein Eintrag pro Zeile.'),
        list('set-sys', 'Systeme', base.systems, 'Für betroffene und ablösbare Systeme. Ein Eintrag pro Zeile.')),
      h('p', { class: 'err', id: 'set-err', hidden: true, style: 'margin-top:12px' }),
      h('div', { class: 'row', style: 'margin-top:16px' }, h('button', { class: 'btn', type: 'submit' }, isNew ? 'Einrichtung speichern' : 'Einstellungen speichern')));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errs = [], weights = {};
      for (const k of Logic.BENEFIT_KEYS) {
        const w = Logic.parseNum(val('set-w-' + k));
        if (!Number.isFinite(w) || w < 0 || w > 3 || Math.round(w * 2) !== w * 2) errs.push(`Gewicht ${Logic.CRITERIA_LABEL[k]}: 0 bis 3 in Schritten von 0,5.`);
        weights[k] = w;
      }
      if (Logic.BENEFIT_KEYS.every(k => weights[k] === 0)) errs.push('Mindestens ein Gewicht muss grösser als 0 sein.');
      const minRatings = Logic.parseNum(val('set-min'));
      if (!Number.isInteger(minRatings) || minRatings < 1) errs.push('Mindestanzahl Bewertungen: ganze Zahl ab 1.');
      const weeksPerYear = Logic.parseNum(val('set-weeks'));
      if (!Number.isFinite(weeksPerYear) || weeksPerYear < 1 || weeksPerYear > 52) errs.push('Arbeitswochen pro Jahr: Zahl zwischen 1 und 52.');
      const departments = lines(val('set-dep')), crmAreas = lines(val('set-crm')), systems = lines(val('set-sys'));
      if (!departments.length) errs.push('Bitte mindestens eine Abteilung erfassen.');
      if (!crmAreas.length) errs.push('Bitte mindestens einen CRM-Bereich erfassen.');
      const err = document.getElementById('set-err');
      err.textContent = errs.join(' '); err.hidden = !errs.length;
      if (errs.length) return;
      const ok = await Store.saveSettings({ ...base, weights, minRatings, weeksPerYear, departments, crmAreas, systems });
      if (ok != null) UI.clearDirty(...ids);
    });
    return form;
  }

  function committeePanel(st, cur) {
    const results = h('ul', { class: 'posts', id: 'cm-results', style: 'margin-top:8px' });
    const search = h('input', { type: 'search', id: 'cm-search', placeholder: 'Name oder E-Mail eingeben', autocomplete: 'off' });
    const run = async () => {
      if (!st.user) { results.replaceChildren(h('li', {}, 'Die Personensuche ist in dieser Ansicht nicht verfügbar.')); return; }
      const q = search.value.trim();
      const hits = (await st.user.search(q)).filter(p => !cur.committee.includes(p.id));
      results.replaceChildren(...(hits.length
        ? hits.map(p => h('li', { class: 'row', style: 'justify-content:space-between' }, h('span', {}, p.name),
            h('button', { class: 'btn small', type: 'button', onclick: () => Store.saveSettings({ ...cur, committee: [...cur.committee, p.id] }) }, 'Hinzufügen')))
        : [h('li', {}, q ? 'Keine Person gefunden. Gesucht wird in Ihrer Organisation.' : 'Namen eingeben, um Personen zu suchen.')]));
    };
    search.addEventListener('input', run);
    search.addEventListener('focus', run);
    return h('section', { class: 'panel' },
      h('h2', {}, 'Gremium'),
      h('p', { class: 'note', style: 'margin-bottom:12px' }, 'Nur Bewertungen dieser Personen zählen für Durchschnitt und Score. Mitglieder brauchen beim Teilen des Portals mindestens die Freigabe «Contributor».'),
      cur.committee.length
        ? h('ul', { class: 'posts' }, ...cur.committee.map(id => h('li', { class: 'row', style: 'justify-content:space-between' }, UI.nameSpan(id),
            h('button', { class: 'btn ghost small', type: 'button', onclick: () => Store.saveSettings({ ...cur, committee: cur.committee.filter(x => x !== id) }) }, 'Entfernen'))))
        : h('p', { class: 'note' }, 'Noch keine Mitglieder.'),
      UI.field('cm-search', 'Person hinzufügen', search),
      results);
  }

  function releasesPanel(st) {
    const usedCount = id => st.requests.filter(r => r.releaseId === id).length;
    const inp = (id, value, attrs = {}) => h('input', { type: 'text', id, value: value == null ? '' : String(value), ...attrs });
    const rows = st.releases.map(rel => h('tr', {},
      h('td', {}, inp('rel-name-' + rel.id, rel.name, { 'aria-label': 'Name' })),
      h('td', {}, inp('rel-order-' + rel.id, rel.order, { inputmode: 'numeric', 'aria-label': 'Reihenfolge' })),
      h('td', {}, inp('rel-cap-' + rel.id, rel.capacity, { inputmode: 'decimal', 'aria-label': 'Kapazität in Punkten' })),
      h('td', {}, rel.status === 'ausgeliefert' ? 'ausgeliefert' : 'offen'),
      h('td', {}, h('div', { class: 'row' },
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => saveRel(rel.id, rel.status) }, 'Speichern'),
        h('button', { class: 'btn danger small', type: 'button', disabled: usedCount(rel.id) > 0, title: usedCount(rel.id) ? 'Enthält Anforderungen und kann nicht gelöscht werden.' : null, onclick: () => delRel(rel) }, 'Löschen')))));
    const nextOrder = st.releases.reduce((m, r) => Math.max(m, r.order || 0), 0) + 1;
    rows.push(h('tr', {},
      h('td', {}, inp('rel-name-new', '', { placeholder: 'z. B. 2027.1', 'aria-label': 'Name des neuen Release' })),
      h('td', {}, inp('rel-order-new', nextOrder, { inputmode: 'numeric', 'aria-label': 'Reihenfolge des neuen Release' })),
      h('td', {}, inp('rel-cap-new', '', { inputmode: 'decimal', placeholder: 'z. B. 20', 'aria-label': 'Kapazität des neuen Release' })),
      h('td', {}, 'neu'),
      h('td', {}, h('button', { class: 'btn small', type: 'button', onclick: () => saveRel(null, 'offen') }, 'Anlegen'))));
    return h('section', { class: 'panel' },
      h('h2', {}, 'Releases'),
      h('p', { class: 'note', style: 'margin-bottom:12px' }, 'Die Kapazität gibt an, wie viele Aufwandspunkte ein Release aufnehmen kann. Der automatische Vorschlag füllt die offenen Releases in der angegebenen Reihenfolge.'),
      h('div', { class: 'tablewrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ...['Name', 'Reihenfolge', 'Kapazität (Punkte)', 'Status', ''].map(t => h('th', {}, t)))),
        h('tbody', {}, ...rows))));
  }
  async function saveRel(id, status) {
    const key = id || 'new';
    const v = k => document.getElementById(`rel-${k}-${key}`).value.trim();
    const name = v('name'), order = Logic.parseNum(v('order')), capacity = Logic.parseNum(v('cap'));
    if (!name) { UI.toast('Bitte einen Namen für das Release angeben.', 'err'); return; }
    if (!Number.isFinite(order)) { UI.toast('Die Reihenfolge muss eine Zahl sein.', 'err'); return; }
    if (!Number.isFinite(capacity) || capacity <= 0) { UI.toast('Die Kapazität muss eine Zahl grösser als 0 sein.', 'err'); return; }
    const ok = await Store.saveRelease({ id, name, order, capacity, status });
    if (ok == null) return;
    UI.clearDirty(`rel-name-${key}`, `rel-order-${key}`, `rel-cap-${key}`);
    if (!id) for (const k of ['name', 'cap']) { const el = document.getElementById(`rel-${k}-new`); if (el) el.value = ''; }
  }
  async function delRel(rel) {
    const res = await UI.confirmDialog(`Release ${rel.name} löschen?`, { confirmLabel: 'Löschen' });
    if (res.ok) await Store.deleteRelease(rel.id);
  }

  return { render };
})();
```

- [ ] **Step 2: Build und Sichtprüfung**

Run: `bash build.sh && bash tests/shot.sh einstellungen admin`
Expected:
Panels «Bewertung und Wertelisten» (vier Gewichte mit 1, Mindestanzahl 2, Wochen 46, drei Listen), «Gremium» mit «Test Administration» und «Test Gremium», «Releases» mit 2027.1 und 2027.2 sowie Neu-Zeile, «Export».

- [ ] **Step 3: Funktionsprüfung im Browser**

`dist/dev.html?role=admin#einstellungen` in Edge öffnen (ohne `seed`) und prüfen:
1. Es erscheint «Portal einrichten» mit den Vorschlägen. «Einrichtung speichern» bewirkt den Toast «Einstellungen gespeichert.», danach erscheinen die Panels Gremium, Releases und Export.
2. Bei Gewicht «0,7» erscheint der Fehler «… in Schritten von 0,5».
3. Release «2027.1» mit Kapazität «20» anlegen: Es erscheint eine neue Zeile, die Neu-Zeile ist leer.
4. Die Personensuche nach «Gremium» findet «Test Gremium», «Hinzufügen» nimmt die Person in die Liste auf.

- [ ] **Step 4: Commit**

```bash
git add src/view-settings.js
git commit -m "feat: Einstellungen mit Einrichtung, Gremium, Releases und Export" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Ansicht «Einreichen» mit geführtem Formular

**Files:**
- Replace: `src/view-submit.js`

**Interfaces:**
- Consumes:
  - `Logic.validateSubmission`, `Logic.parseNum`, `Logic.FREQUENCIES`, `Logic.CONSEQUENCES`, `Logic.LIMITS`
  - `Store.createRequest`, `Store.updateRequest`, `Store.changeStatus`, `Store.settings()`
  - `UI.field`, `UI.select`, `UI.showErrors`, `UI.toast`
  - `RequestsView.select`, `App.go`, `App.render`
- Produces:
  - `SubmitView.render(root, state)`
  - `SubmitView.edit(request)`: lädt eine bestehende Anforderung zum Bearbeiten. Beim Speichern im Status «In Klärung» wechselt der Status automatisch auf «Eingereicht» mit dem Kommentar «Angaben ergänzt».

- [ ] **Step 1: `src/view-submit.js` vollständig ersetzen**

```js
/* Ansicht «Einreichen»: geführtes Formular in vier Schritten, auch zum Bearbeiten. */
const SubmitView = (() => {
  const { h } = UI;
  const STEPS = ['Worum geht es?', 'Pain: heutiges Problem', 'Gain: erwarteter Nutzen', 'Systeme'];
  const KEY_TO_ID = {
    title: 'f-title', department: 'f-department', crmArea: 'f-crmArea', 'pain.situation': 'f-situation',
    'pain.frequency': 'f-frequency', 'pain.hoursPerWeek': 'f-hours', 'pain.persons': 'f-persons',
    'gain.department': 'f-gainDept', 'gain.successCriterion': 'f-success', 'gain.deadlineReason': 'f-deadlineReason', links: 'f-links',
  };
  const STEP_OF = {
    title: 0, department: 0, crmArea: 0, 'pain.situation': 1, 'pain.frequency': 1, 'pain.hoursPerWeek': 1, 'pain.persons': 1,
    'gain.department': 2, 'gain.successCriterion': 2, 'gain.deadlineReason': 2, links: 3,
  };
  let step = 0, repRows = 1, done = null, editing = null, draft = null, busy = false;

  const empty = () => ({
    title: '', department: '', crmArea: '', useCase: '',
    pain: { situation: '', frequency: '', hoursPerWeek: '', persons: '', consequences: [] },
    gain: { department: '', company: '', successCriterion: '', deadline: '', deadlineReason: '' },
    systems: { affected: [], replaceable: [] }, links: [],
  });

  function edit(r) {
    const p = r.pain || {}, g = r.gain || {}, sy = r.systems || {};
    editing = r.id; done = null; step = 0;
    draft = {
      title: r.title || '', department: r.department || '', crmArea: r.crmArea || '', useCase: r.useCase || '',
      pain: { situation: p.situation || '', frequency: p.frequency || '', hoursPerWeek: p.hoursPerWeek == null ? '' : String(p.hoursPerWeek).replace('.', ','), persons: p.persons == null ? '' : String(p.persons), consequences: [...(p.consequences || [])] },
      gain: { department: g.department || '', company: g.company || '', successCriterion: g.successCriterion || '', deadline: g.deadline || '', deadlineReason: g.deadlineReason || '' },
      systems: { affected: [...(sy.affected || [])], replaceable: (sy.replaceable || []).map(x => ({ system: x.system || '', purpose: x.purpose || '' })) },
      links: [...(r.links || [])],
    };
    repRows = Math.max(1, draft.systems.replaceable.length);
  }

  const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  function collect(form) {
    const checked = group => [...form.querySelectorAll(`input[type="checkbox"][data-group="${group}"]:checked`)].map(i => i.value);
    const other = val('f-sysOther').split(/[,;]/).map(x => x.trim()).filter(Boolean);
    const replaceable = [];
    for (let i = 0; i < repRows; i++) {
      const system = val('f-rep-sys-' + i);
      if (system) replaceable.push({ system, purpose: val('f-rep-purpose-' + i) });
    }
    return {
      title: val('f-title'), department: val('f-department'), crmArea: val('f-crmArea'), useCase: val('f-useCase'),
      pain: { situation: val('f-situation'), frequency: val('f-frequency'), hoursPerWeek: val('f-hours'), persons: val('f-persons'), consequences: checked('cons') },
      gain: { department: val('f-gainDept'), company: val('f-gainCompany'), successCriterion: val('f-success'), deadline: val('f-deadline'), deadlineReason: val('f-deadlineReason') },
      systems: { affected: [...new Set([...checked('sys'), ...other])], replaceable },
      links: val('f-links').split(/\s+/).filter(Boolean),
    };
  }
  // Wandelt Texteingaben in die gespeicherte Form um (Zahlen, leere Frist = null).
  function normalize(d) {
    return { ...d,
      pain: { ...d.pain, hoursPerWeek: Logic.parseNum(d.pain.hoursPerWeek), persons: Logic.parseNum(d.pain.persons) },
      gain: { ...d.gain, deadline: d.gain.deadline || null } };
  }

  const text = (id, value, attrs = {}) => h('input', { type: 'text', id, value, ...attrs });
  const area = (id, value, rows = 4) => h('textarea', { id, rows }, value);
  const withCurrent = (list, cur) => (cur && !list.includes(cur) ? [...list, cur] : list);
  function check(group, value, isChecked, i) {
    const id = `f-${group}-${i}`;
    return h('label', { for: id }, h('input', { type: 'checkbox', id, value, checked: isChecked, 'data-group': group }), value);
  }

  function stepWhat(d, set) {
    return h('fieldset', { 'data-step': 0 }, h('legend', {}, STEPS[0]),
      UI.field('f-title', 'Titel', text('f-title', d.title, { maxlength: Logic.LIMITS.titleMax }), 'Kurz und konkret, z. B. «Offerten direkt aus dem CRM erstellen».'),
      h('div', { class: 'grid2' },
        UI.field('f-department', 'Abteilung', UI.select('f-department', withCurrent(set.departments, d.department), d.department, { placeholder: 'Bitte wählen' })),
        UI.field('f-crmArea', 'Betroffener CRM-Bereich', UI.select('f-crmArea', withCurrent(set.crmAreas, d.crmArea), d.crmArea, { placeholder: 'Bitte wählen' }))),
      UI.field('f-useCase', 'Use Case (optional)', area('f-useCase', d.useCase, 3),
        'Als … möchte ich …, damit … Z. B. «Als Kundenberaterin möchte ich alle Verträge eines Kunden auf einen Blick sehen, damit ich Anfragen am Telefon sofort beantworten kann.»'));
  }
  function stepPain(d) {
    const p = d.pain;
    return h('fieldset', { 'data-step': 1 }, h('legend', {}, STEPS[1]),
      UI.field('f-situation', 'Heutige Situation', area('f-situation', p.situation, 5),
        'Wie läuft es heute ab, und wo hakt es? Z. B. «Offerten entstehen in Word, die Preise werden von Hand aus Excel übertragen. Dabei passieren Fehler, und im CRM ist die Offerte nicht sichtbar.»'),
      h('p', { class: 'hint', id: 'f-situation-count' }),
      h('div', { class: 'grid3' },
        UI.field('f-frequency', 'Häufigkeit', UI.select('f-frequency', Logic.FREQUENCIES, p.frequency, { placeholder: 'Bitte wählen' })),
        UI.field('f-hours', 'Zeitaufwand in h pro Woche und Person', text('f-hours', p.hoursPerWeek, { inputmode: 'decimal', placeholder: 'z. B. 1,5' })),
        UI.field('f-persons', 'Betroffene Personen', text('f-persons', p.persons, { inputmode: 'numeric', placeholder: 'z. B. 6' }))),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Folgen (optional)'),
        h('div', { class: 'checks' }, ...Logic.CONSEQUENCES.map((c, i) => check('cons', c, p.consequences.includes(c), i)))));
  }
  function stepGain(d) {
    const g = d.gain;
    return h('fieldset', { 'data-step': 2 }, h('legend', {}, STEPS[2]),
      UI.field('f-gainDept', 'Nutzen für die Abteilung', area('f-gainDept', g.department, 4),
        'Was wird für Ihre Abteilung besser? Z. B. «Pro Offerte rund 20 Minuten weniger Aufwand, keine Übertragungsfehler mehr.»'),
      h('p', { class: 'hint', id: 'f-gainDept-count' }),
      UI.field('f-gainCompany', 'Nutzen für das Unternehmen (optional)', area('f-gainCompany', g.company, 3),
        'Z. B. schnellere Antworten für Kundinnen und Kunden, weniger Reklamationen, Erfüllung regulatorischer Vorgaben.'),
      UI.field('f-success', 'Erfolgskriterium', text('f-success', g.successCriterion),
        'Woran messen wir den Erfolg? Z. B. «Durchlaufzeit einer Offerte von 5 auf 2 Arbeitstage».'),
      h('div', { class: 'grid2' },
        UI.field('f-deadline', 'Frist (optional)', h('input', { type: 'date', id: 'f-deadline', value: g.deadline || '' }), 'Nur bei einem festen Termin.'),
        UI.field('f-deadlineReason', 'Grund für die Frist', text('f-deadlineReason', g.deadlineReason), 'Pflicht, wenn eine Frist angegeben ist.')));
  }
  function stepSystems(d, set) {
    const sy = d.systems, known = set.systems;
    const others = sy.affected.filter(x => !known.includes(x));
    const rows = [];
    for (let i = 0; i < repRows; i++) {
      const r = sy.replaceable[i] || { system: '', purpose: '' };
      rows.push(h('div', { class: 'reprow' },
        h('input', { type: 'text', id: 'f-rep-sys-' + i, value: r.system, list: 'dl-systems', placeholder: 'z. B. Excel-Liste Kundenanlässe', 'aria-label': `Ablösbares System ${i + 1}` }),
        h('input', { type: 'text', id: 'f-rep-purpose-' + i, value: r.purpose, placeholder: 'Was leistet es heute?', 'aria-label': `Heutige Aufgabe von System ${i + 1}` })));
    }
    return h('fieldset', { 'data-step': 3 }, h('legend', {}, STEPS[3]),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Betroffene Systeme (optional)'),
        h('p', { class: 'hint' }, 'Mit welchen Systemen hängt die Anforderung zusammen, etwa über Schnittstellen oder Datenquellen?'),
        known.length ? h('div', { class: 'checks' }, ...known.map((s, i) => check('sys', s, sy.affected.includes(s), i))) : null,
        text('f-sysOther', others.join(', '), { placeholder: 'Weitere Systeme, durch Komma getrennt', 'aria-label': 'Weitere betroffene Systeme' })),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Systeme, die abgelöst werden könnten (optional)'),
        h('p', { class: 'hint' }, 'Welche Excel-Listen, Access-Datenbanken oder Altsysteme würden überflüssig, und was leisten sie heute?'),
        ...rows,
        h('div', {}, h('button', { type: 'button', class: 'btn ghost small', onclick: () => { draft = collect(document.getElementById('submit-form')); repRows++; App.render(); } }, 'Weiteres System'))),
      h('datalist', { id: 'dl-systems' }, ...known.map(s => h('option', { value: s }))),
      UI.field('f-links', 'Links (optional)', area('f-links', d.links.join('\n'), 2), 'Ein Link pro Zeile, z. B. auf ein SharePoint-Dokument oder einen Teams-Beitrag.'));
  }

  function showStep(form) {
    form.querySelectorAll('fieldset[data-step]').forEach(fs => { fs.hidden = Number(fs.dataset.step) !== step; });
    form.querySelectorAll('.stepper button').forEach((b, i) => { if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    form.querySelector('#f-back').hidden = step === 0;
    form.querySelector('#f-next').hidden = step === STEPS.length - 1;
    form.querySelector('#f-submit').hidden = step !== STEPS.length - 1;
  }
  function updateQuality(form) {
    const q = Logic.validateSubmission(normalize(collect(form))).quality;
    form.querySelector('#q-label').textContent = `Vollständigkeit ${q} %`;
    form.querySelector('#q-bar').style.width = q + '%';
    const c1 = form.querySelector('#f-situation-count');
    if (c1) c1.textContent = `${val('f-situation').length} Zeichen, mindestens ${Logic.LIMITS.situationMin}`;
    const c2 = form.querySelector('#f-gainDept-count');
    if (c2) c2.textContent = `${val('f-gainDept').length} Zeichen, mindestens ${Logic.LIMITS.gainMin}`;
  }
  function next(form) {
    const res = Logic.validateSubmission(normalize(collect(form)));
    const errs = Object.fromEntries(Object.entries(res.errors).filter(([k]) => STEP_OF[k] === step));
    UI.showErrors(form, errs, KEY_TO_ID);
    if (Object.keys(errs).length) { const bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    step++; showStep(form); form.scrollIntoView({ block: 'start' });
  }

  async function submit(form) {
    if (busy) return;
    const data = normalize(collect(form));
    const res = Logic.validateSubmission(data);
    UI.showErrors(form, res.errors, KEY_TO_ID);
    if (!res.valid) {
      step = Math.min(...Object.keys(res.errors).map(k => STEP_OF[k]));
      showStep(form);
      UI.toast('Bitte die markierten Felder ergänzen.', 'err');
      const bad = form.querySelector('fieldset:not([hidden]) [aria-invalid="true"]'); if (bad) bad.focus();
      return;
    }
    busy = true;
    let result = null;
    if (editing) {
      const r = Store.state.requests.find(x => x.id === editing);
      if (r) {
        result = r.status === 'klaerung'
          ? await Store.changeStatus(r, 'eingereicht', 'Angaben ergänzt', data, 'Änderungen gespeichert.')
          : await Store.updateRequest(r.id, data, 'Änderungen gespeichert.');
        if (result != null) done = { id: r.id, number: r.number, edited: true };
      } else UI.toast('Diese Anforderung gibt es nicht mehr.', 'err');
    } else {
      result = await Store.createRequest(data);
      if (result != null) done = result;
    }
    busy = false;
    if (result != null) { draft = null; editing = null; step = 0; repRows = 1; }
    App.render();
  }
  function cancelEdit() { editing = null; draft = null; step = 0; repRows = 1; App.go('anforderungen'); }

  function donePanel() {
    const d = done;
    return h('section', { class: 'panel narrow' },
      h('h2', {}, d.edited ? `Änderungen an #${d.number} gespeichert` : `Anforderung #${d.number} eingereicht`),
      h('p', { class: 'note' }, d.edited ? 'Die Administration sieht die aktualisierten Angaben.' : 'Danke. Den Status verfolgen Sie unter «Anforderungen». Rückfragen erscheinen ebenfalls dort.'),
      h('div', { class: 'row', style: 'margin-top:16px' },
        h('button', { class: 'btn', type: 'button', onclick: () => { done = null; RequestsView.select(d.id); App.go('anforderungen'); } }, 'Anforderung ansehen'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { done = null; App.render(); } }, 'Weitere Anforderung einreichen')));
  }

  function render(root, st) {
    if (done) { root.append(donePanel()); return; }
    const set = Store.settings();
    const d = draft || empty();
    const blocked = !st.db ? 'Die Datenbank ist nicht verfügbar, deshalb kann nichts eingereicht werden.'
      : !st.me.id ? 'Zum Einreichen müssen Sie in claude.ai angemeldet sein.'
      : st.canWrite === false ? 'Sie haben nur Lesezugriff. Für das Einreichen braucht es die Freigabe «Contributor».'
      : (st.loaded.settings && !st.settings) ? 'Das Portal ist noch nicht eingerichtet.'
      : null;
    const form = h('form', { class: 'panel narrow', id: 'submit-form', novalidate: true },
      h('div', { class: 'form-head' },
        h('h2', {}, editing ? 'Anforderung bearbeiten' : 'Neue Anforderung einreichen'),
        h('div', { class: 'quality', 'aria-live': 'polite' }, h('span', { id: 'q-label' }, 'Vollständigkeit 0 %'), h('div', { class: 'meter' }, h('span', { id: 'q-bar', style: 'width:0%' })))),
      h('ol', { class: 'stepper' }, ...STEPS.map((t, i) => h('li', {},
        h('button', { type: 'button', onclick: () => { step = i; showStep(form); } }, h('span', { class: 'n' }, i + 1), t)))),
      stepWhat(d, set), stepPain(d), stepGain(d), stepSystems(d, set),
      blocked ? h('p', { class: 'banner' }, blocked) : null,
      h('div', { class: 'formnav' },
        h('button', { type: 'button', class: 'btn ghost', id: 'f-back', onclick: () => { step = Math.max(0, step - 1); showStep(form); } }, 'Zurück'),
        h('div', { class: 'row' },
          editing ? h('button', { type: 'button', class: 'btn ghost', onclick: cancelEdit }, 'Bearbeiten abbrechen') : null,
          h('button', { type: 'button', class: 'btn', id: 'f-next', onclick: () => next(form) }, 'Weiter'),
          h('button', { type: 'submit', class: 'btn', id: 'f-submit', disabled: !!blocked }, editing ? 'Änderungen speichern' : 'Anforderung einreichen'))));
    const sync = () => { draft = collect(form); updateQuality(form); };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    form.addEventListener('submit', e => { e.preventDefault(); submit(form); });
    root.append(form);
    showStep(form);
    updateQuality(form);
  }

  return { render, edit };
})();
```

- [ ] **Step 2: Build und Sichtprüfung**

Run:
```bash
bash build.sh
bash tests/shot.sh einreichen business
bash tests/shot.sh einreichen business 400
bash tests/shot.sh einreichen viewer
bash tests/shot.sh einreichen business 1280 dark
```
Expected:
- Formular mit Schrittleiste (1 aktiv), «Vollständigkeit 0 %», Felder von Schritt 1.
- Bei 400 px gibt es kein horizontales Scrollen, die Felder liegen untereinander.
- Mit `viewer` erscheinen das Banner «Sie haben Lesezugriff …» und der Hinweis im Formular. «Anforderung einreichen» ist auf Schritt 4 deaktiviert.
- Im dunklen Modus ist der Hintergrund dunkel, Text und Felder sind lesbar.

- [ ] **Step 3: Funktionsprüfung im Browser** (`dist/dev.html?seed=1&role=business#einreichen`)

1. «Weiter» bei leerem Schritt 1 zeigt drei Fehler, der Fokus liegt auf «Titel».
2. Schritt 2: «1,5» Stunden und 6 Personen werden ohne Fehler akzeptiert. Der Zeichenzähler aktualisiert sich bei der Eingabe.
3. Zu «Roadmap» wechseln und zurück: Alle Eingaben sind noch da.
4. Vollständig ausfüllen und absenden: Es erscheint «Anforderung #5 eingereicht». «Anforderung ansehen» öffnet in Task 9 das Detail, vorher den Platzhalter.

- [ ] **Step 4: Commit**

```bash
git add src/view-submit.js
git commit -m "feat: geführtes Einreichungsformular mit Vollständigkeitsanzeige" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Ansicht «Anforderungen» mit Liste, Detail, Bewertung, Rückfragen und Statusaktionen

**Files:**
- Replace: `src/view-requests.js`

**Interfaces:**
- Consumes:
  - `Store.*` (`evaluation`, `canSeeResults`, `isCommittee`, `myRating`, `points`, `saveRating`, `changeStatus`, `updateRequest`, `watchComments`, `addComment`, `settings`)
  - `Logic.*` (`STATUSES`, `STATUS_LABEL`, `CRITERIA`, `CRITERIA_LABEL`, `QUADRANT_LABEL`, `manualTargets`, `needsReason`, `isValidRating`, `savingsHoursPerYear`, `parseNum`)
  - `UI.*`, `SubmitView.edit`, `App.go`, `App.render`
- Produces: `RequestsView.render(root, state)` und `RequestsView.select(id|null)`.

- [ ] **Step 1: `src/view-requests.js` vollständig ersetzen**

```js
/* Ansicht «Anforderungen»: Liste mit Filtern und Detailansicht. */
const RequestsView = (() => {
  const { h } = UI;
  let selected = null, unsub = null, commentsFor = null, comments = [];
  const filters = { q: '', status: '', crmArea: '', department: '', mine: false, sort: 'neu' };
  const SCALE = {
    nutzen: ['sehr gering', 'gering', 'mittel', 'hoch', 'sehr hoch'],
    betroffene: ['Einzelperson', 'kleines Team', 'eine Abteilung', 'mehrere Abteilungen', 'ganzes Unternehmen'],
    dringlichkeit: ['keine', 'gering', 'mittel', 'hoch', 'sehr hoch'],
    fit: ['kein Bezug', 'gering', 'mittel', 'hoch', 'zentral'],
    aufwand: ['sehr klein', 'klein', 'mittel', 'gross', 'sehr gross'],
  };
  const ACTION_LABEL = { klaerung: 'Rückfrage stellen', bewertung: 'Zur Bewertung freigeben', abgelehnt: 'Ablehnen', zurueckgestellt: 'Zurückstellen' };

  function select(id) { selected = id; }
  function stopComments() { if (unsub) unsub(); unsub = null; commentsFor = null; comments = []; }
  function open(id) { selected = id; window.scrollTo(0, 0); App.render(); }

  function render(root, st) {
    if (selected) {
      const r = st.requests.find(x => x.id === selected);
      if (r) { renderDetail(root, st, r); return; }
      if (!st.loaded.requests && st.db) { root.append(h('p', { class: 'empty' }, 'Anforderung wird geladen …')); return; }
      selected = null;
      UI.toast('Diese Anforderung gibt es nicht mehr.', 'err');
    }
    stopComments();
    renderList(root, st);
  }

  // ---- Liste ----
  function visible(st) {
    const q = filters.q.trim().toLowerCase();
    const list = st.requests.filter(r =>
      (!filters.status || r.status === filters.status) &&
      (!filters.crmArea || r.crmArea === filters.crmArea) &&
      (!filters.department || r.department === filters.department) &&
      (!filters.mine || r.submittedBy === st.me.id) &&
      (!q || [r.title, r.useCase, r.pain && r.pain.situation, r.gain && r.gain.department, '#' + r.number].join(' ').toLowerCase().includes(q)));
    const sc = r => { const ev = Store.evaluation(r); return Store.canSeeResults(r) && ev.count ? ev.score : -1; };
    const sorters = { neu: (a, b) => b.number - a.number, alt: (a, b) => a.number - b.number, score: (a, b) => (sc(b) - sc(a)) || (a.number - b.number) };
    return list.sort(sorters[filters.sort]);
  }
  function renderList(root, st) {
    const set = Store.settings();
    const upd = k => e => { filters[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; App.render(); };
    const uniq = (a, b) => [...new Set([...a, ...b].filter(Boolean))];
    const list = visible(st);
    root.append(
      h('div', { class: 'spread' }, h('h2', {}, 'Anforderungen'), h('span', { class: 'note' }, `${list.length} von ${st.requests.length}`)),
      h('div', { class: 'filters' },
        h('input', { type: 'search', id: 'flt-q', placeholder: 'Suchen nach Titel, Text oder #Nummer', 'aria-label': 'Suchen', value: filters.q, oninput: upd('q') }),
        UI.select('flt-status', [['', 'Alle Status'], ...Logic.STATUSES.map(s => [s, Logic.STATUS_LABEL[s]])], filters.status, { label: 'Status', onchange: upd('status') }),
        UI.select('flt-crm', [['', 'Alle CRM-Bereiche'], ...uniq(set.crmAreas, st.requests.map(r => r.crmArea))], filters.crmArea, { label: 'CRM-Bereich', onchange: upd('crmArea') }),
        UI.select('flt-dep', [['', 'Alle Abteilungen'], ...uniq(set.departments, st.requests.map(r => r.department))], filters.department, { label: 'Abteilung', onchange: upd('department') }),
        UI.select('flt-sort', [['neu', 'Neueste zuerst'], ['alt', 'Älteste zuerst'], ['score', 'Höchster Score zuerst']], filters.sort, { label: 'Sortierung', onchange: upd('sort') }),
        h('label', { class: 'row', for: 'flt-mine' }, h('input', { type: 'checkbox', id: 'flt-mine', checked: filters.mine, onchange: upd('mine') }), 'Nur meine')));
    if (!st.loaded.requests && st.db) { root.append(h('p', { class: 'empty' }, 'Anforderungen werden geladen …')); return; }
    if (!st.requests.length) { root.append(h('p', { class: 'empty' }, 'Noch keine Anforderungen. Die erste reichen Sie unter «Einreichen» ein.')); return; }
    if (!list.length) { root.append(h('p', { class: 'empty' }, 'Keine Anforderung passt zu diesen Filtern.')); return; }
    const heads = [['Nr.', 'num'], ['Titel'], ['Abteilung'], ['CRM-Bereich'], ['Status'], ['Score', 'num'], ['Eingereicht', 'num']];
    root.append(h('div', { class: 'tablewrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ...heads.map(([t, c]) => h('th', { class: c || null }, t)))),
      h('tbody', {}, ...list.map(r => {
        const ev = Store.evaluation(r);
        const show = Store.canSeeResults(r) && ev.count > 0;
        return h('tr', { class: 'click', tabindex: 0, onclick: () => open(r.id), onkeydown: e => { if (e.key === 'Enter') open(r.id); } },
          h('td', { class: 'num' }, '#' + r.number), h('td', {}, r.title), h('td', {}, r.department), h('td', {}, r.crmArea),
          h('td', {}, UI.pill(r.status)), h('td', { class: 'num' }, show ? UI.fmtNum(ev.score, 2) : '–'), h('td', { class: 'num' }, UI.fmtDate(r.submittedAt)));
      })))));
  }

  // ---- Detail ----
  function renderDetail(root, st, r) {
    if (commentsFor !== r.id) {
      stopComments();
      commentsFor = r.id;
      unsub = Store.watchComments(r.id, list => { comments = list; App.render(); });
    }
    const set = Store.settings();
    const ev = Store.evaluation(r);
    const results = Store.canSeeResults(r) && ev.count > 0;
    const canEditReq = (r.submittedBy === st.me.id || st.isAdmin) && ['eingereicht', 'klaerung'].includes(r.status) && st.canWrite !== false;
    const p = r.pain || {}, g = r.gain || {}, sy = r.systems || {};
    const sec = (title, ...body) => h('section', { class: 'panel prose' }, h('h3', {}, title), ...body);
    const para = (label, value) => value ? h('div', {}, h('p', { class: 'eyebrow' }, label), h('p', {}, value)) : null;

    root.append(h('div', { class: 'detail-head' },
      h('div', {}, h('button', { class: 'linkbtn', type: 'button', onclick: () => { selected = null; stopComments(); App.render(); } }, '← Alle Anforderungen')),
      h('div', { class: 'row' }, h('span', { class: 'eyebrow' }, '#' + r.number), UI.pill(r.status)),
      h('h2', {}, r.title),
      h('p', { class: 'meta' }, `${r.department} · ${r.crmArea} · eingereicht am ${UI.fmtDate(r.submittedAt)} von `, UI.nameSpan(r.submittedBy))));

    const main = h('div', { class: 'stack' },
      r.useCase ? sec('Use Case', h('p', {}, r.useCase)) : null,
      sec('Pain: heutiges Problem',
        h('p', {}, p.situation),
        h('p', { class: 'meta' }, `${p.frequency} · ${UI.fmtNum(p.hoursPerWeek, 1)} h pro Woche und Person · ${p.persons} Personen betroffen`),
        (p.consequences || []).length ? h('div', { class: 'row', style: 'margin-top:8px' }, ...p.consequences.map(c => h('span', { class: 'chip' }, c))) : null),
      sec('Gain: erwarteter Nutzen',
        para('Für die Abteilung', g.department), para('Für das Unternehmen', g.company), para('Erfolgskriterium', g.successCriterion),
        g.deadline ? para('Frist', `${UI.fmtDate(g.deadline)}: ${g.deadlineReason}`) : null),
      sec('Systeme',
        para('Betroffene Systeme', (sy.affected || []).join(', ') || 'Keine Angabe'),
        (sy.replaceable || []).length
          ? h('div', {}, h('p', { class: 'eyebrow' }, 'Ablösbare Systeme'), h('ul', {}, ...sy.replaceable.map(x => h('li', {}, x.system, x.purpose ? `: ${x.purpose}` : ''))))
          : para('Ablösbare Systeme', 'Keine Angabe'),
        (r.links || []).length
          ? h('div', {}, h('p', { class: 'eyebrow' }, 'Links'), h('ul', {}, ...r.links.map(u => h('li', {}, h('a', { href: u, target: '_blank', rel: 'noopener' }, u)))))
          : null),
      ratingSection(st, r, ev, results),
      commentSection(st, r));

    const resultHint = !results && ev.count > 0
      ? h('p', { class: 'hint', style: 'margin-top:8px' }, Store.isCommittee() ? 'Die Ergebnisse sehen Sie, sobald Sie selbst bewertet haben.' : 'Die Ergebnisse sind sichtbar, sobald die Bewertung abgeschlossen ist.')
      : null;
    const relName = (st.releases.find(x => x.id === r.releaseId) || {}).name;
    const aside = h('div', { class: 'stack' },
      h('section', { class: 'panel' }, h('h3', {}, 'Kennzahlen'),
        h('dl', { class: 'kv' },
          h('dt', {}, 'Einsparpotenzial'), h('dd', {}, `${UI.fmtNum(Logic.savingsHoursPerYear(p, set.weeksPerYear))} h/Jahr`),
          h('dt', {}, 'Bewertungen'), h('dd', {}, `${ev.count} von mind. ${set.minRatings}`),
          h('dt', {}, 'Nutzen-Index'), h('dd', {}, results ? UI.fmtNum(ev.benefit, 2) : '–'),
          h('dt', {}, 'Ø Aufwand'), h('dd', {}, results ? UI.fmtNum(ev.effort, 2) : '–'),
          h('dt', {}, 'Score'), h('dd', {}, results ? UI.fmtNum(ev.score, 2) : '–'),
          h('dt', {}, 'Einordnung'), h('dd', {}, results ? Logic.QUADRANT_LABEL[ev.quadrant] : '–'),
          h('dt', {}, 'Aufwandspunkte'), h('dd', {}, results || r.effortOverride != null ? String(Store.points(r) ?? '–') : '–'),
          h('dt', {}, 'Release'), h('dd', {}, relName || '–')),
        resultHint,
        r.decisionReason ? h('p', { style: 'margin:12px 0 0' }, h('strong', {}, 'Begründung: '), r.decisionReason) : null),
      canEditReq ? h('section', { class: 'panel' },
        h('p', { class: 'hint', style: 'margin-bottom:8px' }, r.status === 'klaerung'
          ? 'Es gibt eine Rückfrage. Ergänzen Sie die Angaben, danach geht die Anforderung zurück an die Administration.'
          : 'Sie können die Angaben ändern, solange die Anforderung noch nicht in Bewertung ist.'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { SubmitView.edit(r); App.go('einreichen'); } }, 'Angaben bearbeiten')) : null,
      st.isAdmin ? adminSection(r) : null,
      h('section', { class: 'panel' }, h('h3', {}, 'Statusverlauf'),
        h('ol', { class: 'history' }, ...[...(r.statusHistory || [])].reverse().map(e => h('li', {},
          h('div', {}, UI.pill(e.status)),
          h('span', { class: 'meta' }, UI.fmtDateTime(e.at), ' · ', UI.nameSpan(e.by)),
          e.comment ? h('span', {}, e.comment) : null)))));

    root.append(h('div', { class: 'detail' }, main, aside));
  }

  function ratingSection(st, r, ev, results) {
    const member = Store.isCommittee();
    const openForRating = ['bewertung', 'bewertet'].includes(r.status);
    if (!(member && openForRating) && !(results && (st.isAdmin || member))) return null;
    const mine = Store.myRating(r.id);
    const sec = h('section', { class: 'panel' }, h('h3', {}, 'Bewertung durch das Gremium'));
    if (member && openForRating && st.canWrite !== false) {
      const ids = [...Logic.CRITERIA.map(k => 'rt-' + k), 'rt-comment'];
      const err = h('p', { class: 'err', hidden: true });
      const btn = h('button', { class: 'btn', type: 'button' }, mine ? 'Bewertung aktualisieren' : 'Bewertung speichern');
      btn.addEventListener('click', async () => {
        const rating = {};
        for (const k of Logic.CRITERIA) rating[k] = Number(document.getElementById('rt-' + k).value);
        rating.comment = document.getElementById('rt-comment').value.trim();
        if (!Logic.isValidRating(rating)) { err.textContent = 'Bitte alle fünf Kriterien bewerten.'; err.hidden = false; return; }
        btn.disabled = true;
        const ok = await Store.saveRating(r, rating);
        btn.disabled = false;
        if (ok != null) UI.clearDirty(...ids);
      });
      sec.append(
        h('p', { class: 'hint', style: 'margin-bottom:12px' }, 'Bewerten Sie unabhängig. Die Bewertungen der anderen sehen Sie, nachdem Sie Ihre eigene gespeichert haben.'),
        h('div', { class: 'ratinggrid' }, ...Logic.CRITERIA.map(k => UI.field('rt-' + k, Logic.CRITERIA_LABEL[k],
          UI.select('rt-' + k, [1, 2, 3, 4, 5].map(n => [n, `${n}: ${SCALE[k][n - 1]}`]), mine ? mine[k] : '', { placeholder: 'Bitte wählen' })))),
        h('div', { style: 'margin-top:12px' }, UI.field('rt-comment', 'Kommentar (optional)', h('textarea', { id: 'rt-comment', rows: 2 }, mine ? mine.comment || '' : ''))),
        err,
        h('div', { class: 'row', style: 'margin-top:12px' }, btn));
    }
    if (results) {
      const ids = Object.keys(ev.ratings);
      sec.append(h('div', { class: 'tablewrap', style: 'margin-top:16px' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Kriterium'), ...ids.map(id => h('th', { class: 'num' }, UI.nameSpan(id))), h('th', { class: 'num' }, 'Ø'))),
        h('tbody', {}, ...Logic.CRITERIA.map(k => h('tr', {}, h('td', {}, Logic.CRITERIA_LABEL[k]),
          ...ids.map(id => h('td', { class: 'num' }, ev.ratings[id][k])),
          h('td', { class: 'num' }, h('strong', {}, UI.fmtNum(ev.avg[k], 1)))))))));
      const notes = ids.filter(id => ev.ratings[id].comment);
      if (notes.length) sec.append(h('ul', { class: 'posts', style: 'margin-top:12px' }, ...notes.map(id =>
        h('li', {}, h('p', { class: 'meta' }, UI.nameSpan(id)), h('p', { class: 'body' }, ev.ratings[id].comment)))));
    }
    return sec;
  }

  function commentSection(st, r) {
    const sec = h('section', { class: 'panel' }, h('h3', {}, 'Rückfragen und Antworten'));
    sec.append(comments.length
      ? h('ul', { class: 'posts' }, ...comments.map(c => h('li', {}, h('p', { class: 'meta' }, UI.nameSpan(c.by), ' · ', UI.fmtDateTime(c.at)), h('p', { class: 'body' }, c.text))))
      : h('p', { class: 'note', style: 'margin-bottom:12px' }, 'Noch keine Rückfragen.'));
    if (st.me.id && st.canWrite !== false) {
      const btn = h('button', { class: 'btn', type: 'button' }, 'Senden');
      btn.addEventListener('click', async () => {
        const ta = document.getElementById('cm-text');
        const value = ta.value.trim();
        if (!value) return;
        btn.disabled = true;
        const ok = await Store.addComment(r.id, value);
        btn.disabled = false;
        if (ok != null) { const el = document.getElementById('cm-text'); if (el) { el.value = ''; delete el.dataset.dirty; } }
      });
      sec.append(UI.field('cm-text', 'Neuer Beitrag', h('textarea', { id: 'cm-text', rows: 3, placeholder: 'Rückfrage oder Antwort schreiben' })),
        h('div', { class: 'row', style: 'margin-top:8px' }, btn));
    }
    return sec;
  }

  function adminSection(r) {
    const sec = h('section', { class: 'panel' }, h('h3', {}, 'Administration'));
    const targets = Logic.manualTargets(r.status);
    if (targets.length) {
      sec.append(h('div', { class: 'row' }, ...targets.map(to => {
        const label = to === 'eingereicht' ? (r.status === 'klaerung' ? 'Als geklärt markieren' : 'Reaktivieren') : ACTION_LABEL[to];
        return h('button', { class: to === 'abgelehnt' ? 'btn danger small' : 'btn ghost small', type: 'button', onclick: () => doStatus(r, to, label) }, label);
      })));
    } else {
      sec.append(h('p', { class: 'note' }, r.status === 'eingeplant' ? 'Die Einplanung ändern Sie in der Roadmap.' : 'In diesem Status gibt es keine Aktionen.'));
    }
    if (r.status === 'bewertet') sec.append(h('p', { class: 'hint', style: 'margin-top:8px' }, 'Einplanen in ein Release: in der Roadmap.'));
    const inp = h('input', { type: 'text', inputmode: 'decimal', id: 'adm-points', value: r.effortOverride == null ? '' : String(r.effortOverride), placeholder: 'Standard: gerundeter Ø-Aufwand' });
    const save = h('button', { class: 'btn ghost small', type: 'button' }, 'Speichern');
    save.addEventListener('click', async () => {
      const raw = document.getElementById('adm-points').value.trim();
      const n = raw === '' ? null : Logic.parseNum(raw);
      if (n !== null && (!Number.isFinite(n) || n < 0)) { UI.toast('Bitte eine Zahl ab 0 eingeben oder das Feld leeren.', 'err'); return; }
      const ok = await Store.updateRequest(r.id, { effortOverride: n }, 'Aufwandspunkte gespeichert.');
      if (ok != null) UI.clearDirty('adm-points');
    });
    sec.append(h('div', { style: 'margin-top:16px' }, UI.field('adm-points', 'Aufwandspunkte für die Roadmap',
      h('div', { class: 'row' }, h('div', { style: 'flex:1 1 140px' }, inp), save),
      'Leer lassen, um den gerundeten Ø-Aufwand der Bewertungen zu verwenden.')));
    return sec;
  }
  async function doStatus(r, to, label) {
    const reasonLabel = to === 'klaerung' ? 'Ihre Rückfrage an die einreichende Person' : Logic.needsReason(to) ? 'Begründung (für alle sichtbar)' : null;
    const res = await UI.confirmDialog(`#${r.number} «${r.title}»: ${label}?`, { confirmLabel: label, reasonLabel });
    if (!res.ok) return;
    const ok = await Store.changeStatus(r, to, res.reason || '', {}, `Status geändert: ${Logic.STATUS_LABEL[to]}.`);
    if (ok != null && to === 'klaerung') await Store.addComment(r.id, res.reason);
  }

  return { render, select };
})();
```

- [ ] **Step 2: Build und Sichtprüfung**

Run:
```bash
bash build.sh
bash tests/shot.sh anforderungen admin
bash tests/shot.sh r-q1 admin
bash tests/shot.sh r-q3 gremium
bash tests/shot.sh r-q1 business 400
```
Expected:
- **Liste:** vier Testanforderungen, Score bei #1 und #2 sichtbar, bei #3 für admin ebenfalls (eigene Bewertung), bei #4 «–».
- **Detail #1 (admin):** Kennzahlen mit diesen Werten:
  - Nutzen-Index 4.13: (4,5 + 4 + 3,5 + 4,5) / 4 = 4,125
  - Ø Aufwand 2.00
  - Score 2.06, Einordnung «Quick Win»
  - Dazu die Bewertungstabelle mit zwei Personen-Spalten und ein Statusverlauf mit drei Einträgen.
- **Detail #3 (gremium):** Das Bewertungsformular ist leer, der Hinweis «Die Ergebnisse sehen Sie, sobald Sie selbst bewertet haben.» erscheint, es gibt keine Tabelle.
- **400 px:** einspaltig, ohne horizontales Scrollen.

- [ ] **Step 3: Funktionsprüfung im Browser** (`dist/dev.html?seed=1&role=gremium#r-q3`)

1. Alle fünf Kriterien wählen und speichern: Toast «Bewertung gespeichert.», der Status wechselt auf «Bewertet» (zwei Bewertungen = Mindestanzahl), die Tabelle erscheint.
2. Text ins Rückfragenfeld schreiben, ohne zu senden, dann die Bewertung erneut speichern (löst Neuzeichnen aus): Der Text bleibt erhalten. Mit «Senden» erscheint der Beitrag und das Feld wird leer.
3. Neu laden mit `role=admin` (der Mock beginnt dann wieder mit den Testdaten). Bei #4 «Rückfrage stellen» wählen. Ohne Text bleibt der Dialog offen und zeigt den Fehler. Mit Text wechselt der Status auf «In Klärung», und die Rückfrage erscheint als Beitrag.
4. In derselben Sitzung bei #4 «Angaben bearbeiten» → «Änderungen speichern»: Der Status geht zurück auf «Eingereicht», im Verlauf steht «Angaben ergänzt».
5. Suche «Kampagnen» filtert auf #2. Der Fokus bleibt im Suchfeld.

- [ ] **Step 4: Commit**

```bash
git add src/view-requests.js
git commit -m "feat: Anforderungsliste und Detail mit Bewertung, Rückfragen und Statusaktionen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Ansicht «Auswertung» mit Kennzahlen, Matrix, Rangliste und Verteilungen

**Files:**
- Replace: `src/view-analysis.js`

**Interfaces:**
- Consumes:
  - `Store.evaluation`, `Store.canSeeResults`, `Store.settings`
  - `Logic.countBy`, `Logic.replacementPotential`, `Logic.savingsHoursPerYear`, `Logic.leadTimeDays`, `Logic.average`, `Logic.QUADRANT_LABEL`, `Logic.STATUS_LABEL`
  - `UI.*`, `RequestsView.select`, `App.go`
- Produces: `AnalysisView.render(root, state)`.

Diagrammregeln (nach dem Skill «dataviz»):
- eine einzige Serie mit einer Akzentfarbe und ohne Legende
- Punkte mit 7 px Radius und einem 2 px breiten Ring in der Flächenfarbe
- unaufdringliches Raster, Quadranten als beschriftete Flächen
- Hover-Tooltip über `<title>` auf einer grösseren, unsichtbaren Trefferfläche
- Die Rangliste dient als Tabellenansicht.
- Die Balken sind einfarbig, mit direkter Wertbeschriftung.
- Text verwendet die Text-Tokens, nie die Serienfarbe.

- [ ] **Step 1: `src/view-analysis.js` vollständig ersetzen**

```js
/* Ansicht «Auswertung»: Kennzahlen, Nutzen/Aufwand-Matrix, Rangliste, Verteilungen. */
const AnalysisView = (() => {
  const { h } = UI;
  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...kids) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
    for (const c of kids.flat()) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }
  const openReq = id => { RequestsView.select(id); App.go('anforderungen'); };

  function render(root, st) {
    const set = Store.settings();
    const reqs = st.requests;
    if (!reqs.length) {
      root.append(h('p', { class: 'empty' }, st.loaded.requests || !st.db
        ? 'Noch keine Daten. Sobald Anforderungen eingereicht und bewertet sind, erscheinen hier Matrix, Rangliste und Kennzahlen.'
        : 'Daten werden geladen …'));
      return;
    }
    const rated = reqs.map(r => ({ r, ev: Store.evaluation(r) })).filter(x => x.ev.count > 0 && Store.canSeeResults(x.r));
    const active = reqs.filter(r => r.status !== 'abgelehnt');
    const savings = active.reduce((sum, r) => sum + Logic.savingsHoursPerYear(r.pain, set.weeksPerYear), 0);
    const lead = Logic.average(reqs.map(r => Logic.leadTimeDays(r.statusHistory)));
    const count = s => reqs.filter(r => r.status === s).length;
    root.append(h('div', { class: 'stack' },
      h('div', { class: 'kpis' },
        kpi(UI.fmtNum(reqs.length), 'Anforderungen gesamt'),
        kpi(UI.fmtNum(count('bewertung')), 'in Bewertung'),
        kpi(UI.fmtNum(count('eingeplant')), 'eingeplant'),
        kpi(`${UI.fmtNum(savings)} h`, 'Einsparpotenzial pro Jahr, ohne abgelehnte'),
        kpi(lead == null ? '–' : `${UI.fmtNum(lead, 1)} Tage`, 'Ø Durchlaufzeit bis «Bewertet»')),
      h('section', { class: 'panel' }, h('h2', {}, 'Nutzen/Aufwand-Matrix'),
        rated.length ? matrix(rated) : h('p', { class: 'note' }, 'Noch keine abgeschlossenen Bewertungen.'),
        rated.length ? h('p', { class: 'hint', style: 'margin-top:8px' }, 'Ein Punkt pro Anforderung. Fahren Sie über einen Punkt für Details, ein Klick öffnet die Anforderung.') : null),
      rated.length ? ranking(rated) : null,
      h('div', { class: 'grid2' },
        bars('Nach Status', Logic.countBy(reqs, r => Logic.STATUS_LABEL[r.status])),
        bars('Nach CRM-Bereich', Logic.countBy(reqs, r => r.crmArea)),
        bars('Nach Abteilung', Logic.countBy(reqs, r => r.department)),
        bars('Ablösepotenzial: genannte Systeme', Logic.replacementPotential(active), 'Noch keine ablösbaren Systeme genannt.'))));
  }
  const kpi = (v, l) => h('div', { class: 'kpi' }, h('div', { class: 'v' }, v), h('div', { class: 'l' }, l));

  function matrix(rated) {
    const W = 640, H = 420, m = { l: 52, r: 24, t: 16, b: 52 };
    const x = v => m.l + ((v - 1) / 4) * (W - m.l - m.r);
    const y = v => H - m.b - ((v - 1) / 4) * (H - m.t - m.b);
    const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'Streudiagramm: Nutzen-Index gegen Ø Aufwand je Anforderung. Die gleichen Werte stehen in der Rangliste.' });
    for (let i = 1; i <= 5; i++) {
      g.append(
        svg('line', { class: 'grid', x1: x(i), x2: x(i), y1: y(1), y2: y(5) }),
        svg('line', { class: 'grid', x1: x(1), x2: x(5), y1: y(i), y2: y(i) }),
        svg('text', { x: x(i), y: y(1) + 18, 'text-anchor': 'middle' }, i),
        svg('text', { x: x(1) - 10, y: y(i) + 4, 'text-anchor': 'end' }, i));
    }
    g.append(
      svg('line', { class: 'divider', x1: x(3), x2: x(3), y1: y(1), y2: y(5) }),
      svg('line', { class: 'divider', x1: x(1), x2: x(5), y1: y(3), y2: y(3) }),
      svg('text', { x: (x(1) + x(5)) / 2, y: H - 10, 'text-anchor': 'middle' }, 'Ø Aufwand →'),
      svg('text', { x: 14, y: (y(1) + y(5)) / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${(y(1) + y(5)) / 2})` }, 'Nutzen-Index →'));
    const q = (label, qx, qy, anchor) => svg('text', { class: 'qlabel', x: qx, y: qy, 'text-anchor': anchor }, label);
    g.append(
      q('QUICK WINS', x(1) + 8, y(5) + 16, 'start'), q('GROSSE VORHABEN', x(5) - 8, y(5) + 16, 'end'),
      q('LÜCKENFÜLLER', x(1) + 8, y(1) - 8, 'start'), q('VERMEIDEN', x(5) - 8, y(1) - 8, 'end'));
    const seen = new Map();
    const withLabels = rated.length <= 20;
    for (const { r, ev } of rated) {
      const key = ev.effort.toFixed(1) + '|' + ev.benefit.toFixed(1);
      const k = seen.get(key) || 0;
      seen.set(key, k + 1);
      const cx = x(ev.effort) + k * 14, cy = y(ev.benefit);
      const pt = svg('g', { class: 'pt', tabindex: 0, role: 'link', 'aria-label': `#${r.number} ${r.title}: Nutzen ${UI.fmtNum(ev.benefit, 2)}, Aufwand ${UI.fmtNum(ev.effort, 2)}, Score ${UI.fmtNum(ev.score, 2)}` },
        svg('title', {}, `#${r.number} ${r.title}\nNutzen ${UI.fmtNum(ev.benefit, 2)} · Aufwand ${UI.fmtNum(ev.effort, 2)} · Score ${UI.fmtNum(ev.score, 2)}`),
        svg('circle', { class: 'hit', cx, cy, r: 16 }),
        svg('circle', { cx, cy, r: 7 }),
        withLabels ? svg('text', { x: cx + 11, y: cy + 4 }, '#' + r.number) : null);
      pt.addEventListener('click', () => openReq(r.id));
      pt.addEventListener('keydown', e => { if (e.key === 'Enter') openReq(r.id); });
      g.append(pt);
    }
    return g;
  }

  function ranking(rated) {
    const rows = rated.slice().sort((a, b) => (b.ev.score - a.ev.score) || (a.r.number - b.r.number));
    const heads = [['Rang', 'num'], ['Nr.', 'num'], ['Titel'], ['Nutzen-Index', 'num'], ['Ø Aufwand', 'num'], ['Score', 'num'], ['Einordnung'], ['Status']];
    return h('section', { class: 'panel' }, h('h2', {}, 'Rangliste nach Score'),
      h('div', { class: 'tablewrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ...heads.map(([t, c]) => h('th', { class: c || null }, t)))),
        h('tbody', {}, ...rows.map(({ r, ev }, i) => h('tr', { class: 'click', tabindex: 0, onclick: () => openReq(r.id), onkeydown: e => { if (e.key === 'Enter') openReq(r.id); } },
          h('td', { class: 'num' }, i + 1), h('td', { class: 'num' }, '#' + r.number), h('td', {}, r.title),
          h('td', { class: 'num' }, UI.fmtNum(ev.benefit, 2)), h('td', { class: 'num' }, UI.fmtNum(ev.effort, 2)),
          h('td', { class: 'num' }, h('strong', {}, UI.fmtNum(ev.score, 2))), h('td', {}, Logic.QUADRANT_LABEL[ev.quadrant]), h('td', {}, UI.pill(r.status))))))));
  }

  function bars(title, data, emptyText = 'Keine Daten.') {
    const max = Math.max(1, ...data.map(d => d.count));
    return h('section', { class: 'panel' }, h('h2', {}, title),
      data.length
        ? h('ul', { class: 'bars' }, ...data.map(d => h('li', {},
            h('span', { class: 'name' }, d.key),
            h('span', { class: 'track' }, h('span', { class: 'fill', style: `width:${(d.count / max) * 100}%` })),
            h('span', { class: 'val' }, d.count))))
        : h('p', { class: 'note' }, emptyText));
  }

  return { render };
})();
```

- [ ] **Step 2: Build und Sichtprüfung**

Run:
```bash
bash build.sh
bash tests/shot.sh auswertung admin
bash tests/shot.sh auswertung admin 400
bash tests/shot.sh auswertung admin 1280 dark
```
Expected:
- **Kennzahlen:** 4 gesamt, 1 in Bewertung, 1 eingeplant, Einsparpotenzial «1’840 h» (4 × 2 × 5 × 46), Ø Durchlaufzeit «5.5 Tage». Herleitung: #1 dauert 5 Tage, #2 dauert 6 Tage, der Durchschnitt ist 5,5.
- **Matrix** mit drei Punkten:
  - #1 bei Aufwand 2, Nutzen 4,125
  - #2 bei Aufwand 4, Nutzen 2,875
  - #3 bei Aufwand 3, Nutzen 3,75. Er ist sichtbar, weil die Administration ihn bewertet hat.
- Die Rangliste beginnt mit #1.
- Es gibt vier Balkenlisten.
- Bei 400 px skaliert die Matrix, die Seite hat kein horizontales Scrollen.
- Im dunklen Modus sind Raster und Beschriftung lesbar.

- [ ] **Step 3: Commit**

```bash
git add src/view-analysis.js
git commit -m "feat: Auswertung mit Matrix, Rangliste und Kennzahlen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Ansicht «Roadmap» mit Backlog, Releases, Drag & Drop und Vorschlag

**Files:**
- Replace: `src/view-roadmap.js`

**Interfaces:**
- Consumes:
  - `Store.evaluation`, `Store.points`, `Store.assign`, `Store.applySuggestion`, `Store.deliverRelease`
  - `Logic.suggestRoadmap`, `Logic.releaseUsage`, `Logic.QUADRANT_LABEL`
  - `UI.*`, `RequestsView.select`, `App.go`, `App.render`
- Produces: `RoadmapView.render(root, state)`.

- [ ] **Step 1: `src/view-roadmap.js` vollständig ersetzen**

```js
/* Ansicht «Roadmap»: bewertete Anforderungen den Releases zuordnen. */
const RoadmapView = (() => {
  const { h } = UI;
  let proposal = null;
  const openReq = id => { RequestsView.select(id); App.go('anforderungen'); };

  function render(root, st) {
    const admin = st.isAdmin;
    const all = st.requests.map(r => ({ r, ev: Store.evaluation(r), points: Store.points(r) }));
    const backlog = all.filter(x => x.r.status === 'bewertet')
      .sort((a, b) => ((b.ev.score ?? -1) - (a.ev.score ?? -1)) || (a.r.number - b.r.number));
    const planned = all.filter(x => x.r.releaseId);
    const openRel = st.releases.filter(x => x.status === 'offen');
    const doneRel = st.releases.filter(x => x.status === 'ausgeliefert');
    const usage = id => Logic.releaseUsage(id, planned.map(x => ({ releaseId: x.r.releaseId, points: x.points })));

    const suggest = () => {
      proposal = Logic.suggestRoadmap(
        backlog.map(x => ({ id: x.r.id, number: x.r.number, score: x.ev.score ?? 0, points: x.points })),
        openRel.map(rel => ({ ...rel, used: usage(rel.id) })));
      App.render();
    };
    root.append(h('div', { class: 'spread' },
      h('div', {}, h('h2', {}, 'Roadmap nach Releases'),
        h('p', { class: 'note' }, admin ? 'Karten per Drag & Drop oder über die Auswahl auf der Karte einem Release zuordnen.' : 'Geplante Umsetzung der bewerteten Anforderungen.')),
      admin ? h('button', { class: 'btn', type: 'button', disabled: !backlog.length || !openRel.length, onclick: suggest }, 'Automatisch vorschlagen') : null));
    if (proposal) root.append(proposalPanel(st, proposal));
    if (!st.releases.length) {
      root.append(h('p', { class: 'note', style: 'margin-bottom:12px' }, admin
        ? 'Es gibt noch keine Releases. Legen Sie unter «Einstellungen» das erste Release mit seiner Kapazität an.'
        : 'Es sind noch keine Releases geplant.'));
    }
    root.append(h('div', { class: 'board' },
      column(st, { id: '', name: 'Backlog' }, backlog, 0, admin, openRel),
      ...openRel.map(rel => column(st, rel, planned.filter(x => x.r.releaseId === rel.id), usage(rel.id), admin, openRel))));
    if (doneRel.length) {
      root.append(h('details', { class: 'panel', style: 'margin-top:16px' },
        h('summary', {}, `Ausgelieferte Releases (${doneRel.length})`),
        ...doneRel.map(rel => h('div', { style: 'margin-top:12px' }, h('h3', {}, rel.name),
          h('ul', {}, ...planned.filter(x => x.r.releaseId === rel.id).map(x => h('li', {}, `#${x.r.number} ${x.r.title}`)))))));
    }
  }

  function column(st, rel, list, used, admin, openRel) {
    const isBacklog = !rel.id;
    const over = !isBacklog && used > rel.capacity;
    const col = h('section', { class: 'col', 'aria-label': rel.name });
    const head = h('div', { class: 'col-head' }, h('h3', {}, h('span', {}, rel.name), h('span', { class: 'load' }, isBacklog ? String(list.length) : '')));
    if (isBacklog) {
      head.append(h('div', { class: 'load' }, 'Bewertet, noch nicht eingeplant'));
    } else {
      const pct = rel.capacity > 0 ? Math.min(100, (used / rel.capacity) * 100) : 100;
      head.append(
        h('div', { class: 'meter' + (over ? ' over' : '') }, h('span', { style: `width:${pct}%` })),
        h('div', { class: 'load' + (over ? ' overbooked' : '') }, over
          ? `Überbucht: ${UI.fmtNum(used)} von ${UI.fmtNum(rel.capacity)} Punkten`
          : `${UI.fmtNum(used)} von ${UI.fmtNum(rel.capacity)} Punkten verplant`),
        admin ? h('div', {}, h('button', { class: 'btn ghost small', type: 'button', disabled: !list.length, onclick: () => deliver(rel) }, 'Als ausgeliefert markieren')) : null);
    }
    col.append(head);
    if (!list.length) col.append(h('p', { class: 'note', style: 'font-size:var(--step--1)' }, isBacklog ? 'Keine bewerteten Anforderungen offen.' : 'Noch nichts eingeplant.'));
    for (const x of list) col.append(card(x, admin, openRel));
    if (admin) {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('over');
        const id = e.dataTransfer.getData('text/plain');
        const r = st.requests.find(q => q.id === id);
        if (r && (r.releaseId || '') !== rel.id) Store.assign(r, rel.id || null);
      });
    }
    return col;
  }

  function card(x, admin, openRel) {
    const { r, ev, points } = x;
    const c = h('article', { class: 'card', draggable: admin ? 'true' : null },
      h('button', { class: 'linkbtn t', type: 'button', onclick: () => openReq(r.id) }, `#${r.number} ${r.title}`),
      h('div', { class: 'm' },
        h('span', {}, 'Score ', h('strong', {}, ev.count ? UI.fmtNum(ev.score, 2) : '–')),
        h('span', {}, `${points ?? '–'} Punkte`),
        ev.quadrant ? h('span', { class: 'chip' }, Logic.QUADRANT_LABEL[ev.quadrant]) : null));
    if (admin) {
      c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; });
      c.append(UI.select('as-' + r.id, [['', 'Backlog'], ...openRel.map(rel => [rel.id, rel.name])], r.releaseId || '',
        { label: `Release für #${r.number}`, onchange: e => Store.assign(r, e.target.value || null) }));
    }
    return c;
  }

  function proposalPanel(st, pairs) {
    const relName = Object.fromEntries(st.releases.map(x => [x.id, x.name]));
    const req = Object.fromEntries(st.requests.map(x => [x.id, x]));
    return h('section', { class: 'panel proposal' }, h('h3', {}, 'Vorschlag'),
      pairs.length
        ? h('ul', {}, ...pairs.map(p => h('li', {}, `#${req[p.requestId] ? req[p.requestId].number : '?'} ${req[p.requestId] ? req[p.requestId].title : ''} → ${relName[p.releaseId]}`)))
        : h('p', { class: 'note' }, 'Keine Anforderung passt in die freie Kapazität der offenen Releases.'),
      h('div', { class: 'row', style: 'margin-top:12px' },
        pairs.length ? h('button', { class: 'btn', type: 'button', onclick: async () => { const p = proposal; proposal = null; App.render(); await Store.applySuggestion(p); } }, 'Vorschlag übernehmen') : null,
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { proposal = null; App.render(); } }, 'Verwerfen')));
  }

  async function deliver(rel) {
    const res = await UI.confirmDialog(`Release ${rel.name} als ausgeliefert markieren? Alle eingeplanten Anforderungen erhalten den Status «Umgesetzt».`, { confirmLabel: 'Als ausgeliefert markieren' });
    if (res.ok) await Store.deliverRelease(rel);
  }

  return { render };
})();
```

- [ ] **Step 2: Build und Sichtprüfung**

Run:
```bash
bash build.sh
bash tests/shot.sh roadmap admin
bash tests/shot.sh roadmap business 400
```
Expected:
- Spalten: Backlog mit #1 (Score 2,06, 2 Punkte, Quick Win), 2027.1 mit #2 und «4 von 6 Punkten verplant», 2027.2 leer.
- Als `business` gibt es keinen Vorschlagsknopf und keine Auswahlfelder.
- Bei 400 px scrollen die Spalten horizontal innerhalb des Boards, die Seite selbst scrollt nicht.

- [ ] **Step 3: Funktionsprüfung im Browser** (`dist/dev.html?seed=1&role=admin#roadmap`)

1. «Automatisch vorschlagen» zeigt den Vorschlag «#1 … → 2027.1» (2 Punkte passen in die verbleibenden 2). «Vorschlag übernehmen» verschiebt #1 nach 2027.1, die Anzeige lautet «6 von 6».
2. #2 per Auswahl nach 2027.2 setzen: Die Auslastung beider Spalten wird aktualisiert.
3. Bei #1 im Detail die Aufwandspunkte auf 9 setzen: In der Roadmap steht bei 2027.1 «Überbucht» in Rot.
4. #1 in den Backlog ziehen: Der Status ist wieder «Bewertet».
5. «Als ausgeliefert markieren» bei 2027.2 → bestätigen: Die Spalte verschwindet und erscheint unter «Ausgelieferte Releases», #2 hat den Status «Umgesetzt».

- [ ] **Step 4: Commit**

```bash
git add src/view-roadmap.js
git commit -m "feat: Release-Roadmap mit Kapazität, Drag & Drop und Vorschlag" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Veröffentlichen und Funktionsprüfung im echten Artifact

**Files:**
- Publish: `dist/anforderungsportal.html`

- [ ] **Step 1: Gesamtprüfung lokal**

Run: `bash tests/run.sh && bash build.sh`
Expected: `SUMMARY logic 38/38` und `SUMMARY 4/4`, Build ohne Fehler, Grösse deutlich unter 16 MB.

- [ ] **Step 2: Vor dem Veröffentlichen die Skills laden**

Den Skill `artifact-capabilities` laden. Die Datenbankregeln mit dem aktuellen Vertrag abgleichen: Regeln an einem `{self}`-Präfix brauchen sowohl `read` als auch `write`.

- [ ] **Step 3: Veröffentlichen**

Artifact-Tool, `action: "publish"`:
- `file_path`: `D:\Projekte\Form\dist\anforderungsportal.html`
- `icon`: `"clipboard"`
- `description`: «Anforderungen an das CRM einreichen, im Gremium bewerten und in Releases einplanen.»
- `capabilities`:
```json
{
  "db": { "rules": [
    { "path": "config", "write": "admin" },
    { "path": "releases", "write": "admin" },
    { "path": "ratings", "read": "view", "write": "owner" },
    { "path": "ratings/{self}", "write": "interact" }
  ] },
  "user": { "scopes": ["profile"] },
  "downloads": true
}
```

- [ ] **Step 4: Funktionsprüfung der Datenbank** (eine Runde)

1. Die Tools `ArtifactData` über ToolSearch laden.
2. Mit `ArtifactData` ein Probedokument `requests/probe` schreiben (`{"title":"Probe"}`). Danach `list` von `requests`: Es muss erscheinen.
3. `list` von `ratings` mit tieferer Stufe (`as_level: "interact"`): Die Abfrage muss gelingen (Lesen erlaubt).
4. `requests/probe` löschen und dabei die zurückgegebene `version` als `if_version` übergeben.
5. Keine weiteren Testdaten anlegen. Die Einrichtung macht die Person in der Seite selbst.

- [ ] **Step 5: Übergabe an die Person**

In der Antwort nennen:
- den Link zum Artifact
- was geprüft wurde: Tests der Fachlogik, Sichtprüfungen mit dem Mock, Datenbankregeln per Probe
- was nicht geprüft werden konnte: echte Personensuche, Download-Dialog und Verhalten mit mehreren echten Personen

Dazu die nächsten Schritte:
1. Seite öffnen, unter «Einstellungen» die Wertelisten anpassen und «Einrichtung speichern».
2. Das erste Release mit Kapazität anlegen.
3. Gremium-Mitglieder hinzufügen.
4. Das Portal teilen. Einreichende und das Gremium brauchen die Freigabe «Contributor», wer nur mitlesen soll, die Freigabe «Viewer».

---

## Selbstprüfung (beim Schreiben erledigt)

| Spec-Abschnitt | Abgedeckt durch |
|---|---|
| 2 Rollen | Task 6 (Store, main), Task 7 (Gremium) |
| 3 Prozess und Status | Task 2, Task 9 |
| 4 Einreichungsformular | Task 4, Task 8 |
| 5 Bewertung | Task 3, Task 9 |
| 6.1 Einreichen | Task 8 |
| 6.2 Anforderungen | Task 9 |
| 6.3 Auswertung | Task 5, Task 10 |
| 6.4 Roadmap | Task 5, Task 11 |
| 6.5 Einstellungen | Task 7 |
| 7 Datenmodell | Task 6 |
| 8 Berechtigungen | Task 12 |
| 9 Fehlerfälle | Task 6 (`errorText`, Banner), Task 8 (gesperrtes Formular), Task 7 (Einrichtungsassistent), Task 9 (fehlende Anforderung) |
| 10 Tests | Task 2–6, Sichtprüfungen in Task 7–11, Task 12 |
