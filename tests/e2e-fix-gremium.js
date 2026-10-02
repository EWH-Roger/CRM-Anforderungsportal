/* Befunde aus dem Review: Release Board (Testdaten, Rolle gremium, Start #r-q3). */
const { $, $$, until, setVal, clickText, toast, expect, wait } = E2E;
E2E.run([
  ['Erste Bewertung ohne geladenen eigenen Snapshot löscht frühere Bewertungen nicht', async () => {
    await until(() => $('#rt-nutzen'), 'Formular');
    delete Store.state.ratings.u_gremium; // simuliert einen noch unvollständigen Snapshot
    for (const k of ['nutzen', 'betroffene', 'dringlichkeit', 'fit', 'aufwand']) setVal('#rt-' + k, '3');
    clickText('button', 'Bewertung speichern');
    await until(() => toast().includes('Bewertung gespeichert.'), 'Toast');
    const doc = (await Store.state.db.doc('ratings/u_gremium').get()).data();
    expect(doc.byRequest.q1 && doc.byRequest.q2 && doc.byRequest.q3, 'Bewertungen: ' + Object.keys(doc.byRequest).join(','));
  }],
  ['Ohne eigene Bewertung bleiben Ergebnisse auch im Status «Bewertet» verborgen', async () => {
    const doc = (await Store.state.db.doc('ratings/u_gremium').get()).data();
    const { q1, ...rest } = doc.byRequest;
    await Store.state.db.doc('ratings/u_gremium').set({ byRequest: rest });
    RequestsView.select('q1'); App.go('anforderungen');
    await until(() => $('#rt-nutzen') && $('main h2') && $('main h2').textContent.includes('Offerten'), 'Detail #1');
    await wait(200);
    expect(!$('main table'), 'Ergebnistabelle sichtbar');
    RequestsView.select(null); App.go('anforderungen');
    await until(() => $$('main tbody tr').length, 'Liste');
    const row = $$('main tbody tr').find(tr => tr.textContent.includes('#1'));
    expect(row.children[5].textContent === '–', 'Score in der Liste: ' + row.children[5].textContent);
    App.go('roadmap');
    await until(() => $('.board'), 'Roadmap');
    const card = $$('.card').find(c => c.textContent.includes('#1 '));
    expect(card && card.textContent.includes('Score –'), 'Score auf Roadmap: ' + (card && card.textContent));
  }],
]);
