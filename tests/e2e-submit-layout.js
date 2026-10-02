/* Klicktest Layout Einreichen (Testdaten, Rolle business, Start #einreichen). */
const { $, $$, until, byText, expect } = E2E;
E2E.run([
  ['Keine doppelte Überschrift: die Legende ist nur für Screenreader', async () => {
    const legend = $('fieldset[data-step="0"] legend');
    expect(legend, 'Legende fehlt (für Screenreader nötig)');
    const r = legend.getBoundingClientRect();
    expect(r.width <= 1 && r.height <= 1, `Legende sichtbar (${Math.round(r.width)}×${Math.round(r.height)})`);
  }],
  ['Hinweistexte nutzen die volle Feldbreite', async () => {
    const hint = $('#f-useCase').closest('.field').querySelector('.hint');
    const field = hint.closest('.field');
    expect(hint.getBoundingClientRect().width >= field.getBoundingClientRect().width - 1,
      `Hinweis ${Math.round(hint.getBoundingClientRect().width)} px, Feld ${Math.round(field.getBoundingClientRect().width)} px`);
  }],
  ['Hilfespalte steht auf breiten Bildschirmen rechts neben dem Formular', async () => {
    const aside = $('.submit-aside');
    expect(aside, 'Hilfespalte fehlt');
    expect(byText('.submit-aside h2', 'So wird Ihre Anforderung gut'), 'Abschnitt Tipps fehlt');
    expect(byText('.submit-aside h2', 'Was danach passiert'), 'Abschnitt Ablauf fehlt');
    expect(aside.getBoundingClientRect().left >= $('#submit-form').getBoundingClientRect().right,
      'Hilfespalte nicht rechts neben dem Formular');
  }],
  ['«Meine Anforderungen» zeigt die eigenen Einreichungen und öffnet sie', async () => {
    const items = $$('.submit-aside .mine li');
    expect(items.length === 4, 'Anzahl: ' + items.length);
    expect(items[0].textContent.includes('#4') && items[0].querySelector('.pill'), 'Neueste zuerst mit Status: ' + items[0].textContent);
    items[0].querySelector('button').click();
    await until(() => byText('main h2', 'Monatsreport'), 'Detail #4');
  }],
]);
