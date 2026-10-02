/* Tests für src/logic.js */
test('Logic ist geladen', () => ok(typeof Logic === 'object', 'Logic fehlt'));

// ---- Status ----
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
  let msg = '';
  try { Logic.withStatus({ status: 'eingereicht', statusHistory: [] }, 'umgesetzt', 'u', 't', ''); } catch (e) { msg = e.message; }
  ok(msg.includes('nicht erlaubt'), 'Meldung: ' + msg);
});
test('withStatus: zurück in den Backlog leert das Release', () => {
  const p = Logic.withStatus({ status: 'eingeplant', releaseId: 'r1', statusHistory: [] }, 'bewertet', 'u', 't', '');
  eq(p.releaseId, null);
});
test('withStatus: Reaktivieren löscht die Begründung', () => {
  const p = Logic.withStatus({ status: 'zurueckgestellt', decisionReason: 'x', statusHistory: [] }, 'eingereicht', 'u', 't', '');
  eq(p.decisionReason, null);
});

// ---- Bewertung ----
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

// ---- Einreichung ----
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
