/* Klicktest Einstellungen (ohne Testdaten, Rolle admin). */
const { $, $$, until, setVal, click, clickText, byText, toast, expect } = E2E;
E2E.run([
  ['Einrichtung wird angeboten und gespeichert', async () => {
    await until(() => byText('main h2', 'Portal einrichten'), 'Portal einrichten');
    clickText('button', 'Einrichtung speichern');
    await until(() => toast().includes('Einstellungen gespeichert.'), 'Toast');
    await until(() => byText('main h2', 'Gremium'), 'Panel Gremium');
  }],
  ['Gewicht 0,7 wird abgelehnt', async () => {
    setVal('#set-w-nutzen', '0,7');
    clickText('button', 'Einstellungen speichern');
    await until(() => !$('#set-err').hidden, 'Fehlermeldung');
    expect($('#set-err').textContent.includes('Schritten von 0,5'), $('#set-err').textContent);
    setVal('#set-w-nutzen', '1');
  }],
  ['Release anlegen leert die Neu-Zeile', async () => {
    setVal('#rel-name-new', '2027.1'); setVal('#rel-cap-new', '20');
    clickText('button', 'Anlegen');
    await until(() => $$('input[id^="rel-name-"]').some(i => i.id !== 'rel-name-new' && i.value === '2027.1'), 'neue Release-Zeile');
    await until(() => $('#rel-name-new').value === '', 'Neu-Zeile leer');
  }],
  ['Person über die Suche ins Gremium aufnehmen', async () => {
    setVal('#cm-search', 'Gremium');
    await until(() => byText('#cm-results li', 'Test Gremium'), 'Suchtreffer');
    click(byText('#cm-results li', 'Test Gremium').querySelector('button'));
    await until(() => Store.settings().committee.includes('u_gremium'), 'Mitglied gespeichert');
    await until(() => $$('main .posts li').some(li => li.textContent.includes('Test Gremium')), 'Liste zeigt Mitglied');
  }],
]);
