/* Zugriff auf Datenbank, Benutzer und Downloads; hält den gemeinsamen Zustand. */
const Store = (() => {
  const DEFAULT_SETTINGS = {
    committee: [], weights: { nutzen: 1, betroffene: 1, dringlichkeit: 1, fit: 1 },
    minRatings: 3, weeksPerYear: 46, departments: [], crmAreas: [], systems: [],
  };
  const state = {
    ready: false, db: null, user: null, downloads: null, me: { id: null, name: '' }, isAdmin: false, canWrite: null,
    settings: null, loaded: { settings: false, requests: false, releases: false, ratings: false },
    requests: [], releases: [], ratings: {}, error: null,
  };
  const listeners = new Set();
  let queued = false;
  function emit() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; listeners.forEach(fn => fn(state)); });
  }
  const subscribe = fn => { listeners.add(fn); };

  function errorText(e) {
    switch (e && e.code) {
      case 'invalid_argument': return 'Speichern nicht möglich. Prüfen Sie, ob Sie die Freigabe «Contributor» haben, und versuchen Sie es erneut.';
      case 'quota_exceeded': return 'Der Speicher des Portals ist voll. Bitte den Product Owner informieren.';
      case 'resource_exhausted': return 'Zu viele Anfragen in kurzer Zeit. Bitte einen Moment warten und erneut versuchen.';
      case 'revoked': return 'Der Zugriff auf das Portal wurde entzogen. Bitte die Seite neu laden.';
      case 'not_granted': case 'capability_disabled': case 'capability_removed':
        return 'Die Datenbank ist in dieser Ansicht nicht verfügbar. Bitte das Portal angemeldet in claude.ai öffnen.';
      default: return 'Die Verbindung zur Datenbank ist gestört. Bitte später erneut versuchen.';
    }
  }
  function onError(e) { state.error = errorText(e); emit(); }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const now = () => new Date().toISOString();

  async function init() {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') {
      state.error = 'Diese Seite funktioniert nur in claude.ai. Bitte den Link zum Portal dort öffnen.';
      state.ready = true; emit(); return;
    }
    const [db, user, downloads] = await Promise.all([c.use('db'), c.use('user'), c.use('downloads')]);
    Object.assign(state, { db, user, downloads });
    if (user) {
      state.me = await user.me();
      state.isAdmin = await user.canEdit();
      state.canWrite = await user.can('data.write');
    }
    if (!db) {
      state.error = 'Die Datenbank des Portals ist in dieser Ansicht nicht verfügbar. Bitte angemeldet in claude.ai öffnen.';
      state.ready = true; emit(); return;
    }
    db.doc('config/settings').onSnapshot(s => {
      state.settings = s.exists ? { ...DEFAULT_SETTINGS, ...s.data() } : null;
      if (s.exists || !s.metadata.fromCache) state.loaded.settings = true;
      emit();
    }, onError);
    db.collection('requests').onSnapshot(s => {
      state.requests = s.docs.map(d => ({ ...d.data(), id: d.id }));
      if (!s.metadata.fromCache) state.loaded.requests = true;
      emit();
    }, onError);
    db.collection('releases').onSnapshot(s => {
      state.releases = s.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (a.order || 0) - (b.order || 0));
      if (!s.metadata.fromCache) state.loaded.releases = true;
      emit();
    }, onError);
    db.collection('ratings').onSnapshot(s => {
      const r = {};
      for (const d of s.docs) r[d.id] = d.data();
      state.ratings = r;
      if (!s.metadata.fromCache) state.loaded.ratings = true;
      emit();
    }, onError);
    state.ready = true; emit();
  }

  const settings = () => state.settings || DEFAULT_SETTINGS;
  const isCommittee = () => !!state.me.id && settings().committee.includes(state.me.id);
  const evaluation = r => Logic.evaluate(r.id, state.ratings, settings());
  const myRating = requestId => {
    const mine = state.me.id && state.ratings[state.me.id];
    return (mine && mine.byRequest && mine.byRequest[requestId]) || null;
  };
  const canSeeResults = r => Logic.canSeeResults({ isAdmin: state.isAdmin, isMember: isCommittee(), hasRated: !!myRating(r.id), status: r.status });
  const points = r => Logic.effortPoints(r, evaluation(r));

  // Führt einen Schreibvorgang aus; bei «unavailable» genau ein zweiter Versuch. Fehler → Toast und null.
  async function write(fn, okMsg) {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fn();
        if (okMsg) UI.toast(okMsg);
        return res === undefined ? true : res;
      } catch (e) {
        if (e && e.code === 'unavailable' && attempt === 0) { await sleep(300 + Math.random() * 700); continue; }
        UI.toast(e && e.message && !e.code ? e.message : errorText(e), 'err');
        return null;
      }
    }
  }

  const saveSettings = next => write(() => state.db.doc('config/settings').set(next), 'Einstellungen gespeichert.');

  function createRequest(data) {
    return write(async () => {
      const ref = state.db.collection('requests').doc();
      const at = now();
      const number = Logic.nextNumber(state.requests);
      await ref.set({
        ...data, number, status: 'eingereicht',
        statusHistory: [{ status: 'eingereicht', at, by: state.me.id, comment: '' }],
        submittedBy: state.me.id, submittedAt: at, updatedAt: at, releaseId: null, effortOverride: null, decisionReason: null,
      });
      return { id: ref.id, number };
    });
  }
  const updateRequest = (id, patch, okMsg) => write(() => state.db.doc('requests/' + id).update({ ...patch, updatedAt: now() }), okMsg);
  function changeStatus(r, to, comment, extra = {}, okMsg) {
    r = state.requests.find(x => x.id === r.id) || r;
    let patch;
    try { patch = Logic.withStatus(r, to, state.me.id, now(), comment); }
    catch (e) { UI.toast(e.message, 'err'); return Promise.resolve(null); }
    return updateRequest(r.id, { ...patch, ...extra }, okMsg);
  }

  async function saveRating(r, rating) {
    const ref = state.db.doc('ratings/' + state.me.id);
    const entry = { ...rating, updatedAt: now() };
    const ok = await write(async () => {
      const exists = (await ref.get()).exists;
      return exists ? ref.update({ byRequest: { [r.id]: entry } }) : ref.set({ byRequest: { [r.id]: entry } });
    }, 'Bewertung gespeichert.');
    if (ok == null) return null;
    const mine = (state.ratings[state.me.id] && state.ratings[state.me.id].byRequest) || {};
    const docs = { ...state.ratings, [state.me.id]: { byRequest: { ...mine, [r.id]: entry } } };
    const ev = Logic.evaluate(r.id, docs, settings());
    if (Logic.shouldMarkRated(r.status, ev.count, settings().minRatings)) {
      await changeStatus(r, 'bewertet', `Mindestanzahl von ${settings().minRatings} Bewertungen erreicht`);
    }
    return ok;
  }

  function watchComments(requestId, fn) {
    return state.db.collection('requests/' + requestId + '/comments').orderBy('at')
      .onSnapshot(s => fn(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
  }
  const addComment = (requestId, text) =>
    write(() => state.db.collection('requests/' + requestId + '/comments').add({ by: state.me.id, at: now(), text }));

  function saveRelease(rel) {
    const { id, ...data } = rel;
    return write(() => (id ? state.db.doc('releases/' + id) : state.db.collection('releases').doc()).set(data), 'Release gespeichert.');
  }
  const deleteRelease = id => write(() => state.db.doc('releases/' + id).delete(), 'Release gelöscht.');
  function assign(r, releaseId) {
    if (releaseId) {
      if (r.status === 'eingeplant') return updateRequest(r.id, { releaseId });
      return changeStatus(r, 'eingeplant', '', { releaseId });
    }
    return changeStatus(r, 'bewertet', 'Zurück in den Backlog');
  }
  async function deliverRelease(rel) {
    const ok = await write(() => state.db.doc('releases/' + rel.id).update({ status: 'ausgeliefert' }));
    if (ok == null) return null;
    for (const r of state.requests.filter(x => x.releaseId === rel.id && x.status === 'eingeplant')) {
      await changeStatus(r, 'umgesetzt', `Release ${rel.name} ausgeliefert`);
    }
    UI.toast(`Release ${rel.name} ist als ausgeliefert markiert.`);
    return true;
  }
  async function applySuggestion(pairs) {
    let n = 0;
    for (const p of pairs) {
      const r = state.requests.find(x => x.id === p.requestId);
      if (r && (await assign(r, p.releaseId)) != null) n++;
    }
    UI.toast(`${n} Anforderungen eingeplant.`);
  }

  async function exportCsv() {
    if (!state.downloads) { UI.toast('Der Download ist in dieser Ansicht nicht verfügbar.', 'err'); return; }
    const s = settings();
    const names = await UI.nameMap([...state.requests.map(r => r.submittedBy), ...Object.keys(state.ratings)]);
    const relName = Object.fromEntries(state.releases.map(r => [r.id, r.name]));
    const fix = n => Number.isFinite(n) ? n.toFixed(2) : '';
    const rows = state.requests.slice().sort((a, b) => a.number - b.number).map(r => {
      const ev = evaluation(r), p = r.pain || {}, g = r.gain || {}, sy = r.systems || {};
      return {
        number: r.number, title: r.title, status: Logic.STATUS_LABEL[r.status], department: r.department, crmArea: r.crmArea,
        useCase: r.useCase, situation: p.situation, frequency: p.frequency, hours: p.hoursPerWeek, persons: p.persons,
        consequences: (p.consequences || []).join(', '), gainDepartment: g.department, gainCompany: g.company,
        success: g.successCriterion, deadline: g.deadline, deadlineReason: g.deadlineReason,
        affected: (sy.affected || []).join(', '),
        replaceable: (sy.replaceable || []).map(x => x.purpose ? `${x.system} (${x.purpose})` : x.system).join(', '),
        links: (r.links || []).join(' '), savings: Logic.savingsHoursPerYear(p, s.weeksPerYear), ratings: ev.count,
        benefit: fix(ev.benefit), effort: fix(ev.effort), score: fix(ev.score),
        quadrant: ev.quadrant ? Logic.QUADRANT_LABEL[ev.quadrant] : '', points: points(r), release: relName[r.releaseId] || '',
        submittedBy: names[r.submittedBy] || '', submittedAt: r.submittedAt, decisionReason: r.decisionReason,
      };
    });
    const cols = [
      ['number', 'Nr.'], ['title', 'Titel'], ['status', 'Status'], ['department', 'Abteilung'], ['crmArea', 'CRM-Bereich'],
      ['useCase', 'Use Case'], ['situation', 'Heutige Situation'], ['frequency', 'Häufigkeit'], ['hours', 'h pro Woche und Person'],
      ['persons', 'Betroffene Personen'], ['consequences', 'Folgen'], ['gainDepartment', 'Nutzen Abteilung'],
      ['gainCompany', 'Nutzen Unternehmen'], ['success', 'Erfolgskriterium'], ['deadline', 'Frist'], ['deadlineReason', 'Grund Frist'],
      ['affected', 'Betroffene Systeme'], ['replaceable', 'Ablösbare Systeme'], ['links', 'Links'], ['savings', 'Einsparpotenzial h/Jahr'],
      ['ratings', 'Anzahl Bewertungen'], ['benefit', 'Nutzen-Index'], ['effort', 'Ø Aufwand'], ['score', 'Score'], ['quadrant', 'Einordnung'],
      ['points', 'Aufwandspunkte'], ['release', 'Release'], ['submittedBy', 'Eingereicht von'], ['submittedAt', 'Eingereicht am'],
      ['decisionReason', 'Begründung'],
    ].map(([key, label]) => ({ key, label }));
    const byId = Object.fromEntries(state.requests.map(r => [r.id, r]));
    const rrows = [];
    for (const [uid, doc] of Object.entries(state.ratings)) {
      for (const [rid, rt] of Object.entries((doc && doc.byRequest) || {})) {
        const r = byId[rid];
        if (!r) continue;
        rrows.push({
          number: r.number, title: r.title, person: names[uid] || '', committee: s.committee.includes(uid) ? 'ja' : 'nein',
          nutzen: rt.nutzen, betroffene: rt.betroffene, dringlichkeit: rt.dringlichkeit, fit: rt.fit, aufwand: rt.aufwand,
          comment: rt.comment, updatedAt: rt.updatedAt,
        });
      }
    }
    rrows.sort((a, b) => a.number - b.number);
    const rcols = [['number', 'Nr.'], ['title', 'Titel'], ['person', 'Person'], ['committee', 'Im Release Board'],
      ...Logic.CRITERIA.map(k => [k, Logic.CRITERIA_LABEL[k]]), ['comment', 'Kommentar'], ['updatedAt', 'Geändert am']]
      .map(([key, label]) => ({ key, label }));
    const date = new Date().toISOString().slice(0, 10);
    for (const [filename, data] of [[`anforderungen-${date}.csv`, Logic.toCsv(cols, rows)], [`bewertungen-${date}.csv`, Logic.toCsv(rcols, rrows)]]) {
      try { await state.downloads.save({ filename, data }); }
      catch (e) {
        if (!e || e.code !== 'declined') UI.toast('Der Export konnte nicht gespeichert werden. Bitte erneut versuchen.', 'err');
        return;
      }
    }
  }

  return {
    DEFAULT_SETTINGS, state, init, subscribe, settings, isCommittee, evaluation, myRating, canSeeResults, points,
    saveSettings, createRequest, updateRequest, changeStatus, saveRating, watchComments, addComment,
    saveRelease, deleteRelease, assign, deliverRelease, applySuggestion, exportCsv,
  };
})();
