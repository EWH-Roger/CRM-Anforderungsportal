/* Ansicht «Auswertung»: Kennzahlen, Nutzen/Aufwand-Matrix, Rangliste, Verteilungen. */
const AnalysisView = (() => {
  const { h } = UI;
  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs = {}, ...kids) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
    for (const c of kids.flat()) if (c !== null && c !== undefined) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }

  function render(root, st) {
    const set = Store.settings();
    const reqs = st.requests;
    if (!reqs.length) {
      root.append(h('p', { class: 'empty' }, st.loaded.requests || !st.db
        ? 'Noch keine Daten. Sobald Anforderungen eingereicht und bewertet sind, erscheinen hier Matrix, Rangliste und Kennzahlen.'
        : 'Daten werden geladen …'));
      return;
    }
    const rated = reqs.map(r => ({ r, ev: Store.evaluation(r) })).filter(x => x.ev.count > 0 && Store.canSeeResults(x.r));
    const active = reqs.filter(r => r.status !== 'abgelehnt');
    const savings = active.reduce((sum, r) => sum + Logic.savingsHoursPerYear(r.pain, set.weeksPerYear), 0);
    const lead = Logic.average(reqs.map(r => Logic.leadTimeDays(r.statusHistory)));
    const count = s => reqs.filter(r => r.status === s).length;
    root.append(h('div', { class: 'stack' },
      h('div', { class: 'kpis' },
        kpi(UI.fmtNum(reqs.length), 'Anforderungen gesamt'),
        kpi(UI.fmtNum(count('bewertung')), 'in Bewertung'),
        kpi(UI.fmtNum(count('eingeplant')), 'eingeplant'),
        kpi(`${UI.fmtNum(savings)} h`, 'Einsparpotenzial pro Jahr, ohne abgelehnte'),
        kpi(lead == null ? '–' : `${UI.fmtNum(lead, 1)} Tage`, 'Ø Durchlaufzeit bis «Bewertet»')),
      h('section', { class: 'panel' }, h('h2', {}, 'Nutzen/Aufwand-Matrix'),
        rated.length ? matrix(rated) : h('p', { class: 'note' }, 'Noch keine abgeschlossenen Bewertungen.'),
        rated.length ? h('p', { class: 'hint', style: 'margin-top:8px' }, 'Ein Punkt pro Anforderung. Fahren Sie über einen Punkt für Details, ein Klick öffnet die Anforderung.') : null),
      rated.length ? ranking(rated) : null,
      h('div', { class: 'grid2' },
        bars('Nach Status', Logic.countBy(reqs, r => Logic.STATUS_LABEL[r.status])),
        bars('Nach CRM-Bereich', Logic.countBy(reqs, r => r.crmArea)),
        bars('Nach Abteilung', Logic.countBy(reqs, r => r.department)),
        bars('Ablösepotenzial: genannte Systeme', Logic.replacementPotential(active), 'Noch keine ablösbaren Systeme genannt.'))));
  }
  const kpi = (v, l) => h('div', { class: 'kpi' }, h('div', { class: 'v' }, v), h('div', { class: 'l' }, l));

  function matrix(rated) {
    const W = 640, H = 420, m = { l: 52, r: 24, t: 16, b: 52 };
    const x = v => m.l + ((v - 1) / 4) * (W - m.l - m.r);
    const y = v => H - m.b - ((v - 1) / 4) * (H - m.t - m.b);
    const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': 'Streudiagramm: Nutzen-Index gegen Ø Aufwand je Anforderung. Die gleichen Werte stehen in der Rangliste.' });
    for (let i = 1; i <= 5; i++) {
      g.append(
        svg('line', { class: 'grid', x1: x(i), x2: x(i), y1: y(1), y2: y(5) }),
        svg('line', { class: 'grid', x1: x(1), x2: x(5), y1: y(i), y2: y(i) }),
        svg('text', { x: x(i), y: y(1) + 18, 'text-anchor': 'middle' }, i),
        svg('text', { x: x(1) - 10, y: y(i) + 4, 'text-anchor': 'end' }, i));
    }
    g.append(
      svg('line', { class: 'divider', x1: x(3), x2: x(3), y1: y(1), y2: y(5) }),
      svg('line', { class: 'divider', x1: x(1), x2: x(5), y1: y(3), y2: y(3) }),
      svg('text', { x: (x(1) + x(5)) / 2, y: H - 10, 'text-anchor': 'middle' }, 'Ø Aufwand →'),
      svg('text', { x: 14, y: (y(1) + y(5)) / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${(y(1) + y(5)) / 2})` }, 'Nutzen-Index →'));
    const q = (label, qx, qy, anchor) => svg('text', { class: 'qlabel', x: qx, y: qy, 'text-anchor': anchor }, label);
    g.append(
      q(Logic.QUADRANT_LABEL.quickwin, x(1) + 8, y(5) + 16, 'start'), q(Logic.QUADRANT_LABEL.gross, x(5) - 8, y(5) + 16, 'end'),
      q(Logic.QUADRANT_LABEL.lueckenfueller, x(1) + 8, y(1) - 8, 'start'), q(Logic.QUADRANT_LABEL.vermeiden, x(5) - 8, y(1) - 8, 'end'));
    const seen = new Map();
    const withLabels = rated.length <= 20;
    for (const { r, ev } of rated) {
      const key = ev.effort.toFixed(1) + '|' + ev.benefit.toFixed(1);
      const k = seen.get(key) || 0;
      seen.set(key, k + 1);
      const cx = x(ev.effort) + k * 14, cy = y(ev.benefit);
      const pt = svg('g', { class: 'pt', tabindex: 0, role: 'link', 'aria-label': `#${r.number} ${r.title}: Nutzen ${UI.fmtNum(ev.benefit, 2)}, Aufwand ${UI.fmtNum(ev.effort, 2)}, Score ${UI.fmtNum(ev.score, 2)}` },
        svg('title', {}, `#${r.number} ${r.title}\nNutzen ${UI.fmtNum(ev.benefit, 2)}, Aufwand ${UI.fmtNum(ev.effort, 2)}, Score ${UI.fmtNum(ev.score, 2)}`),
        svg('circle', { class: 'hit', cx, cy, r: 16 }),
        svg('circle', { cx, cy, r: 7 }),
        withLabels ? svg('text', { x: cx + 11, y: cy + 4 }, '#' + r.number) : null);
      pt.addEventListener('click', () => App.open(r.id));
      pt.addEventListener('keydown', e => { if (e.key === 'Enter') App.open(r.id); });
      g.append(pt);
    }
    return g;
  }

  function ranking(rated) {
    const rows = rated.slice().sort((a, b) => (b.ev.score - a.ev.score) || (a.r.number - b.r.number));
    const heads = [['Rang', 'num'], ['Nr.', 'num'], ['Titel'], ['Nutzen-Index', 'num'], ['Ø Aufwand', 'num'], ['Score', 'num'], ['Einordnung'], ['Status']];
    return h('section', { class: 'panel' }, h('h2', {}, 'Rangliste nach Score'),
      h('div', { class: 'tablewrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ...heads.map(([t, c]) => h('th', { class: c || null }, t)))),
        h('tbody', {}, ...rows.map(({ r, ev }, i) => h('tr', { class: 'click', tabindex: 0, onclick: () => App.open(r.id), onkeydown: e => { if (e.key === 'Enter') App.open(r.id); } },
          h('td', { class: 'num' }, i + 1), h('td', { class: 'num' }, '#' + r.number), h('td', {}, r.title),
          h('td', { class: 'num' }, UI.fmtNum(ev.benefit, 2)), h('td', { class: 'num' }, UI.fmtNum(ev.effort, 2)),
          h('td', { class: 'num' }, h('strong', {}, UI.fmtNum(ev.score, 2))), h('td', {}, Logic.QUADRANT_LABEL[ev.quadrant]), h('td', {}, UI.pill(r.status))))))));
  }

  function bars(title, data, emptyText = 'Keine Daten.') {
    const max = Math.max(1, ...data.map(d => d.count));
    return h('section', { class: 'panel' }, h('h2', {}, title),
      data.length
        ? h('ul', { class: 'bars' }, ...data.map(d => h('li', {},
            h('span', { class: 'name' }, d.key),
            h('span', { class: 'track' }, h('span', { class: 'fill', style: `width:${(d.count / max) * 100}%` })),
            h('span', { class: 'val' }, d.count))))
        : h('p', { class: 'note' }, emptyText));
  }

  // Kleine Matrix für die Detailansicht: alle sichtbaren Anforderungen grau, die aktuelle hervorgehoben.
  function miniMatrix(rated, currentId) {
    const W = 240, H = 170, m = 14;
    const x = v => m + ((v - 1) / 4) * (W - 2 * m);
    const y = v => H - m - ((v - 1) / 4) * (H - 2 * m);
    const cur = rated.find(o => o.r.id === currentId);
    const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mini-matrix', role: 'img',
      'aria-label': cur ? `Position von #${cur.r.number} in der Nutzen/Aufwand-Matrix: ${Logic.QUADRANT_LABEL[cur.ev.quadrant]}` : 'Nutzen/Aufwand-Matrix' },
      svg('rect', { class: 'frame', x: m, y: m, width: W - 2 * m, height: H - 2 * m }),
      svg('line', { class: 'divider', x1: x(3), x2: x(3), y1: y(1), y2: y(5) }),
      svg('line', { class: 'divider', x1: x(1), x2: x(5), y1: y(3), y2: y(3) }),
      svg('text', { x: x(1) + 4, y: y(5) + 12 }, Logic.QUADRANT_LABEL.quickwin),
      svg('text', { x: x(5) - 4, y: y(1) - 4, 'text-anchor': 'end' }, Logic.QUADRANT_LABEL.vermeiden),
      svg('text', { x: W / 2, y: H - 2, 'text-anchor': 'middle' }, 'Aufwand'),
      svg('text', { x: 9, y: H / 2, 'text-anchor': 'middle', transform: `rotate(-90 9 ${H / 2})` }, 'Nutzen'));
    for (const o of rated) if (o.r.id !== currentId) g.append(svg('circle', { class: 'other', cx: x(o.ev.effort), cy: y(o.ev.benefit), r: 3.5 }));
    if (cur) g.append(svg('circle', { class: 'current', cx: x(cur.ev.effort), cy: y(cur.ev.benefit), r: 6.5 }));
    return g;
  }

  return { render, miniMatrix };
})();
