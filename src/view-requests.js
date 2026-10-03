/* Ansicht «Anforderungen»: Liste mit Filtern und Detailansicht. */
const RequestsView = (() => {
  const { h } = UI;
  let selected = null, unsub = null, commentsFor = null, comments = [];
  const filters = { q: '', status: '', crmArea: '', department: '', mine: false, sort: 'neu' };
  const SCALE = {
    nutzen: ['sehr gering', 'gering', 'mittel', 'hoch', 'sehr hoch'],
    betroffene: ['Einzelperson', 'kleines Team', 'eine Abteilung', 'mehrere Abteilungen', 'ganzes Unternehmen'],
    dringlichkeit: ['keine', 'gering', 'mittel', 'hoch', 'sehr hoch'],
    fit: ['kein Bezug', 'gering', 'mittel', 'hoch', 'zentral'],
    aufwand: ['sehr klein', 'klein', 'mittel', 'gross', 'sehr gross'],
  };
  const ACTION_LABEL = { klaerung: 'Rückfrage stellen', bewertung: 'Zur Bewertung freigeben', abgelehnt: 'Ablehnen', zurueckgestellt: 'Zurückstellen' };

  function select(id) { selected = id; }
  function stopComments() { if (unsub) unsub(); unsub = null; commentsFor = null; comments = []; }
  function open(id) { selected = id; window.scrollTo(0, 0); App.render(); }

  function render(root, st) {
    if (selected) {
      const r = st.requests.find(x => x.id === selected);
      if (r) { renderDetail(root, st, r); return; }
      if (!st.loaded.requests && st.db) { root.append(h('p', { class: 'empty' }, 'Anforderung wird geladen …')); return; }
      selected = null;
      UI.toast('Diese Anforderung gibt es nicht mehr.', 'err');
    }
    stopComments();
    renderList(root, st);
  }

  // ---- Liste ----
  function visible(st) {
    const q = filters.q.trim().toLowerCase();
    const list = st.requests.filter(r =>
      (!filters.status || r.status === filters.status) &&
      (!filters.crmArea || r.crmArea === filters.crmArea) &&
      (!filters.department || r.department === filters.department) &&
      (!filters.mine || r.submittedBy === st.me.id) &&
      (!q || [r.title, r.useCase, r.pain && r.pain.situation, r.gain && r.gain.department, '#' + r.number].join(' ').toLowerCase().includes(q)));
    const sc = r => { const ev = Store.evaluation(r); return Store.canSeeResults(r) && ev.count ? ev.score : -1; };
    const sorters = { neu: (a, b) => b.number - a.number, alt: (a, b) => a.number - b.number, score: (a, b) => (sc(b) - sc(a)) || (a.number - b.number) };
    return list.sort(sorters[filters.sort]);
  }
  function renderList(root, st) {
    const set = Store.settings();
    const upd = k => e => { filters[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; App.render(); };
    const uniq = (a, b) => [...new Set([...a, ...b].filter(Boolean))];
    const list = visible(st);
    root.append(
      h('div', { class: 'spread' }, h('h2', {}, 'Anforderungen'), h('span', { class: 'note' }, `${list.length} von ${st.requests.length}`)),
      newsBox() || '',
      h('div', { class: 'filters' },
        h('input', { type: 'search', id: 'flt-q', placeholder: 'Suchen nach Titel, Text oder #Nummer', 'aria-label': 'Suchen', value: filters.q, oninput: upd('q') }),
        UI.select('flt-status', [['', 'Alle Status'], ...Logic.STATUSES.map(s => [s, Logic.STATUS_LABEL[s]])], filters.status, { label: 'Status', onchange: upd('status') }),
        UI.select('flt-crm', [['', 'Alle CRM-Bereiche'], ...uniq(set.crmAreas, st.requests.map(r => r.crmArea))], filters.crmArea, { label: 'CRM-Bereich', onchange: upd('crmArea') }),
        UI.select('flt-dep', [['', 'Alle Abteilungen'], ...uniq(set.departments, st.requests.map(r => r.department))], filters.department, { label: 'Abteilung', onchange: upd('department') }),
        UI.select('flt-sort', [['neu', 'Neueste zuerst'], ['alt', 'Älteste zuerst'], ['score', 'Höchster Score zuerst']], filters.sort, { label: 'Sortierung', onchange: upd('sort') }),
        h('label', { class: 'row', for: 'flt-mine' }, h('input', { type: 'checkbox', id: 'flt-mine', checked: filters.mine, onchange: upd('mine') }), 'Nur meine')));
    if (!st.loaded.requests && st.db) { root.append(h('p', { class: 'empty' }, 'Anforderungen werden geladen …')); return; }
    if (!st.requests.length) { root.append(h('p', { class: 'empty' }, 'Noch keine Anforderungen. Die erste reichen Sie unter «Einreichen» ein.')); return; }
    if (!list.length) { root.append(h('p', { class: 'empty' }, 'Keine Anforderung passt zu diesen Filtern.')); return; }
    const heads = [['Nr.', 'num'], ['Titel'], ['Abteilung'], ['CRM-Bereich'], ['Status'], ['Score', 'num'], ['Eingereicht', 'num']];
    root.append(h('div', { class: 'tablewrap' }, h('table', {},
      h('thead', {}, h('tr', {}, ...heads.map(([t, c]) => h('th', { class: c || null }, t)))),
      h('tbody', {}, ...list.map(r => {
        const ev = Store.evaluation(r);
        const show = Store.canSeeResults(r) && ev.count > 0;
        return h('tr', { class: 'click', tabindex: 0, onclick: () => open(r.id), onkeydown: e => { if (e.key === 'Enter') open(r.id); } },
          h('td', { class: 'num' }, '#' + r.number), h('td', {}, r.title), h('td', {}, r.department), h('td', {}, r.crmArea),
          h('td', {}, UI.pill(r.status)), h('td', { class: 'num' }, show ? UI.fmtNum(ev.score, 2) : '–'), h('td', { class: 'num' }, UI.fmtDate(r.submittedAt)));
      })))));
  }

  function newsBox() {
    const news = Store.notifications();
    if (!news.length) return null;
    return h('section', { class: 'panel news' },
      h('div', { class: 'spread' }, h('h2', {}, 'Neu seit Ihrem letzten Besuch'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => Store.markSeen() }, 'Als gelesen markieren')),
      h('ul', {}, ...news.slice(0, 10).map(n => h('li', {},
        h('button', { class: 'linkbtn', type: 'button', onclick: () => open(n.requestId) }, `#${n.number} ${n.title}`),
        h('span', { class: 'meta' }, ` · ${n.text} · ${UI.fmtDateTime(n.at)}`)))),
      news.length > 10 ? h('p', { class: 'hint' }, `und ${news.length - 10} weitere`) : null);
  }

  // ---- Detail ----
  function renderDetail(root, st, r) {
    if (commentsFor !== r.id) {
      stopComments();
      commentsFor = r.id;
      unsub = Store.watchComments(r.id, list => { comments = list; App.render(); });
    }
    const set = Store.settings();
    const ev = Store.evaluation(r);
    const results = Store.canSeeResults(r) && ev.count > 0;
    const canEditReq = (r.submittedBy === st.me.id || st.isAdmin) && ['eingereicht', 'klaerung'].includes(r.status) && st.canWrite !== false;
    const p = r.pain || {}, g = r.gain || {}, sy = r.systems || {};
    const sec = (title, ...body) => h('section', { class: 'panel prose' }, h('h3', {}, title), ...body);
    const para = (label, value) => value ? h('div', {}, h('p', { class: 'eyebrow' }, label), h('p', {}, value)) : null;

    root.append(h('div', { class: 'detail-head' },
      h('div', {}, h('button', { class: 'linkbtn', type: 'button', onclick: () => { selected = null; stopComments(); App.render(); } }, '← Alle Anforderungen')),
      h('div', { class: 'row' }, h('span', { class: 'eyebrow' }, '#' + r.number), UI.pill(r.status)),
      h('h2', {}, r.title),
      h('p', { class: 'meta' }, `${r.department} · ${r.crmArea} · eingereicht am ${UI.fmtDate(r.submittedAt)} von `, UI.nameSpan(r.submittedBy))));

    const main = h('div', { class: 'stack' },
      r.useCase ? sec('Use Case', h('p', {}, r.useCase)) : null,
      sec('Pain: heutiges Problem',
        h('p', {}, p.situation),
        h('p', { class: 'meta' }, `${p.frequency} · ${UI.fmtNum(p.hoursPerWeek, 1)} h pro Woche und Person · ${p.persons} Personen betroffen`),
        (p.consequences || []).length ? h('div', { class: 'row', style: 'margin-top:8px' }, ...p.consequences.map(c => h('span', { class: 'chip' }, c))) : null),
      sec('Gain: erwarteter Nutzen',
        para('Für die Abteilung', g.department), para('Für das Unternehmen', g.company), para('Erfolgskriterium', g.successCriterion),
        g.deadline ? para('Frist', `${UI.fmtDate(g.deadline)}: ${g.deadlineReason}`) : null),
      sec('Systeme',
        para('Betroffene Systeme', (sy.affected || []).join(', ') || 'Keine Angabe'),
        (sy.replaceable || []).length
          ? h('div', {}, h('p', { class: 'eyebrow' }, 'Ablösbare Systeme'), h('ul', {}, ...sy.replaceable.map(x => h('li', {}, x.system, x.purpose ? `: ${x.purpose}` : ''))))
          : para('Ablösbare Systeme', 'Keine Angabe'),
        (r.links || []).length
          ? h('div', {}, h('p', { class: 'eyebrow' }, 'Links'), h('ul', {}, ...r.links.map(u => h('li', {}, /^https?:\/\//i.test(u) ? h('a', { href: u, target: '_blank', rel: 'noopener' }, u) : u))))
          : null),
      ratingSection(st, r, ev, results),
      commentSection(st, r));

    const resultHint = !results && ev.count > 0
      ? h('p', { class: 'hint', style: 'margin-top:8px' }, Store.isCommittee() ? 'Die Ergebnisse sehen Sie, sobald Sie selbst bewertet haben.' : 'Die Ergebnisse sind sichtbar, sobald die Bewertung abgeschlossen ist.')
      : null;
    const relName = (st.releases.find(x => x.id === r.releaseId) || {}).name;
    const aside = h('div', { class: 'stack' },
      h('section', { class: 'panel' }, h('h3', {}, 'Kennzahlen'),
        h('dl', { class: 'kv' },
          h('dt', {}, 'Einsparpotenzial'), h('dd', {}, `${UI.fmtNum(Logic.savingsHoursPerYear(p, set.weeksPerYear))} h/Jahr`),
          h('dt', {}, 'Bewertungen'), h('dd', {}, `${ev.count} von mind. ${set.minRatings}`),
          h('dt', {}, 'Nutzen-Index'), h('dd', {}, results ? UI.fmtNum(ev.benefit, 2) : '–'),
          h('dt', {}, 'Ø Aufwand'), h('dd', {}, results ? UI.fmtNum(ev.effort, 2) : '–'),
          h('dt', {}, 'Score'), h('dd', {}, results ? UI.fmtNum(ev.score, 2) : '–'),
          h('dt', {}, 'Einordnung'), h('dd', {}, results ? Logic.QUADRANT_LABEL[ev.quadrant] : '–'),
          h('dt', {}, 'Aufwandspunkte'), h('dd', {}, results || r.effortOverride != null ? String(Store.points(r) ?? '–') : '–'),
          h('dt', {}, 'Release'), h('dd', {}, relName || '–')),
        resultHint,
        r.decisionReason ? h('p', { style: 'margin:12px 0 0' }, h('strong', {}, 'Begründung: '), r.decisionReason) : null),
      canEditReq ? h('section', { class: 'panel' },
        h('p', { class: 'hint', style: 'margin-bottom:8px' }, r.status === 'klaerung'
          ? 'Es gibt eine Rückfrage. Ergänzen Sie die Angaben, danach geht die Anforderung zurück an den Product Owner.'
          : 'Sie können die Angaben ändern, solange die Anforderung noch nicht in Bewertung ist.'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { SubmitView.edit(r); App.go('einreichen'); } }, 'Angaben bearbeiten')) : null,
      st.isAdmin ? adminSection(r) : null,
      h('section', { class: 'panel' }, h('h3', {}, 'Statusverlauf'),
        h('ol', { class: 'history' }, ...[...(r.statusHistory || [])].reverse().map(e => h('li', {},
          h('div', {}, UI.pill(e.status)),
          h('span', { class: 'meta' }, UI.fmtDateTime(e.at), ' · ', UI.nameSpan(e.by)),
          e.comment ? h('span', {}, e.comment) : null)))));

    root.append(h('div', { class: 'detail' }, main, aside));
  }

  function ratingSection(st, r, ev, results) {
    const member = Store.isCommittee();
    const openForRating = ['bewertung', 'bewertet'].includes(r.status);
    if (!(member && openForRating) && !(results && (st.isAdmin || member))) return null;
    const mine = Store.myRating(r.id);
    const sec = h('section', { class: 'panel' }, h('h3', {}, 'Bewertung durch das Release Board'));
    if (member && openForRating && st.canWrite !== false) {
      const ids = [...Logic.CRITERIA.map(k => 'rt-' + k), 'rt-comment'];
      const err = h('p', { class: 'err', hidden: true });
      const btn = h('button', { class: 'btn', type: 'button' }, mine ? 'Bewertung aktualisieren' : 'Bewertung speichern');
      btn.addEventListener('click', async () => {
        const rating = {};
        for (const k of Logic.CRITERIA) rating[k] = Number(document.getElementById('rt-' + k).value);
        rating.comment = document.getElementById('rt-comment').value.trim();
        if (!Logic.isValidRating(rating)) { err.textContent = 'Bitte alle fünf Kriterien bewerten.'; err.hidden = false; return; }
        btn.disabled = true;
        const ok = await Store.saveRating(r, rating);
        btn.disabled = false;
        if (ok != null) UI.clearDirty(...ids);
      });
      sec.append(
        h('p', { class: 'hint', style: 'margin-bottom:12px' }, 'Bewerten Sie unabhängig. Die Bewertungen der anderen sehen Sie, nachdem Sie Ihre eigene gespeichert haben.'),
        h('div', { class: 'ratinggrid' }, ...Logic.CRITERIA.map(k => UI.field('rt-' + k, Logic.CRITERIA_LABEL[k],
          UI.select('rt-' + k, [1, 2, 3, 4, 5].map(n => [n, `${n}: ${SCALE[k][n - 1]}`]), mine ? mine[k] : '', { placeholder: 'Bitte wählen' })))),
        h('div', { style: 'margin-top:12px' }, UI.field('rt-comment', 'Kommentar (optional)', h('textarea', { id: 'rt-comment', rows: 2 }, mine ? mine.comment || '' : ''))),
        err,
        h('div', { class: 'row', style: 'margin-top:12px' }, btn));
    }
    if (results) {
      const ids = Object.keys(ev.ratings);
      sec.append(h('div', { class: 'tablewrap', style: 'margin-top:16px' }, h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Kriterium'), ...ids.map(id => h('th', { class: 'num' }, UI.nameSpan(id))), h('th', { class: 'num' }, 'Ø'))),
        h('tbody', {}, ...Logic.CRITERIA.map(k => h('tr', {}, h('td', {}, Logic.CRITERIA_LABEL[k]),
          ...ids.map(id => h('td', { class: 'num' }, ev.ratings[id][k])),
          h('td', { class: 'num' }, h('strong', {}, UI.fmtNum(ev.avg[k], 1)))))))));
      const notes = ids.filter(id => ev.ratings[id].comment);
      if (notes.length) sec.append(h('ul', { class: 'posts', style: 'margin-top:12px' }, ...notes.map(id =>
        h('li', {}, h('p', { class: 'meta' }, UI.nameSpan(id)), h('p', { class: 'body' }, ev.ratings[id].comment)))));
    }
    return sec;
  }

  function commentSection(st, r) {
    const sec = h('section', { class: 'panel' }, h('h3', {}, 'Rückfragen und Antworten'));
    sec.append(comments.length
      ? h('ul', { class: 'posts' }, ...comments.map(c => h('li', {}, h('p', { class: 'meta' }, UI.nameSpan(c.by), ' · ', UI.fmtDateTime(c.at)), h('p', { class: 'body' }, c.text))))
      : h('p', { class: 'note', style: 'margin-bottom:12px' }, 'Noch keine Rückfragen.'));
    if (st.me.id && st.canWrite !== false) {
      const btn = h('button', { class: 'btn', type: 'button' }, 'Senden');
      btn.addEventListener('click', async () => {
        const ta = document.getElementById('cm-text');
        const value = ta.value.trim();
        if (!value) return;
        btn.disabled = true;
        const ok = await Store.addComment(r.id, value);
        btn.disabled = false;
        if (ok != null) { const el = document.getElementById('cm-text'); if (el) { el.value = ''; delete el.dataset.dirty; } }
      });
      sec.append(UI.field('cm-text', 'Neuer Beitrag', h('textarea', { id: 'cm-text', rows: 3, placeholder: 'Rückfrage oder Antwort schreiben' })),
        h('div', { class: 'row', style: 'margin-top:8px' }, btn));
    }
    return sec;
  }

  function adminSection(r) {
    const sec = h('section', { class: 'panel' }, h('h3', {}, 'Product Owner'));
    const targets = Logic.manualTargets(r.status);
    if (targets.length) {
      sec.append(h('div', { class: 'row' }, ...targets.map(to => {
        const label = to === 'eingereicht' ? (r.status === 'klaerung' ? 'Als geklärt markieren' : 'Reaktivieren') : ACTION_LABEL[to];
        return h('button', { class: to === 'abgelehnt' ? 'btn danger small' : 'btn ghost small', type: 'button', onclick: () => doStatus(r, to, label) }, label);
      })));
    } else {
      sec.append(h('p', { class: 'note' }, r.status === 'eingeplant' ? 'Die Einplanung ändern Sie in der Roadmap.' : 'In diesem Status gibt es keine Aktionen.'));
    }
    if (r.status === 'bewertet') sec.append(h('p', { class: 'hint', style: 'margin-top:8px' }, 'Einplanen in ein Release: in der Roadmap.'));
    // Fallback, falls die Mindestanzahl ohne neue Bewertung erreicht wird (z. B. nach Änderung der Einstellungen).
    const ev = Store.evaluation(r);
    if (Logic.shouldMarkRated(r.status, ev.count, Store.settings().minRatings)) {
      sec.append(h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn small', type: 'button', onclick: () => doStatus(r, 'bewertet', 'Als bewertet markieren') }, 'Als bewertet markieren')));
    }
    const inp = h('input', { type: 'text', inputmode: 'decimal', id: 'adm-points', value: r.effortOverride == null ? '' : String(r.effortOverride), placeholder: 'leer = Standard' });
    const save = h('button', { class: 'btn ghost small', type: 'button' }, 'Speichern');
    save.addEventListener('click', async () => {
      const raw = document.getElementById('adm-points').value.trim();
      const n = raw === '' ? null : Logic.parseNum(raw);
      if (n !== null && (!Number.isFinite(n) || n < 0)) { UI.toast('Bitte eine Zahl ab 0 eingeben oder das Feld leeren.', 'err'); return; }
      const ok = await Store.updateRequest(r.id, { effortOverride: n }, 'Aufwandspunkte gespeichert.');
      if (ok != null) UI.clearDirty('adm-points');
    });
    sec.append(h('div', { style: 'margin-top:16px' }, UI.field('adm-points', 'Aufwandspunkte für die Roadmap',
      h('div', { class: 'row' }, h('div', { style: 'flex:1 1 140px' }, inp), save),
      'Leer lassen, um den gerundeten Ø-Aufwand der Bewertungen zu verwenden.')));
    return sec;
  }
  async function doStatus(r, to, label) {
    const reasonLabel = to === 'klaerung' ? 'Ihre Rückfrage an die einreichende Person' : Logic.needsReason(to) ? 'Begründung (für alle sichtbar)' : null;
    const res = await UI.confirmDialog(`#${r.number} «${r.title}»: ${label}?`, { confirmLabel: label, reasonLabel });
    if (!res.ok) return;
    const ok = await Store.changeStatus(r, to, res.reason || '', {}, `Status geändert: ${Logic.STATUS_LABEL[to]}.`);
    if (ok != null && to === 'klaerung') await Store.addComment(r.id, res.reason);
  }

  return { render, select };
})();
