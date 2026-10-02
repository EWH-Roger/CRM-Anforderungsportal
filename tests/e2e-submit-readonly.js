/* Klicktest Einreichen mit Lesezugriff (Rolle viewer). */
const { $, clickText, expect } = E2E;
E2E.run([['Absenden ist gesperrt, Hinweis sichtbar', async () => {
  clickText('.stepper button', 'Systeme');
  expect($('#f-submit').disabled, 'Absenden nicht gesperrt');
  expect(!$('#banner').hidden && $('#banner').textContent.includes('Lesezugriff'), 'Banner fehlt');
  expect($('#who').textContent.includes('Lesezugriff'), 'Rolle: ' + $('#who').textContent);
}]]);
