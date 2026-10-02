/* Klicktest Roadmap (Testdaten, Rolle admin). */
const { $, $$, until, setVal, click, clickText, byText, expect } = E2E;
const req = id => Store.state.requests.find(r => r.id === id);
const col = name => $$('.board .col').find(c => c.querySelector('h3 span').textContent === name);
E2E.run([
  ['Vorschlag plant #1 in 2027.1 ein', async () => {
    clickText('button', 'Automatisch vorschlagen');
    await until(() => byText('.proposal li', '→ 2027.1'), 'Vorschlag');
    expect($$('.proposal li').length === 1 && $('.proposal li').textContent.startsWith('#1 '), $('.proposal').textContent);
    clickText('button', 'Vorschlag übernehmen');
    await until(() => req('q1').releaseId === 'r1' && req('q1').status === 'eingeplant', '#1 eingeplant');
    await until(() => col('2027.1') && col('2027.1').textContent.includes('6 von 6 Punkten verplant'), 'Auslastung 6 von 6');
  }],
  ['Auswahl auf der Karte verschiebt #2 nach 2027.2', async () => {
    setVal('#as-q2', 'r2');
    await until(() => req('q2').releaseId === 'r2', '#2 in 2027.2');
    await until(() => col('2027.2').textContent.includes('4 von 6'), 'Auslastung 2027.2');
  }],
  ['Höhere Aufwandspunkte zeigen Überbuchung', async () => {
    RequestsView.select('q1'); App.go('anforderungen');
    await until(() => $('#adm-points'), 'Detail #1');
    setVal('#adm-points', '9');
    clickText('button', 'Speichern');
    await until(() => req('q1').effortOverride === 9, 'Override gespeichert');
    App.go('roadmap');
    await until(() => col('2027.1') && col('2027.1').querySelector('.overbooked'), 'Überbucht-Hinweis');
    expect(col('2027.1').textContent.includes('Überbucht: 9 von 6'), col('2027.1').textContent);
  }],
  ['Drag & Drop in den Backlog setzt #1 auf «Bewertet»', async () => {
    const card = col('2027.1').querySelector('.card');
    const dt = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    col('Backlog').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await until(() => req('q1').status === 'bewertet' && req('q1').releaseId === null, '#1 zurück im Backlog');
  }],
  ['Release ausliefern setzt #2 auf «Umgesetzt»', async () => {
    click(col('2027.2').querySelector('.col-head button'));
    await until(() => $('#confirm').open, 'Dialog');
    click('#confirm-ok');
    await until(() => req('q2').status === 'umgesetzt', '#2 umgesetzt');
    await until(() => byText('summary', 'Ausgelieferte Releases (1)'), 'Abschnitt ausgeliefert');
    expect(!col('2027.2'), 'Spalte 2027.2 noch sichtbar');
  }],
]);
