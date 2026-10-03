/* Das EWH-Logo steht in der Kopfzeile und ist geladen. */
const { $, expect, until } = E2E;
E2E.run([['Logo in der Kopfzeile', async () => {
  const img = await until(() => $('header img.logo'), 'Logo fehlt');
  await until(() => img.complete && img.naturalWidth > 0, 'Logo nicht geladen');
  expect(img.alt === 'EW Höfe', 'Alt-Text: ' + img.alt);
  expect(img.getBoundingClientRect().height <= 64, 'Logo zu hoch: ' + img.getBoundingClientRect().height);
}]]);
