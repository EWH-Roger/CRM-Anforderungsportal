/* Klicktest Einreichen (Testdaten, Rolle business). */
const { $, $$, until, setVal, check, click, clickText, byText, expect } = E2E;
const visibleErr = id => { const p = $('#' + id + '-err'); return p && !p.hidden; };
E2E.run([
  ['Weiter bei leerem Schritt 1 zeigt drei Fehler', async () => {
    click('#f-next');
    expect(visibleErr('f-title') && visibleErr('f-department') && visibleErr('f-crmArea'), 'Fehler fehlen');
    expect(document.activeElement.id === 'f-title', 'Fokus: ' + document.activeElement.id);
  }],
  ['Schritt 2 akzeptiert Dezimalkomma, Zähler läuft mit', async () => {
    setVal('#f-title', 'Offerten direkt aus dem CRM erstellen');
    setVal('#f-department', 'Verkauf'); setVal('#f-crmArea', 'Verträge');
    click('#f-next');
    expect(!$('fieldset[data-step="1"]').hidden, 'Schritt 2 nicht sichtbar');
    setVal('#f-situation', 'Offerten entstehen in Word, die Preise werden von Hand aus Excel übertragen. Dabei passieren Fehler.');
    expect($('#f-situation-count').textContent.startsWith($('#f-situation').value.length + ' Zeichen'), $('#f-situation-count').textContent);
    setVal('#f-frequency', 'täglich'); setVal('#f-hours', '1,5'); setVal('#f-persons', '6');
    click('#f-next');
    expect(!visibleErr('f-hours') && !visibleErr('f-persons'), 'Zahlenfehler');
    expect(!$('fieldset[data-step="2"]').hidden, 'Schritt 3 nicht sichtbar');
  }],
  ['Eingaben überleben einen Reiterwechsel', async () => {
    App.go('roadmap');
    await until(() => !$('#submit-form'), 'Roadmap sichtbar');
    App.go('einreichen');
    await until(() => $('#f-title'), 'Formular zurück');
    expect($('#f-title').value === 'Offerten direkt aus dem CRM erstellen', 'Titel: ' + $('#f-title').value);
    expect($('#f-hours').value === '1,5', 'Stunden: ' + $('#f-hours').value);
  }],
  ['Vollständig ausfüllen und einreichen', async () => {
    setVal('#f-gainDept', 'Pro Offerte rund 20 Minuten weniger Aufwand und keine Übertragungsfehler mehr.');
    setVal('#f-success', 'Durchlaufzeit einer Offerte von 5 auf 2 Arbeitstage');
    clickText('.stepper button', 'Systeme');
    check($$('input[data-group="sys"]')[0]);
    setVal('#f-rep-sys-0', 'Excel-Preisliste'); setVal('#f-rep-purpose-0', 'Preise je Produkt');
    expect(/Vollständigkeit (8|9)\d %/.test($('#q-label').textContent), $('#q-label').textContent);
    click('#f-submit');
    await until(() => byText('main h2', 'Anforderung #5 eingereicht'), 'Bestätigung');
    const r = Store.state.requests.find(x => x.number === 5);
    expect(r && r.pain.hoursPerWeek === 1.5 && r.pain.persons === 6 && r.status === 'eingereicht', JSON.stringify(r && r.pain));
    expect(r.systems.affected[0] === 'Excel' && r.systems.replaceable[0].system === 'Excel-Preisliste', JSON.stringify(r.systems));
  }],
]);
