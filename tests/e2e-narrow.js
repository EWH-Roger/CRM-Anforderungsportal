/* Prüft, dass bei 400 px Breite nichts über den Seitenrand ragt (ausser in eigenen Scrollbereichen). */
const { wait, expect } = E2E;
E2E.run([['Bei 400 px ragt nichts über den Rand', async () => {
  document.documentElement.style.width = '400px';
  await wait(200);
  const scrollers = [...document.querySelectorAll('.tablewrap, .board, nav.tabs')];
  const bad = [...document.querySelectorAll('body *')]
    .filter(e => !scrollers.some(s => s !== e && s.contains(e)))
    .filter(e => e.getClientRects().length && e.getBoundingClientRect().right > 400.5)
    .map(e => `${e.tagName.toLowerCase()}.${e.className}#${e.id}=${Math.round(e.getBoundingClientRect().right)}`);
  expect(!bad.length, bad.slice(0, 5).join(' | '));
}]]);
