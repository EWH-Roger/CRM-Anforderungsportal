/* Klicktest Frontend-Design (Testdaten, Rolle admin, Start #r-q1). */
const { $, $$, until, wait, clickText, expect } = E2E;
const lum = c => {
  const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const fieldContrast = () => { const el = $('#adm-points'); const s = getComputedStyle(el); return contrast(s.borderTopColor, s.backgroundColor); };
E2E.run([
  ['Rahmen von Eingabefeldern mit mindestens 3:1 Kontrast (hell und dunkel)', async () => {
    await until(() => $('#adm-points'), 'Eingabefeld');
    for (const mode of ['Hell', 'Dunkel']) {
      clickText('header .theme button', mode); await wait(50);
      const c = fieldContrast();
      expect(c >= 3, `${mode}: Kontrast ${c.toFixed(2)}`);
    }
    clickText('header .theme button', 'System');
  }],
  ['Keine Mittelpunkt-Ketten, keine Grossbuchstaben-Labels, keine Pfeile', async () => {
    const text = document.body.innerText;
    expect(!text.includes('·'), 'Mittelpunkt gefunden: ' + (text.match(/.{0,30}·.{0,30}/) || [''])[0]);
    expect(!text.includes('←') && !text.includes('→ '), 'Pfeil gefunden');
    const caps = [...document.querySelectorAll('header *, main *')].filter(e => getComputedStyle(e).textTransform === 'uppercase' && e.textContent.trim());
    expect(!caps.length, 'Grossbuchstaben: ' + caps.slice(0, 3).map(e => e.textContent.trim()).join(' | '));
  }],
  ['Entscheidungsleiste mit Status, Score, Einordnung und Einsparpotenzial', async () => {
    const bar = $('.decision');
    expect(bar, 'Entscheidungsleiste fehlt');
    for (const t of ['Bewertet', '2.06', 'Quick Win', '460']) expect(bar.textContent.includes(t), `«${t}» fehlt: ${bar.textContent}`);
  }],
  ['Inhalt der Anforderung in einer Box statt vieler', async () => {
    const panels = $$('.detail > .stack:first-child > .panel');
    expect(panels.length <= 3, 'Boxen in der Hauptspalte: ' + panels.length);
  }],
  ['Kleine Matrix zeigt die Position der Anforderung', async () => {
    const svg = $('.mini-matrix');
    expect(svg, 'Matrix fehlt');
    expect(svg.querySelectorAll('circle.current').length === 1, 'aktueller Punkt fehlt');
    expect(svg.querySelectorAll('circle.other').length >= 1, 'Vergleichspunkte fehlen');
  }],
]);
