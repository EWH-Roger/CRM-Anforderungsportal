/* Befunde aus dem Review: Product Owner (Testdaten, Rolle admin, Start #r-q3). */
const { $, $$, until, setVal, click, clickText, byText, toast, expect, wait } = E2E;
const req = id => Store.state.requests.find(r => r.id === id);
E2E.run([
  ['Hängt eine Anforderung in «In Bewertung», kann der Product Owner sie als bewertet markieren', async () => {
    await Store.saveSettings({ ...Store.settings(), minRatings: 1 });
    await until(() => byText('button', 'Als bewertet markieren'), 'Knopf «Als bewertet markieren»');
    clickText('button', 'Als bewertet markieren');
    await until(() => $('#confirm').open, 'Dialog');
    click('#confirm-ok');
    await until(() => req('q3').status === 'bewertet', 'Status bewertet');
  }],
  ['Links ohne http(s) werden nicht als Link angezeigt', async () => {
    await Store.state.db.doc('requests/q4').update({ links: ['javascript:alert(1)', 'https://ok.example/doc'] });
    RequestsView.select('q4'); App.go('anforderungen');
    await until(() => byText('main h2', 'Monatsreport') && $('main').textContent.includes('javascript:alert(1)'), 'Detail #4 mit Links');
    expect(!$('main a[href^="javascript"]'), 'javascript:-Link vorhanden');
    expect($('main a[href="https://ok.example/doc"]'), 'https-Link fehlt');
    expect($('main').textContent.includes('javascript:alert(1)'), 'Text fehlt');
  }],
  ['Statuswechsel mit veraltetem Objekt behält den Verlauf', async () => {
    const stale = req('q4');
    await Store.changeStatus(req('q4'), 'klaerung', 'Frage A');
    await until(() => req('q4').status === 'klaerung', 'klaerung');
    await Store.changeStatus(stale, 'abgelehnt', 'Grund B');
    await until(() => req('q4').status === 'abgelehnt', 'abgelehnt');
    const st = req('q4').statusHistory.map(h => h.status);
    expect(st.join(',') === 'eingereicht,klaerung,abgelehnt', st.join(','));
  }],
  ['Bearbeiten wird verweigert, wenn die Anforderung inzwischen in Bewertung ist', async () => {
    const res = await Store.createRequest({
      title: 'Test: Bearbeitungsschutz', department: 'Verkauf', crmArea: 'Verträge', useCase: '',
      pain: { situation: 'x'.repeat(90), frequency: 'täglich', hoursPerWeek: 1, persons: 2, consequences: [] },
      gain: { department: 'y'.repeat(60), company: '', successCriterion: 'Kriterium', deadline: null, deadlineReason: '' },
      systems: { affected: [], replaceable: [] }, links: [],
    });
    await until(() => req(res.id), 'neue Anforderung');
    SubmitView.edit(req(res.id)); App.go('einreichen');
    await until(() => $('#f-title') && $('#f-title').value === 'Test: Bearbeitungsschutz', 'Formular');
    setVal('#f-title', 'Test: Überschrieben');
    await Store.changeStatus(req(res.id), 'bewertung', '');
    await until(() => req(res.id).status === 'bewertung', 'bewertung');
    clickText('.stepper button', 'Systeme');
    click('#f-submit');
    await wait(400);
    expect(req(res.id).title === 'Test: Bearbeitungsschutz', 'Titel überschrieben: ' + req(res.id).title);
  }],
]);
