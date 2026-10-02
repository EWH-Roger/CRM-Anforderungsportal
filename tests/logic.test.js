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
