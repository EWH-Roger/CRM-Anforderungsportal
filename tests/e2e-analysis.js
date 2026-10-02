/* Klicktest Auswertung (Testdaten, Rolle admin). */
const { $, $$, until, byText, expect } = E2E;
E2E.run([
  ['Drei Punkte, Rangliste beginnt mit #1', async () => {
    await until(() => $$('.chart .pt').length === 3, 'drei Punkte');
    expect($('main tbody tr').textContent.includes('#1'), $('main tbody tr').textContent);
  }],
  ['Klick auf einen Punkt öffnet die Anforderung', async () => {
    const pt = $$('.chart .pt').find(g => g.getAttribute('aria-label').startsWith('#2 '));
    pt.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await until(() => byText('main h2', 'Kampagnenantworten'), 'Detail #2');
  }],
]);
