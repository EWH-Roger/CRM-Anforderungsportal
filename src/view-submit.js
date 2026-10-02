/* Ansicht «Einreichen»: geführtes Formular in vier Schritten, auch zum Bearbeiten. */
const SubmitView = (() => {
  const { h } = UI;
  const STEPS = ['Worum geht es?', 'Pain: heutiges Problem', 'Gain: erwarteter Nutzen', 'Systeme'];
  const KEY_TO_ID = {
    title: 'f-title', department: 'f-department', crmArea: 'f-crmArea', 'pain.situation': 'f-situation',
    'pain.frequency': 'f-frequency', 'pain.hoursPerWeek': 'f-hours', 'pain.persons': 'f-persons',
    'gain.department': 'f-gainDept', 'gain.successCriterion': 'f-success', 'gain.deadlineReason': 'f-deadlineReason', links: 'f-links',
  };
  const STEP_OF = {
    title: 0, department: 0, crmArea: 0, 'pain.situation': 1, 'pain.frequency': 1, 'pain.hoursPerWeek': 1, 'pain.persons': 1,
    'gain.department': 2, 'gain.successCriterion': 2, 'gain.deadlineReason': 2, links: 3,
  };
  let step = 0, repRows = 1, done = null, editing = null, draft = null, busy = false;

  const empty = () => ({
    title: '', department: '', crmArea: '', useCase: '',
    pain: { situation: '', frequency: '', hoursPerWeek: '', persons: '', consequences: [] },
    gain: { department: '', company: '', successCriterion: '', deadline: '', deadlineReason: '' },
    systems: { affected: [], replaceable: [] }, links: [],
  });

  function edit(r) {
    const p = r.pain || {}, g = r.gain || {}, sy = r.systems || {};
    editing = r.id; done = null; step = 0;
    draft = {
      title: r.title || '', department: r.department || '', crmArea: r.crmArea || '', useCase: r.useCase || '',
      pain: { situation: p.situation || '', frequency: p.frequency || '', hoursPerWeek: p.hoursPerWeek == null ? '' : String(p.hoursPerWeek).replace('.', ','), persons: p.persons == null ? '' : String(p.persons), consequences: [...(p.consequences || [])] },
      gain: { department: g.department || '', company: g.company || '', successCriterion: g.successCriterion || '', deadline: g.deadline || '', deadlineReason: g.deadlineReason || '' },
      systems: { affected: [...(sy.affected || [])], replaceable: (sy.replaceable || []).map(x => ({ system: x.system || '', purpose: x.purpose || '' })) },
      links: [...(r.links || [])],
    };
    repRows = Math.max(1, draft.systems.replaceable.length);
  }

  const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  function collect(form) {
    const checked = group => [...form.querySelectorAll(`input[type="checkbox"][data-group="${group}"]:checked`)].map(i => i.value);
    const other = val('f-sysOther').split(/[,;]/).map(x => x.trim()).filter(Boolean);
    const replaceable = [];
    for (let i = 0; i < repRows; i++) {
      const system = val('f-rep-sys-' + i);
      if (system) replaceable.push({ system, purpose: val('f-rep-purpose-' + i) });
    }
    return {
      title: val('f-title'), department: val('f-department'), crmArea: val('f-crmArea'), useCase: val('f-useCase'),
      pain: { situation: val('f-situation'), frequency: val('f-frequency'), hoursPerWeek: val('f-hours'), persons: val('f-persons'), consequences: checked('cons') },
      gain: { department: val('f-gainDept'), company: val('f-gainCompany'), successCriterion: val('f-success'), deadline: val('f-deadline'), deadlineReason: val('f-deadlineReason') },
      systems: { affected: [...new Set([...checked('sys'), ...other])], replaceable },
      links: val('f-links').split(/\s+/).filter(Boolean),
    };
  }
  // Wandelt Texteingaben in die gespeicherte Form um (Zahlen, leere Frist = null).
  function normalize(d) {
    return { ...d,
      pain: { ...d.pain, hoursPerWeek: Logic.parseNum(d.pain.hoursPerWeek), persons: Logic.parseNum(d.pain.persons) },
      gain: { ...d.gain, deadline: d.gain.deadline || null } };
  }

  const text = (id, value, attrs = {}) => h('input', { type: 'text', id, value, ...attrs });
  const area = (id, value, rows = 4) => h('textarea', { id, rows }, value);
  const withCurrent = (list, cur) => (cur && !list.includes(cur) ? [...list, cur] : list);
  function check(group, value, isChecked, i) {
    const id = `f-${group}-${i}`;
    return h('label', { for: id }, h('input', { type: 'checkbox', id, value, checked: isChecked, 'data-group': group }), value);
  }

  function stepWhat(d, set) {
    return h('fieldset', { 'data-step': 0 }, h('legend', { class: 'sr-only' }, STEPS[0]),
      UI.field('f-title', 'Titel', text('f-title', d.title, { maxlength: Logic.LIMITS.titleMax }), 'Kurz und konkret, z. B. «Offerten direkt aus dem CRM erstellen».'),
      h('div', { class: 'grid2' },
        UI.field('f-department', 'Abteilung', UI.select('f-department', withCurrent(set.departments, d.department), d.department, { placeholder: 'Bitte wählen' })),
        UI.field('f-crmArea', 'Betroffener CRM-Bereich', UI.select('f-crmArea', withCurrent(set.crmAreas, d.crmArea), d.crmArea, { placeholder: 'Bitte wählen' }))),
      UI.field('f-useCase', 'Use Case (optional)', area('f-useCase', d.useCase, 3),
        'Als … möchte ich …, damit … Z. B. «Als Kundenberaterin möchte ich alle Verträge eines Kunden auf einen Blick sehen, damit ich Anfragen am Telefon sofort beantworten kann.»'));
  }
  function stepPain(d) {
    const p = d.pain;
    return h('fieldset', { 'data-step': 1 }, h('legend', { class: 'sr-only' }, STEPS[1]),
      UI.field('f-situation', 'Heutige Situation', area('f-situation', p.situation, 5),
        'Wie läuft es heute ab, und wo hakt es? Z. B. «Offerten entstehen in Word, die Preise werden von Hand aus Excel übertragen. Dabei passieren Fehler, und im CRM ist die Offerte nicht sichtbar.»'),
      h('p', { class: 'hint', id: 'f-situation-count' }),
      h('div', { class: 'grid3' },
        UI.field('f-frequency', 'Häufigkeit', UI.select('f-frequency', Logic.FREQUENCIES, p.frequency, { placeholder: 'Bitte wählen' })),
        UI.field('f-hours', 'Zeitaufwand in h pro Woche und Person', text('f-hours', p.hoursPerWeek, { inputmode: 'decimal', placeholder: 'z. B. 1,5' })),
        UI.field('f-persons', 'Betroffene Personen', text('f-persons', p.persons, { inputmode: 'numeric', placeholder: 'z. B. 6' }))),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Folgen (optional)'),
        h('div', { class: 'checks' }, ...Logic.CONSEQUENCES.map((c, i) => check('cons', c, p.consequences.includes(c), i)))));
  }
  function stepGain(d) {
    const g = d.gain;
    return h('fieldset', { 'data-step': 2 }, h('legend', { class: 'sr-only' }, STEPS[2]),
      UI.field('f-gainDept', 'Nutzen für die Abteilung', area('f-gainDept', g.department, 4),
        'Was wird für Ihre Abteilung besser? Z. B. «Pro Offerte rund 20 Minuten weniger Aufwand, keine Übertragungsfehler mehr.»'),
      h('p', { class: 'hint', id: 'f-gainDept-count' }),
      UI.field('f-gainCompany', 'Nutzen für das Unternehmen (optional)', area('f-gainCompany', g.company, 3),
        'Z. B. schnellere Antworten für Kundinnen und Kunden, weniger Reklamationen, Erfüllung regulatorischer Vorgaben.'),
      UI.field('f-success', 'Erfolgskriterium', text('f-success', g.successCriterion),
        'Woran messen wir den Erfolg? Z. B. «Durchlaufzeit einer Offerte von 5 auf 2 Arbeitstage».'),
      h('div', { class: 'grid2' },
        UI.field('f-deadline', 'Frist (optional)', h('input', { type: 'date', id: 'f-deadline', value: g.deadline || '' }), 'Nur bei einem festen Termin.'),
        UI.field('f-deadlineReason', 'Grund für die Frist', text('f-deadlineReason', g.deadlineReason), 'Pflicht, wenn eine Frist angegeben ist.')));
  }
  function stepSystems(d, set) {
    const sy = d.systems, known = set.systems;
    const others = sy.affected.filter(x => !known.includes(x));
    const rows = [];
    for (let i = 0; i < repRows; i++) {
      const r = sy.replaceable[i] || { system: '', purpose: '' };
      rows.push(h('div', { class: 'reprow' },
        h('input', { type: 'text', id: 'f-rep-sys-' + i, value: r.system, list: 'dl-systems', placeholder: 'z. B. Excel-Liste Kundenanlässe', 'aria-label': `Ablösbares System ${i + 1}` }),
        h('input', { type: 'text', id: 'f-rep-purpose-' + i, value: r.purpose, placeholder: 'Was leistet es heute?', 'aria-label': `Heutige Aufgabe von System ${i + 1}` })));
    }
    return h('fieldset', { 'data-step': 3 }, h('legend', { class: 'sr-only' }, STEPS[3]),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Betroffene Systeme (optional)'),
        h('p', { class: 'hint' }, 'Mit welchen Systemen hängt die Anforderung zusammen, etwa über Schnittstellen oder Datenquellen?'),
        known.length ? h('div', { class: 'checks' }, ...known.map((s, i) => check('sys', s, sy.affected.includes(s), i))) : null,
        text('f-sysOther', others.join(', '), { placeholder: 'Weitere Systeme, durch Komma getrennt', 'aria-label': 'Weitere betroffene Systeme' })),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Systeme, die abgelöst werden könnten (optional)'),
        h('p', { class: 'hint' }, 'Welche Excel-Listen, Access-Datenbanken oder Altsysteme würden überflüssig, und was leisten sie heute?'),
        ...rows,
        h('div', {}, h('button', { type: 'button', class: 'btn ghost small', onclick: () => { draft = collect(document.getElementById('submit-form')); repRows++; App.render(); } }, 'Weiteres System'))),
      h('datalist', { id: 'dl-systems' }, ...known.map(s => h('option', { value: s }))),
      UI.field('f-links', 'Links (optional)', area('f-links', d.links.join('\n'), 2), 'Ein Link pro Zeile, z. B. auf ein SharePoint-Dokument oder einen Teams-Beitrag.'));
  }

  function showStep(form) {
    form.querySelectorAll('fieldset[data-step]').forEach(fs => { fs.hidden = Number(fs.dataset.step) !== step; });
    form.querySelectorAll('.stepper button').forEach((b, i) => { if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    form.querySelector('#f-back').hidden = step === 0;
    form.querySelector('#f-next').hidden = step === STEPS.length - 1;
    form.querySelector('#f-submit').hidden = step !== STEPS.length - 1;
  }
  function updateQuality(form) {
    const q = Logic.validateSubmission(normalize(collect(form))).quality;
    form.querySelector('#q-label').textContent = `Vollständigkeit ${q} %`;
    form.querySelector('#q-bar').style.width = q + '%';
    const c1 = form.querySelector('#f-situation-count');
    if (c1) c1.textContent = `${val('f-situation').length} Zeichen, mindestens ${Logic.LIMITS.situationMin}`;
    const c2 = form.querySelector('#f-gainDept-count');
    if (c2) c2.textContent = `${val('f-gainDept').length} Zeichen, mindestens ${Logic.LIMITS.gainMin}`;
  }
  function next(form) {
    const res = Logic.validateSubmission(normalize(collect(form)));
    const errs = Object.fromEntries(Object.entries(res.errors).filter(([k]) => STEP_OF[k] === step));
    UI.showErrors(form, errs, KEY_TO_ID);
    if (Object.keys(errs).length) { const bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    step++; showStep(form); form.scrollIntoView({ block: 'start' });
  }

  async function submit(form) {
    if (busy) return;
    const data = normalize(collect(form));
    const res = Logic.validateSubmission(data);
    UI.showErrors(form, res.errors, KEY_TO_ID);
    if (!res.valid) {
      step = Math.min(...Object.keys(res.errors).map(k => STEP_OF[k]));
      showStep(form);
      UI.toast('Bitte die markierten Felder ergänzen.', 'err');
      const bad = form.querySelector('fieldset:not([hidden]) [aria-invalid="true"]'); if (bad) bad.focus();
      return;
    }
    busy = true;
    let result = null;
    if (editing) {
      const r = Store.state.requests.find(x => x.id === editing);
      if (r && !['eingereicht', 'klaerung'].includes(r.status)) {
        UI.toast(`Die Anforderung ist inzwischen «${Logic.STATUS_LABEL[r.status]}» und kann nicht mehr bearbeitet werden.`, 'err');
      } else if (r) {
        result = r.status === 'klaerung'
          ? await Store.changeStatus(r, 'eingereicht', 'Angaben ergänzt', data, 'Änderungen gespeichert.')
          : await Store.updateRequest(r.id, data, 'Änderungen gespeichert.');
        if (result != null) done = { id: r.id, number: r.number, edited: true };
      } else UI.toast('Diese Anforderung gibt es nicht mehr.', 'err');
    } else {
      result = await Store.createRequest(data);
      if (result != null) done = result;
    }
    busy = false;
    if (result != null) { draft = null; editing = null; step = 0; repRows = 1; }
    App.render();
  }
  function cancelEdit() { editing = null; draft = null; step = 0; repRows = 1; App.go('anforderungen'); }

  function donePanel() {
    const d = done;
    return h('section', { class: 'panel narrow' },
      h('h2', {}, d.edited ? `Änderungen an #${d.number} gespeichert` : `Anforderung #${d.number} eingereicht`),
      h('p', { class: 'note' }, d.edited ? 'Die Administration sieht die aktualisierten Angaben.' : 'Danke. Den Status verfolgen Sie unter «Anforderungen». Rückfragen erscheinen ebenfalls dort.'),
      h('div', { class: 'row', style: 'margin-top:16px' },
        h('button', { class: 'btn', type: 'button', onclick: () => { done = null; RequestsView.select(d.id); App.go('anforderungen'); } }, 'Anforderung ansehen'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { done = null; App.render(); } }, 'Weitere Anforderung einreichen')));
  }

  function render(root, st) {
    if (done) { root.append(h('div', { class: 'submit-layout' }, donePanel(), aside(st))); return; }
    const set = Store.settings();
    const d = draft || empty();
    const blocked = !st.db ? 'Die Datenbank ist nicht verfügbar, deshalb kann nichts eingereicht werden.'
      : !st.me.id ? 'Zum Einreichen müssen Sie in claude.ai angemeldet sein.'
      : st.canWrite === false ? 'Sie haben nur Lesezugriff. Für das Einreichen braucht es die Freigabe «Contributor».'
      : (st.loaded.settings && !st.settings) ? 'Das Portal ist noch nicht eingerichtet.'
      : null;
    const form = h('form', { class: 'panel narrow', id: 'submit-form', novalidate: true },
      h('div', { class: 'form-head' },
        h('h2', {}, editing ? 'Anforderung bearbeiten' : 'Neue Anforderung einreichen'),
        h('div', { class: 'quality', 'aria-live': 'polite' }, h('span', { id: 'q-label' }, 'Vollständigkeit 0 %'), h('div', { class: 'meter' }, h('span', { id: 'q-bar', style: 'width:0%' })))),
      h('ol', { class: 'stepper' }, ...STEPS.map((t, i) => h('li', {},
        h('button', { type: 'button', onclick: () => { step = i; showStep(form); } }, h('span', { class: 'n' }, i + 1), t)))),
      stepWhat(d, set), stepPain(d), stepGain(d), stepSystems(d, set),
      blocked ? h('p', { class: 'banner' }, blocked) : null,
      h('div', { class: 'formnav' },
        h('button', { type: 'button', class: 'btn ghost', id: 'f-back', onclick: () => { step = Math.max(0, step - 1); showStep(form); } }, 'Zurück'),
        h('div', { class: 'row' },
          editing ? h('button', { type: 'button', class: 'btn ghost', onclick: cancelEdit }, 'Bearbeiten abbrechen') : null,
          h('button', { type: 'button', class: 'btn', id: 'f-next', onclick: () => next(form) }, 'Weiter'),
          h('button', { type: 'submit', class: 'btn', id: 'f-submit', disabled: !!blocked }, editing ? 'Änderungen speichern' : 'Anforderung einreichen'))));
    const sync = () => { draft = collect(form); updateQuality(form); };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    form.addEventListener('submit', e => { e.preventDefault(); submit(form); });
    if (blocked) form.querySelectorAll('fieldset').forEach(fs => { fs.disabled = true; });
    root.append(h('div', { class: 'submit-layout' }, form, aside(st)));
    showStep(form);
    updateQuality(form);
  }

  // Hilfespalte: Tipps, Ablauf und die eigenen Einreichungen.
  function aside(st) {
    const mine = st.me.id ? st.requests.filter(r => r.submittedBy === st.me.id).sort((a, b) => b.number - a.number) : [];
    const open = r => { RequestsView.select(r.id); App.go('anforderungen'); };
    return h('aside', { class: 'submit-aside stack' },
      h('section', { class: 'panel' }, h('h2', {}, 'So wird Ihre Anforderung gut'),
        h('ul', { class: 'tips' },
          h('li', {}, 'Beschreiben Sie das Problem, nicht die Lösung: Was läuft heute schief, wie oft, und wer ist betroffen?'),
          h('li', {}, 'Schätzen Sie den Zeitaufwand pro Woche und Person. Grobe Werte genügen.'),
          h('li', {}, 'Formulieren Sie ein messbares Erfolgskriterium, zum Beispiel eine kürzere Durchlaufzeit oder weniger Fehler.'),
          h('li', {}, 'Nennen Sie Excel-Listen oder Altsysteme, die wegfallen könnten.'))),
      h('section', { class: 'panel' }, h('h2', {}, 'Was danach passiert'),
        h('ol', { class: 'flow' },
          h('li', {}, UI.pill('eingereicht'), h('span', {}, 'Die Administration prüft die Angaben und stellt bei Bedarf Rückfragen.')),
          h('li', {}, UI.pill('bewertung'), h('span', {}, 'Das Gremium bewertet Nutzen und Aufwand.')),
          h('li', {}, UI.pill('bewertet'), h('span', {}, 'Die Anforderung kommt in den Backlog der Roadmap.')),
          h('li', {}, UI.pill('eingeplant'), h('span', {}, 'Sie ist einem Release zugeordnet und wird umgesetzt.')))),
      st.me.id ? h('section', { class: 'panel' }, h('h2', {}, 'Meine Anforderungen'),
        mine.length
          ? h('ul', { class: 'mine' }, ...mine.slice(0, 5).map(r => h('li', {},
              h('button', { class: 'linkbtn', type: 'button', onclick: () => open(r) }, `#${r.number} ${r.title}`), UI.pill(r.status))))
          : h('p', { class: 'hint' }, 'Sie haben noch keine Anforderung eingereicht.'),
        mine.length > 5 ? h('p', { class: 'hint', style: 'margin-top:8px' }, `Alle ${mine.length} finden Sie unter «Anforderungen» mit dem Filter «Nur meine».`) : null) : null);
  }

  return { render, edit };
})();
