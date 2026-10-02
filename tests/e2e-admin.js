/* Klicktest Statusaktionen, Bearbeiten und Suche (Testdaten, Rolle admin, Start #r-q4). */
const { $, $$, until, setVal, click, clickText, byText, expect } = E2E;
const q4 = () => Store.state.requests.find(r => r.id === 'q4');
E2E.run([
  ['Rückfrage verlangt Text und setzt «In Klärung»', async () => {
    await until(() => byText('button', 'Rückfrage stellen'), 'Knopf');
    clickText('button', 'Rückfrage stellen');
    await until(() => $('#confirm').open, 'Dialog offen');
    click('#confirm-ok');
    expect($('#confirm').open && !$('#confirm-err').hidden, 'Dialog hätte offen bleiben müssen');
    setVal('#confirm-reason', 'Welche Felder fehlen im Monatsreport?');
    click('#confirm-ok');
    await until(() => q4().status === 'klaerung', 'Status klaerung');
    await until(() => $$('main .posts li').some(li => li.textContent.includes('Monatsreport?')), 'Rückfrage als Beitrag');
  }],
  ['Bearbeiten in Klärung setzt zurück auf «Eingereicht»', async () => {
    clickText('button', 'Angaben bearbeiten');
    await until(() => $('#f-title') && $('#f-title').value === 'Test: Monatsreport ohne Excel', 'Formular mit Daten');
    clickText('.stepper button', 'Systeme');
    click('#f-submit');
    await until(() => byText('main h2', 'Änderungen an #4 gespeichert'), 'Bestätigung');
    const h = q4().statusHistory;
    expect(q4().status === 'eingereicht' && h[h.length - 1].comment === 'Angaben ergänzt', JSON.stringify(h[h.length - 1]));
  }],
  ['Suche filtert und behält den Fokus', async () => {
    RequestsView.select(null); App.go('anforderungen');
    await until(() => $('#flt-q'), 'Liste');
    $('#flt-q').focus();
    setVal('#flt-q', 'Kampagnen');
    await until(() => $$('main tbody tr').length === 1, 'eine Zeile');
    expect($('main tbody tr').textContent.includes('#2'), $('main tbody tr').textContent);
    expect(document.activeElement.id === 'flt-q', 'Fokus: ' + document.activeElement.id);
  }],
]);
