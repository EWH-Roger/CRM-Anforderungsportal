/* Befund aus dem Review: Einrichtung erscheint vor dem Laden (Rolle admin, slow=1, Start #einstellungen). */
const { until, byText, expect, wait } = E2E;
E2E.run([['Vor dem Laden keine Einrichtung, danach die echten Einstellungen', async () => {
  // Die echten Daten kommen im Mock nach 1,5 s; bis dahin darf keine Einrichtung angeboten werden.
  for (let i = 0; i < 20; i++) {
    expect(!byText('main h2', 'Portal einrichten'), 'Einrichtung vor dem Laden angeboten');
    await wait(50);
  }
  await until(() => byText('main h2', 'Gremium'), 'echte Einstellungen');
  expect(!byText('main h2', 'Portal einrichten'), 'Einrichtung trotz vorhandener Einstellungen');
}]], { waitLoaded: false });
