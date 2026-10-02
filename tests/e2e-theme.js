/* Klicktest Farbschema-Umschalter (Testdaten, Rolle business). */
const { $, wait, clickText, expect } = E2E;
const bg = () => getComputedStyle(document.body).backgroundColor;
const LIGHT = 'rgb(243, 246, 249)', DARK = 'rgb(10, 22, 34)';
const stored = () => { try { return localStorage.getItem('portal-theme'); } catch (e) { return 'n/a'; } };
E2E.run([
  ['Umschalter mit drei Stufen in der Kopfzeile', async () => {
    const group = $('header .theme');
    expect(group, 'Umschalter fehlt');
    expect(['System', 'Hell', 'Dunkel'].every(t => [...group.querySelectorAll('button')].some(b => b.textContent.trim() === t)), group.textContent);
  }],
  ['«Dunkel» schaltet auf dunkel und wird gespeichert', async () => {
    clickText('header .theme button', 'Dunkel');
    await wait(50);
    expect(document.documentElement.dataset.portalTheme === 'dark', 'Attribut: ' + document.documentElement.dataset.portalTheme);
    expect(bg() === DARK, 'Hintergrund: ' + bg());
    expect(stored() === 'dark', 'gespeichert: ' + stored());
    expect($('header .theme button[aria-pressed="true"]').textContent.trim() === 'Dunkel', 'aktive Stufe');
  }],
  ['«Hell» gilt auch, wenn claude.ai dunkel vorgibt', async () => {
    clickText('header .theme button', 'Hell');
    document.documentElement.setAttribute('data-theme', 'dark');
    await wait(50);
    expect(bg() === LIGHT, 'Hintergrund: ' + bg());
    expect(stored() === 'light', 'gespeichert: ' + stored());
    document.documentElement.removeAttribute('data-theme');
  }],
  ['«System» entfernt die eigene Wahl', async () => {
    clickText('header .theme button', 'System');
    await wait(50);
    expect(!document.documentElement.hasAttribute('data-portal-theme'), 'Attribut noch gesetzt');
    expect(stored() === null || stored() === 'n/a', 'gespeichert: ' + stored());
  }],
]);
