/* Klicktest Hinweise im Portal (Testdaten, Start #anforderungen, Rolle per URL). */
const { $, $$, until, wait, clickText, byText, expect } = E2E;
const role = new URLSearchParams(location.search).get('role');
const badge = () => { const b = $('#tabs a[data-tab="anforderungen"] .badge'); return b ? b.textContent : ''; };
const expected = { admin: ['#4', 'Neue Anforderung'], gremium: ['#3', 'Zur Bewertung freigegeben'], business: ['#3', 'In Bewertung'] }[role];
E2E.run([
  ['Beim ersten Besuch keine Hinweise', async () => {
    expect(!$('.news'), 'Hinweisbox beim ersten Besuch sichtbar');
    expect(badge() === '', 'Zahl am Reiter: ' + badge());
  }],
  ['Neues seit dem letzten Besuch: Zahl am Reiter und Box', async () => {
    localStorage.setItem('portal-seen', '2026-09-01T00:00:00.000Z');
    App.render();
    await until(() => $('.news'), 'Hinweisbox');
    const items = $$('.news li');
    expect(badge() === String(items.length), `Zahl ${badge()} ≠ Einträge ${items.length}`);
    expect(items[0].textContent.includes(expected[0]) && items[0].textContent.includes(expected[1]), 'Erster Eintrag: ' + items[0].textContent);
  }],
  ['Eintrag öffnet die Anforderung', async () => {
    $$('.news li button')[0].click();
    await until(() => $('main h2') && $('.detail-head') && $('.detail-head').textContent.includes(expected[0]), 'Detail');
  }],
  ['«Als gelesen markieren» leert Box und Zahl', async () => {
    RequestsView.select(null); App.go('anforderungen');
    await until(() => $('.news'), 'Hinweisbox wieder in der Liste');
    clickText('.news button', 'Als gelesen markieren');
    await wait(100);
    expect(!$('.news') && badge() === '', 'Box oder Zahl noch sichtbar');
    expect(localStorage.getItem('portal-seen') > '2026-10-01', 'Zeitpunkt nicht gespeichert: ' + localStorage.getItem('portal-seen'));
  }],
]);
