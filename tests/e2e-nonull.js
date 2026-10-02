/* Prüft, dass keine Ansicht den Text «null» oder «undefined» anzeigt. */
const { $, wait, expect } = E2E;
E2E.run([['Kein «null» oder «undefined» im sichtbaren Text', async () => {
  await wait(300);
  const t = $('main').innerText;
  const m = t.match(/.{0,30}\b(null|undefined|NaN)\b.{0,30}/);
  expect(!m, m && m[0]);
}]]);
