/* Klicktest Bewertung und Rückfragen (Testdaten, Rolle gremium, Start #r-q3). */
const { $, $$, until, setVal, click, clickText, byText, toast, expect } = E2E;
const rate = v => { for (const k of ['nutzen', 'betroffene', 'dringlichkeit', 'fit', 'aufwand']) setVal('#rt-' + k, String(v[k])); };
E2E.run([
  ['Bewertung speichern setzt Status auf «Bewertet»', async () => {
    await until(() => $('#rt-nutzen'), 'Bewertungsformular');
    expect(!$('main table'), 'Ergebnistabelle vor eigener Bewertung sichtbar');
    rate({ nutzen: 4, betroffene: 4, dringlichkeit: 4, fit: 4, aufwand: 2 });
    clickText('button', 'Bewertung speichern');
    await until(() => toast().includes('Bewertung gespeichert.'), 'Toast');
    await until(() => Store.state.requests.find(r => r.id === 'q3').status === 'bewertet', 'Status bewertet');
    await until(() => $('main table'), 'Ergebnistabelle');
  }],
  ['Entwurf im Rückfragenfeld überlebt Neuzeichnen', async () => {
    setVal('#cm-text', 'Gibt es dazu bereits eine Excel-Vorlage?');
    clickText('button', 'Bewertung aktualisieren');
    await until(() => toast().includes('Bewertung gespeichert.'), 'Toast');
    expect($('#cm-text').value === 'Gibt es dazu bereits eine Excel-Vorlage?', 'Entwurf verloren: ' + $('#cm-text').value);
  }],
  ['Senden zeigt Beitrag und leert das Feld', async () => {
    clickText('button', 'Senden');
    await until(() => $$('main .posts li').some(li => li.textContent.includes('Excel-Vorlage')), 'Beitrag sichtbar');
    expect($('#cm-text').value === '', 'Feld nicht leer');
  }],
]);
