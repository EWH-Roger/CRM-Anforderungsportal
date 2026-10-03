/* Klicktest Akzeptanzkriterien, Uneinigkeit, Reserve und Datensicherung (Testdaten, Rolle admin, Start #r-q1). */
const { $, $$, until, setVal, clickText, byText, expect } = E2E;
const req = id => Store.state.requests.find(r => r.id === id);
E2E.run([
  ['Product Owner erfasst Akzeptanzkriterien, sie erscheinen als Checkliste', async () => {
    await until(() => $('#adm-ac'), 'Feld Akzeptanzkriterien');
    setVal('#adm-ac', 'Offerte ist im CRM sichtbar\nPreise kommen aus der Preisliste');
    clickText('button', 'Kriterien speichern');
    await until(() => req('q1').acceptanceCriteria, 'gespeichert');
    await until(() => $$('main .acceptance li').length === 2, 'Checkliste mit 2 Punkten');
  }],
  ['Grosse Uneinigkeit im Release Board wird angezeigt', async () => {
    const doc = (await Store.state.db.doc('ratings/u_gremium').get()).data();
    await Store.state.db.doc('ratings/u_gremium').update({ byRequest: { q1: { ...doc.byRequest.q1, aufwand: 5 } } });
    await until(() => $('main .disagree'), 'Hinweis Uneinigkeit');
    expect($('main .disagree').textContent.includes('Aufwand'), $('main .disagree').textContent);
  }],
  ['Vorschlag lässt die Reserve frei', async () => {
    await Store.saveSettings({ ...Store.settings(), reservePercent: 20 });
    await Store.state.db.doc('ratings/u_gremium').update({ byRequest: { q1: { nutzen: 4, betroffene: 4, dringlichkeit: 3, fit: 5, aufwand: 2, comment: '' } } });
    await until(() => Store.points(req('q1')) === 2, 'Bewertung aktualisiert');
    App.go('roadmap');
    clickText('button', 'Automatisch vorschlagen');
    await until(() => $('.proposal li'), 'Vorschlag');
    expect($('.proposal li').textContent.includes('→ 2027.2'), 'Vorschlag: ' + $('.proposal li').textContent);
    expect($('.proposal').textContent.includes('20 %'), 'Reserve nicht erwähnt: ' + $('.proposal').textContent);
  }],
  ['Hinweis zur Datensicherung verschwindet nach dem Export', async () => {
    await Store.saveSettings({ ...Store.settings(), lastExportAt: null });
    await until(() => !$('#banner').hidden && $('#banner').textContent.includes('Datensicherung'), 'Hinweis Datensicherung');
    await Store.exportCsv();
    await until(() => $('#banner').hidden, 'Hinweis weg');
    App.go('einstellungen');
    await until(() => byText('main p', 'Letzter Export'), 'Letzter Export angezeigt');
  }],
]);
