/* Corporate Identity EW Höfe AG im hellen Modus (Testdaten, Rolle admin, Start #anforderungen). */
const { $, $$, until, wait, clickText, expect } = E2E;
const css = (el, p) => getComputedStyle(el)[p];
E2E.run([
  ['Farben nach Vorgabe', async () => {
    clickText('header .theme button', 'Hell');
    await wait(50);
    expect(css($('.sub'), 'color') === 'rgb(0, 118, 184)', 'Untertitel: ' + css($('.sub'), 'color'));
    expect(css($('nav.tabs'), 'borderBottomColor') === 'rgb(159, 198, 223)', 'Trennlinie: ' + css($('nav.tabs'), 'borderBottomColor'));
    const active = $('nav.tabs a[aria-current="page"]');
    expect(css(active, 'borderBottomColor') === 'rgb(0, 111, 185)', 'Primärblau: ' + css(active, 'borderBottomColor'));
  }],
  ['Tabellen: dunkelblaue Kopfzeile, weisse fette Schrift, alternierende Zeilen', async () => {
    await until(() => $$('main tbody tr').length >= 2, 'Tabelle');
    const th = $('main th');
    expect(css(th, 'backgroundColor') === 'rgb(0, 51, 90)', 'Kopf Hintergrund: ' + css(th, 'backgroundColor'));
    expect(css(th, 'color') === 'rgb(255, 255, 255)', 'Kopf Schrift: ' + css(th, 'color'));
    expect(Number(css(th, 'fontWeight')) >= 600, 'Kopf Gewicht: ' + css(th, 'fontWeight'));
    const even = $$('main tbody tr')[1].querySelector('td');
    expect(css(even, 'backgroundColor') === 'rgb(245, 247, 248)', 'Zeile 2: ' + css(even, 'backgroundColor'));
  }],
  ['Fusszeile «EW Höfe AG | CRM-Anforderungsportal» mit Version', async () => {
    const f = $('footer.site');
    expect(f, 'Fusszeile fehlt');
    expect(f.textContent.includes('EW Höfe AG | CRM-Anforderungsportal') && /Version \d+\.\d+\.\d+/.test(f.textContent), f.textContent);
    expect(css(f, 'borderTopColor') === 'rgb(159, 198, 223)', 'Linie: ' + css(f, 'borderTopColor'));
  }],
]);
