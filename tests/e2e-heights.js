/* Textfelder und Auswahllisten sind gleich hoch. */
const { $, clickText, wait, expect } = E2E;
E2E.run([['Gleiche Höhe von Textfeld und Auswahlliste', async () => {
  clickText('.stepper button', 'Pain'); await wait(50);
  const hs = ['#f-frequency', '#f-hours', '#f-persons'].map(s => Math.round($(s).getBoundingClientRect().height));
  expect(hs.every(v => v === hs[0]), 'Höhen: ' + hs.join(', '));
}]]);
