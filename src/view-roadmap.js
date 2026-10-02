/* Ansicht «Roadmap»: bewertete Anforderungen den Releases zuordnen. */
const RoadmapView = (() => {
  const { h } = UI;
  let proposal = null;
  const openReq = id => { RequestsView.select(id); App.go('anforderungen'); };

  function render(root, st) {
    const admin = st.isAdmin;
    const all = st.requests.map(r => ({ r, ev: Store.evaluation(r), points: Store.points(r) }));
    const backlog = all.filter(x => x.r.status === 'bewertet')
      .sort((a, b) => ((b.ev.score ?? -1) - (a.ev.score ?? -1)) || (a.r.number - b.r.number));
    const planned = all.filter(x => x.r.releaseId);
    const openRel = st.releases.filter(x => x.status === 'offen');
    const doneRel = st.releases.filter(x => x.status === 'ausgeliefert');
    const usage = id => Logic.releaseUsage(id, planned.map(x => ({ releaseId: x.r.releaseId, points: x.points })));

    const suggest = () => {
      proposal = Logic.suggestRoadmap(
        backlog.map(x => ({ id: x.r.id, number: x.r.number, score: x.ev.score ?? 0, points: x.points })),
        openRel.map(rel => ({ ...rel, used: usage(rel.id) })));
      App.render();
    };
    root.append(h('div', { class: 'spread' },
      h('div', {}, h('h2', {}, 'Roadmap nach Releases'),
        h('p', { class: 'note' }, admin ? 'Karten per Drag & Drop oder über die Auswahl auf der Karte einem Release zuordnen.' : 'Geplante Umsetzung der bewerteten Anforderungen.')),
      admin ? h('button', { class: 'btn', type: 'button', disabled: !backlog.length || !openRel.length, onclick: suggest }, 'Automatisch vorschlagen') : null));
    if (proposal) root.append(proposalPanel(st, proposal));
    if (!st.releases.length) {
      root.append(h('p', { class: 'note', style: 'margin-bottom:12px' }, admin
        ? 'Es gibt noch keine Releases. Legen Sie unter «Einstellungen» das erste Release mit seiner Kapazität an.'
        : 'Es sind noch keine Releases geplant.'));
    }
    root.append(h('div', { class: 'board' },
      column(st, { id: '', name: 'Backlog' }, backlog, 0, admin, openRel),
      ...openRel.map(rel => column(st, rel, planned.filter(x => x.r.releaseId === rel.id), usage(rel.id), admin, openRel))));
    if (doneRel.length) {
      root.append(h('details', { class: 'panel', style: 'margin-top:16px' },
        h('summary', {}, `Ausgelieferte Releases (${doneRel.length})`),
        ...doneRel.map(rel => h('div', { style: 'margin-top:12px' }, h('h3', {}, rel.name),
          h('ul', {}, ...planned.filter(x => x.r.releaseId === rel.id).map(x => h('li', {}, `#${x.r.number} ${x.r.title}`)))))));
    }
  }

  function column(st, rel, list, used, admin, openRel) {
    const isBacklog = !rel.id;
    const over = !isBacklog && used > rel.capacity;
    const col = h('section', { class: 'col', 'aria-label': rel.name });
    const head = h('div', { class: 'col-head' }, h('h3', {}, h('span', {}, rel.name), h('span', { class: 'load' }, isBacklog ? String(list.length) : '')));
    if (isBacklog) {
      head.append(h('div', { class: 'load' }, 'Bewertet, noch nicht eingeplant'));
    } else {
      const pct = rel.capacity > 0 ? Math.min(100, (used / rel.capacity) * 100) : 100;
      head.append(...[
        h('div', { class: 'meter' + (over ? ' over' : '') }, h('span', { style: `width:${pct}%` })),
        h('div', { class: 'load' + (over ? ' overbooked' : '') }, over
          ? `Überbucht: ${UI.fmtNum(used)} von ${UI.fmtNum(rel.capacity)} Punkten`
          : `${UI.fmtNum(used)} von ${UI.fmtNum(rel.capacity)} Punkten verplant`),
        admin ? h('div', {}, h('button', { class: 'btn ghost small', type: 'button', disabled: !list.length, onclick: () => deliver(rel) }, 'Als ausgeliefert markieren')) : null].filter(Boolean));
    }
    col.append(head);
    if (!list.length) col.append(h('p', { class: 'note', style: 'font-size:var(--step--1)' }, isBacklog ? 'Keine bewerteten Anforderungen offen.' : 'Noch nichts eingeplant.'));
    for (const x of list) col.append(card(x, admin, openRel));
    if (admin) {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', e => {
        e.preventDefault(); col.classList.remove('over');
        const id = e.dataTransfer.getData('text/plain');
        const r = st.requests.find(q => q.id === id);
        if (r && (r.releaseId || '') !== rel.id) Store.assign(r, rel.id || null);
      });
    }
    return col;
  }

  function card(x, admin, openRel) {
    const { r, ev, points } = x;
    const c = h('article', { class: 'card', draggable: admin ? 'true' : null },
      h('button', { class: 'linkbtn t', type: 'button', onclick: () => openReq(r.id) }, `#${r.number} ${r.title}`),
      h('div', { class: 'm' },
        h('span', {}, 'Score ', h('strong', {}, ev.count && Store.canSeeResults(r) ? UI.fmtNum(ev.score, 2) : '–')),
        h('span', {}, `${points ?? '–'} Punkte`),
        ev.quadrant && Store.canSeeResults(r) ? h('span', { class: 'chip' }, Logic.QUADRANT_LABEL[ev.quadrant]) : null));
    if (admin) {
      c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; });
      c.append(UI.select('as-' + r.id, [['', 'Backlog'], ...openRel.map(rel => [rel.id, rel.name])], r.releaseId || '',
        { label: `Release für #${r.number}`, onchange: e => Store.assign(r, e.target.value || null) }));
    }
    return c;
  }

  function proposalPanel(st, pairs) {
    const relName = Object.fromEntries(st.releases.map(x => [x.id, x.name]));
    const req = Object.fromEntries(st.requests.map(x => [x.id, x]));
    return h('section', { class: 'panel proposal' }, h('h3', {}, 'Vorschlag'),
      pairs.length
        ? h('ul', {}, ...pairs.map(p => h('li', {}, `#${req[p.requestId] ? req[p.requestId].number : '?'} ${req[p.requestId] ? req[p.requestId].title : ''} → ${relName[p.releaseId]}`)))
        : h('p', { class: 'note' }, 'Keine Anforderung passt in die freie Kapazität der offenen Releases.'),
      h('div', { class: 'row', style: 'margin-top:12px' },
        pairs.length ? h('button', { class: 'btn', type: 'button', onclick: async () => { const p = proposal; proposal = null; App.render(); await Store.applySuggestion(p); } }, 'Vorschlag übernehmen') : null,
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { proposal = null; App.render(); } }, 'Verwerfen')));
  }

  async function deliver(rel) {
    const res = await UI.confirmDialog(`Release ${rel.name} als ausgeliefert markieren? Alle eingeplanten Anforderungen erhalten den Status «Umgesetzt».`, { confirmLabel: 'Als ausgeliefert markieren' });
    if (res.ok) await Store.deliverRelease(rel);
  }

  return { render };
})();
