/* Befunde aus dem Review: Lesende und nicht Angemeldete (Testdaten, Start #einreichen). */
const { $, expect, until } = E2E;
E2E.run([['Formularfelder gesperrt und passender Hinweis', async () => {
  await until(() => $('#f-title'), 'Formular');
  expect($('#f-title').matches(':disabled'), 'Titel-Feld nicht gesperrt');
  const role = new URLSearchParams(location.search).get('role');
  const banner = $('#banner').hidden ? '' : $('#banner').textContent;
  if (role === 'anonym') expect(banner.includes('melden Sie sich'), 'Banner: ' + banner);
  else expect(banner.includes('Lesezugriff'), 'Banner: ' + banner);
}]]);
