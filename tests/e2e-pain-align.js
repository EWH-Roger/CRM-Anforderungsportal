/* Klicktest: Häufigkeit, Zeitaufwand und Personen stehen auf einer Höhe (Rolle business, 1280 px). */
const { $, clickText, wait, expect } = E2E;
const tops = () => ['#f-frequency', '#f-hours', '#f-persons'].map(s => Math.round($(s).getBoundingClientRect().top));
E2E.run([
  ['Eingabefelder auf gleicher Höhe', async () => {
    clickText('.stepper button', 'Pain');
    await wait(50);
    const t = tops();
    expect(t.every(v => v === t[0]), 'Oberkanten: ' + t.join(', '));
  }],
  ['Auch wenn eine Beschriftung umbricht', async () => {
    const label = $('label[for="f-hours"]');
    const original = label.textContent;
    label.textContent = 'Eine absichtlich sehr lange Beschriftung, die sicher auf mehrere Zeilen umbricht';
    await wait(50);
    const t = tops();
    label.textContent = original;
    expect(t.every(v => v === t[0]), 'Oberkanten: ' + t.join(', '));
  }],
]);
