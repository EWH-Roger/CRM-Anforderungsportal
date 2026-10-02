/* Nur für lokale Sichtprüfungen: simuliert window.claude (db, user, downloads) im Speicher.
   URL-Parameter: ?seed=1 lädt TESTDATEN, ?role=admin|gremium|business|viewer|anonym */
(() => {
  const docs = new Map();
  const subs = new Set();
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const segs = p => p.split('/').length;
  const meta = { fromCache: false, hasPendingWrites: false };
  const snapDoc = path => { const d = docs.get(path); return { id: path.split('/').pop(), exists: d !== undefined, data: () => clone(d), metadata: meta }; };
  function runQuery(q) {
    let list = [...docs.keys()].filter(p => p.startsWith(q.path + '/') && segs(p) === segs(q.path) + 1).map(snapDoc);
    for (const [f, op, v] of q.wheres) {
      list = list.filter(d => { const x = d.data()[f];
        return op === '==' ? x === v : op === '!=' ? x !== v : op === '<' ? x < v : op === '<=' ? x <= v : op === '>' ? x > v
          : op === '>=' ? x >= v : op === 'in' ? v.includes(x) : op === 'array-contains' ? Array.isArray(x) && x.includes(v) : true; });
    }
    if (q.order) { const [f, dir] = q.order; list.sort((a, b) => { const x = a.data()[f], y = b.data()[f]; const c = x < y ? -1 : x > y ? 1 : 0; return dir === 'desc' ? -c : c; }); }
    else list.sort((a, b) => (a.id < b.id ? -1 : 1));
    if (q.lim) list = list.slice(0, q.lim);
    return { docs: list, size: list.length, empty: !list.length, docChanges: () => [], metadata: meta };
  }
  const deliver = s => s.fn(s.kind === 'doc' ? snapDoc(s.path) : runQuery(s.q));
  function notify() { for (const s of subs) setTimeout(() => deliver(s), 0); }
  function merge(a, b) {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) {
      out[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v;
    }
    return out;
  }
  let n = 0;
  const newId = () => 'm' + Date.now().toString(36) + (n++);
  const role = new URLSearchParams(location.search).get('role') || 'admin';
  const readOnly = role === 'viewer';
  const deny = () => { throw { code: 'invalid_argument', message: 'Nur Lesezugriff (Mock)' }; };
  function docRef(path) {
    return {
      id: path.split('/').pop(), path,
      get: async () => snapDoc(path),
      set: async d => { if (readOnly) deny(); docs.set(path, clone(d)); notify(); },
      update: async d => { if (readOnly) deny(); if (!docs.has(path)) throw { code: 'invalid_argument', message: 'Dokument fehlt' }; docs.set(path, merge(docs.get(path), clone(d))); notify(); },
      delete: async () => { if (readOnly) deny(); docs.delete(path); notify(); },
      onSnapshot: fn => { const s = { kind: 'doc', path, fn }; subs.add(s); setTimeout(() => deliver(s), 0); return () => subs.delete(s); },
      collection: p => colRef(path + '/' + p),
    };
  }
  function query(q) {
    return {
      where: (f, op, v) => query({ ...q, wheres: [...q.wheres, [f, op, v]] }),
      orderBy: (f, dir = 'asc') => query({ ...q, order: [f, dir] }),
      limit: k => query({ ...q, lim: k }),
      get: async () => runQuery(q),
      onSnapshot: fn => { const s = { kind: 'col', q, fn }; subs.add(s); setTimeout(() => deliver(s), 0); return () => subs.delete(s); },
    };
  }
  function colRef(path) {
    return { ...query({ path, wheres: [], order: null, lim: 0 }), path,
      doc: id => docRef(path + '/' + (id || newId())),
      add: async d => { const r = docRef(path + '/' + newId()); await r.set(d); return r; } };
  }
  const PEOPLE = { u_admin: 'Test Administration', u_gremium: 'Test Gremium', u_business: 'Test Business', u_viewer: 'Test Lesend' };
  const prof = id => ({ id, name: PEOPLE[id] || '', avatarUrl: '', color: '#0B6CB8', email: null, isMe: id === 'u_' + role, guest: false });
  const me = role === 'anonym'
    ? { id: null, name: '', avatarUrl: '', color: '#888', email: null, isOwner: false, canEdit: false }
    : { ...prof('u_' + role), isOwner: role === 'admin', canEdit: role === 'admin' };
  const user = {
    isOwner: async () => me.isOwner, canEdit: async () => me.canEdit, can: async () => !readOnly && role !== 'anonym',
    me: async () => me, id: async () => me.id, name: async () => me.name,
    profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, prof(id)])),
    search: async q => Object.keys(PEOPLE).map(prof).filter(p => p.name.toLowerCase().includes(String(q).toLowerCase())),
  };
  const downloads = { save: async ({ filename, data }) => { console.log('DOWNLOAD', filename, String(data).slice(0, 300)); return { status: 'saved' }; } };
  window.claude = { use: async name => ({ db: { doc: docRef, collection: colRef }, user, downloads })[name] || null };

  if (new URLSearchParams(location.search).has('seed')) {
    const t = d => new Date(Date.UTC(2026, 8, d, 9)).toISOString();
    const hist = (...steps) => steps.map(([status, d, by]) => ({ status, at: t(d), by, comment: '' }));
    docs.set('config/settings', { committee: ['u_admin', 'u_gremium'], weights: { nutzen: 1, betroffene: 1, dringlichkeit: 1, fit: 1 },
      minRatings: 2, weeksPerYear: 46, departments: ['Verkauf', 'Kundendienst', 'Marketing'],
      crmAreas: ['Kontakte und Firmen', 'Verträge', 'Kampagnen', 'Reporting'], systems: ['Excel', 'Outlook', 'Access-Datenbank Anlässe'] });
    docs.set('releases/r1', { name: '2027.1', order: 1, capacity: 6, status: 'offen' });
    docs.set('releases/r2', { name: '2027.2', order: 2, capacity: 6, status: 'offen' });
    const base = (num, title, dept, area, status, history, extra = {}) => ({
      number: num, title, department: dept, crmArea: area, useCase: '',
      pain: { situation: 'TESTDATEN: Beschreibung der heutigen Situation mit genügend Text, damit die Mindestlänge von achtzig Zeichen erreicht ist.', frequency: 'wöchentlich', hoursPerWeek: 2, persons: 5, consequences: ['Doppelerfassung'] },
      gain: { department: 'TESTDATEN: Nutzen für die Abteilung mit ausreichend Text für die Mindestlänge.', company: '', successCriterion: 'TESTDATEN: messbares Kriterium', deadline: null, deadlineReason: '' },
      systems: { affected: ['Excel'], replaceable: [{ system: 'Excel', purpose: 'Liste' }] }, links: [],
      status, statusHistory: history, submittedBy: 'u_business', submittedAt: history[0].at, updatedAt: history[history.length - 1].at,
      releaseId: null, effortOverride: null, decisionReason: null, ...extra });
    docs.set('requests/q1', base(1, 'Test: Offerten aus dem CRM erstellen', 'Verkauf', 'Verträge', 'bewertet', hist(['eingereicht', 1, 'u_business'], ['bewertung', 2, 'u_admin'], ['bewertet', 6, 'u_gremium'])));
    docs.set('requests/q2', base(2, 'Test: Kampagnenantworten automatisch erfassen', 'Marketing', 'Kampagnen', 'eingeplant', hist(['eingereicht', 3, 'u_business'], ['bewertung', 4, 'u_admin'], ['bewertet', 9, 'u_gremium'], ['eingeplant', 10, 'u_admin']), { releaseId: 'r1' }));
    docs.set('requests/q3', base(3, 'Test: Reklamationen dem Vertrag zuordnen', 'Kundendienst', 'Kontakte und Firmen', 'bewertung', hist(['eingereicht', 12, 'u_business'], ['bewertung', 13, 'u_admin'])));
    docs.set('requests/q4', base(4, 'Test: Monatsreport ohne Excel', 'Verkauf', 'Reporting', 'eingereicht', hist(['eingereicht', 20, 'u_business'])));
    const RT = (a, b, c, d, e) => ({ nutzen: a, betroffene: b, dringlichkeit: c, fit: d, aufwand: e, comment: '', updatedAt: t(6) });
    docs.set('ratings/u_admin', { byRequest: { q1: RT(5, 4, 4, 4, 2), q2: RT(3, 3, 2, 4, 4), q3: RT(4, 3, 5, 3, 3) } });
    docs.set('ratings/u_gremium', { byRequest: { q1: RT(4, 4, 3, 5, 2), q2: RT(3, 2, 3, 3, 4) } });
  }
})();
