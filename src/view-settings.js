/* Ansicht «Einstellungen»: nur für die Administration. */
const SettingsView = (() => {
  const { h } = UI;
  // Vorschläge für die Ersteinrichtung; die Administration passt sie an.
  const SUGGESTED = {
    departments: ['Verkauf', 'Kundendienst', 'Marketing', 'Finanzen', 'Geschäftsleitung'],
    crmAreas: ['Kontakte und Firmen', 'Verträge', 'Kampagnen', 'Aktivitäten und Aufgaben', 'Reporting', 'Schnittstellen'],
    systems: ['Excel', 'Outlook', 'SharePoint'],
  };
  const lines = v => [...new Set(v.split('\n').map(x => x.trim()).filter(Boolean))];
  const val = id => document.getElementById(id).value;

  function render(root, st) {
    const isNew = !st.settings;
    const cur = Store.settings();
    const base = isNew ? { ...cur, ...SUGGESTED, committee: st.me.id ? [st.me.id] : [] } : cur;
    root.append(h('div', { class: 'stack' },
      isNew ? h('section', { class: 'panel', style: 'border-color:var(--accent)' },
        h('h2', {}, 'Portal einrichten'),
        h('p', { class: 'note' }, 'Das Portal hat noch keine Einstellungen. Die Felder enthalten Vorschläge. Passen Sie die Listen an Ihre Organisation an und speichern Sie. Danach können Anforderungen eingereicht werden. Sie selbst werden als erstes Gremium-Mitglied eingetragen.')) : null,
      generalForm(base, isNew),
      isNew ? null : committeePanel(st, cur),
      isNew ? null : releasesPanel(st),
      isNew ? null : h('section', { class: 'panel' },
        h('h2', {}, 'Export'),
        h('p', { class: 'note' }, 'Speichert zwei CSV-Dateien: alle Anforderungen mit berechneten Werten und alle Bewertungen. Trennzeichen ist das Semikolon, damit Excel die Dateien direkt öffnet.'),
        h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => Store.exportCsv() }, 'CSV exportieren')))));
  }

  function generalForm(base, isNew) {
    const num = (id, label, value, hint) => UI.field(id, label, h('input', { type: 'text', inputmode: 'decimal', id, value: String(value) }), hint);
    const list = (id, label, values, hint) => UI.field(id, label, h('textarea', { id, rows: 6 }, values.join('\n')), hint);
    const ids = [...Logic.BENEFIT_KEYS.map(k => 'set-w-' + k), 'set-min', 'set-weeks', 'set-dep', 'set-crm', 'set-sys'];
    const form = h('form', { class: 'panel', novalidate: true },
      h('h2', {}, 'Bewertung und Wertelisten'),
      h('div', { class: 'ratinggrid' }, ...Logic.BENEFIT_KEYS.map(k => num('set-w-' + k, 'Gewicht ' + Logic.CRITERIA_LABEL[k], base.weights[k] ?? 1, '0 bis 3, in Schritten von 0,5'))),
      h('div', { class: 'ratinggrid', style: 'margin-top:12px' },
        num('set-min', 'Mindestanzahl Bewertungen', base.minRatings, 'Ab dieser Anzahl gilt eine Anforderung als bewertet.'),
        num('set-weeks', 'Arbeitswochen pro Jahr', base.weeksPerYear, 'Für die Berechnung des Einsparpotenzials.')),
      h('div', { class: 'grid2', style: 'margin-top:12px' },
        list('set-dep', 'Abteilungen', base.departments, 'Ein Eintrag pro Zeile.'),
        list('set-crm', 'CRM-Bereiche', base.crmAreas, 'Ein Eintrag pro Zeile.'),
        list('set-sys', 'Systeme', base.systems, 'Für betroffene und ablösbare Systeme. Ein Eintrag pro Zeile.')),
      h('p', { class: 'err', id: 'set-err', hidden: true, style: 'margin-top:12px' }),
      h('div', { class: 'row', style: 'margin-top:16px' }, h('button', { class: 'btn', type: 'submit' }, isNew ? 'Einrichtung speichern' : 'Einstellungen speichern')));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errs = [], weights = {};
      for (const k of Logic.BENEFIT_KEYS) {
        const w = Logic.parseNum(val('set-w-' + k));
        if (!Number.isFinite(w) || w < 0 || w > 3 || Math.round(w * 2) !== w * 2) errs.push(`Gewicht ${Logic.CRITERIA_LABEL[k]}: 0 bis 3 in Schritten von 0,5.`);
        weights[k] = w;
      }
      if (Logic.BENEFIT_KEYS.every(k => weights[k] === 0)) errs.push('Mindestens ein Gewicht muss grösser als 0 sein.');
      const minRatings = Logic.parseNum(val('set-min'));
      if (!Number.isInteger(minRatings) || minRatings < 1) errs.push('Mindestanzahl Bewertungen: ganze Zahl ab 1.');
      const weeksPerYear = Logic.parseNum(val('set-weeks'));
      if (!Number.isFinite(weeksPerYear) || weeksPerYear < 1 || weeksPerYear > 52) errs.push('Arbeitswochen pro Jahr: Zahl zwischen 1 und 52.');
      const departments = lines(val('set-dep')), crmAreas = lines(val('set-crm')), systems = lines(val('set-sys'));
      if (!departments.length) errs.push('Bitte mindestens eine Abteilung erfassen.');
      if (!crmAreas.length) errs.push('Bitte mindestens einen CRM-Bereich erfassen.');
      const err = document.getElementById('set-err');
      err.textContent = errs.join(' '); err.hidden = !errs.length;
      if (errs.length) return;
      const ok = await Store.saveSettings({ ...base, weights, minRatings, weeksPerYear, departments, crmAreas, systems });
      if (ok != null) UI.clearDirty(...ids);
    });
    return form;
  }

  function committeePanel(st, cur) {
    const results = h('ul', { class: 'posts', id: 'cm-results', style: 'margin-top:8px' });
    const search = h('input', { type: 'search', id: 'cm-search', placeholder: 'Name oder E-Mail eingeben', autocomplete: 'off' });
    const run = async () => {
      if (!st.user) { results.replaceChildren(h('li', {}, 'Die Personensuche ist in dieser Ansicht nicht verfügbar.')); return; }
      const q = search.value.trim();
      const hits = (await st.user.search(q)).filter(p => !cur.committee.includes(p.id));
      results.replaceChildren(...(hits.length
        ? hits.map(p => h('li', { class: 'row', style: 'justify-content:space-between' }, h('span', {}, p.name),
            h('button', { class: 'btn small', type: 'button', onclick: () => Store.saveSettings({ ...cur, committee: [...cur.committee, p.id] }) }, 'Hinzufügen')))
        : [h('li', {}, q ? 'Keine Person gefunden. Gesucht wird in Ihrer Organisation.' : 'Namen eingeben, um Personen zu suchen.')]));
    };
    search.addEventListener('input', run);
    search.addEventListener('focus', run);
    return h('section', { class: 'panel' },
      h('h2', {}, 'Gremium'),
      h('p', { class: 'note', style: 'margin-bottom:12px' }, 'Nur Bewertungen dieser Personen zählen für Durchschnitt und Score. Mitglieder brauchen beim Teilen des Portals mindestens die Freigabe «Contributor».'),
      cur.committee.length
        ? h('ul', { class: 'posts' }, ...cur.committee.map(id => h('li', { class: 'row', style: 'justify-content:space-between' }, UI.nameSpan(id),
            h('button', { class: 'btn ghost small', type: 'button', onclick: () => Store.saveSettings({ ...cur, committee: cur.committee.filter(x => x !== id) }) }, 'Entfernen'))))
        : h('p', { class: 'note' }, 'Noch keine Mitglieder.'),
      UI.field('cm-search', 'Person hinzufügen', search),
      results);
  }

  function releasesPanel(st) {
    const usedCount = id => st.requests.filter(r => r.releaseId === id).length;
    const inp = (id, value, attrs = {}) => h('input', { type: 'text', id, value: value == null ? '' : String(value), ...attrs });
    const rows = st.releases.map(rel => h('tr', {},
      h('td', {}, inp('rel-name-' + rel.id, rel.name, { 'aria-label': 'Name' })),
      h('td', {}, inp('rel-order-' + rel.id, rel.order, { inputmode: 'numeric', 'aria-label': 'Reihenfolge' })),
      h('td', {}, inp('rel-cap-' + rel.id, rel.capacity, { inputmode: 'decimal', 'aria-label': 'Kapazität in Punkten' })),
      h('td', {}, rel.status === 'ausgeliefert' ? 'ausgeliefert' : 'offen'),
      h('td', {}, h('div', { class: 'row' },
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => saveRel(rel.id, rel.status) }, 'Speichern'),
        h('button', { class: 'btn danger small', type: 'button', disabled: usedCount(rel.id) > 0, title: usedCount(rel.id) ? 'Enthält Anforderungen und kann nicht gelöscht werden.' : null, onclick: () => delRel(rel) }, 'Löschen')))));
    const nextOrder = st.releases.reduce((m, r) => Math.max(m, r.order || 0), 0) + 1;
    rows.push(h('tr', {},
      h('td', {}, inp('rel-name-new', '', { placeholder: 'z. B. 2027.1', 'aria-label': 'Name des neuen Release' })),
      h('td', {}, inp('rel-order-new', nextOrder, { inputmode: 'numeric', 'aria-label': 'Reihenfolge des neuen Release' })),
      h('td', {}, inp('rel-cap-new', '', { inputmode: 'decimal', placeholder: 'z. B. 20', 'aria-label': 'Kapazität des neuen Release' })),
      h('td', {}, 'neu'),
      h('td', {}, h('button', { class: 'btn small', type: 'button', onclick: () => saveRel(null, 'offen') }, 'Anlegen'))));
    return h('section', { class: 'panel' },
      h('h2', {}, 'Releases'),
      h('p', { class: 'note', style: 'margin-bottom:12px' }, 'Die Kapazität gibt an, wie viele Aufwandspunkte ein Release aufnehmen kann. Der automatische Vorschlag füllt die offenen Releases in der angegebenen Reihenfolge.'),
      h('div', { class: 'tablewrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ...['Name', 'Reihenfolge', 'Kapazität (Punkte)', 'Status', ''].map(t => h('th', {}, t)))),
        h('tbody', {}, ...rows))));
  }
  async function saveRel(id, status) {
    const key = id || 'new';
    const v = k => document.getElementById(`rel-${k}-${key}`).value.trim();
    const name = v('name'), order = Logic.parseNum(v('order')), capacity = Logic.parseNum(v('cap'));
    if (!name) { UI.toast('Bitte einen Namen für das Release angeben.', 'err'); return; }
    if (!Number.isFinite(order)) { UI.toast('Die Reihenfolge muss eine Zahl sein.', 'err'); return; }
    if (!Number.isFinite(capacity) || capacity <= 0) { UI.toast('Die Kapazität muss eine Zahl grösser als 0 sein.', 'err'); return; }
    const ok = await Store.saveRelease({ id, name, order, capacity, status });
    if (ok == null) return;
    UI.clearDirty(`rel-name-${key}`, `rel-order-${key}`, `rel-cap-${key}`);
    if (!id) for (const k of ['name', 'cap']) { const el = document.getElementById(`rel-${k}-new`); if (el) el.value = ''; }
  }
  async function delRel(rel) {
    const res = await UI.confirmDialog(`Release ${rel.name} löschen?`, { confirmLabel: 'Löschen' });
    if (res.ok) await Store.deleteRelease(rel.id);
  }

  return { render };
})();
