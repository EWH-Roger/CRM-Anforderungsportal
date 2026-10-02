/* Navigation, Kopfzeile, Hinweise und Start. */
(() => {
  const VIEWS = { einreichen: SubmitView, anforderungen: RequestsView, auswertung: AnalysisView, roadmap: RoadmapView, einstellungen: SettingsView };
  const view = document.getElementById('view');
  let tab = 'einreichen';

  function fromHash() {
    let raw = '';
    try { raw = decodeURIComponent((location.hash || '').slice(1)); } catch (e) { raw = ''; }
    if (raw.startsWith('r-')) { RequestsView.select(raw.slice(2)); return 'anforderungen'; }
    return VIEWS[raw] ? raw : 'einreichen';
  }
  function go(t) {
    tab = VIEWS[t] ? t : 'einreichen';
    try { history.replaceState(null, '', '#' + tab); } catch (e) { /* Rahmen erlaubt keine Hash-Änderung */ }
    window.scrollTo(0, 0);
    render();
  }
  function renderWho(s) {
    const el = document.getElementById('who');
    if (!s.me.id) { el.replaceChildren(); return; }
    const roles = [s.isAdmin && 'Administration', Store.isCommittee() && 'Gremium'].filter(Boolean).join(' · ') || (s.canWrite === false ? 'Lesezugriff' : 'Einreichende');
    el.replaceChildren(UI.h('strong', {}, s.me.name || 'Angemeldet'), ' · ' + roles);
  }
  function renderBanner(s) {
    const el = document.getElementById('banner');
    let msg = null;
    if (s.error) msg = s.error;
    else if (s.ready && s.db && s.loaded.settings && !s.settings) {
      msg = s.isAdmin
        ? 'Das Portal ist noch nicht eingerichtet. Bitte unter «Einstellungen» die Wertelisten prüfen und speichern.'
        : 'Das Portal wird gerade eingerichtet. Einreichen ist möglich, sobald die Administration die Einrichtung abgeschlossen hat.';
    } else if (s.ready && s.canWrite === false) {
      msg = 'Sie haben Lesezugriff. Zum Einreichen und Bewerten braucht es die Freigabe «Contributor». Bitte bei der Administration melden.';
    }
    el.hidden = !msg; el.textContent = msg || '';
  }
  function render() {
    const s = Store.state;
    if (tab === 'einstellungen' && s.ready && !s.isAdmin) tab = 'anforderungen';
    document.getElementById('tab-settings').hidden = !s.isAdmin;
    for (const a of document.querySelectorAll('#tabs a')) {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    renderWho(s); renderBanner(s);
    if (!s.ready) return;
    UI.preserve(view, () => VIEWS[tab].render(view, s));
  }

  document.getElementById('tabs').addEventListener('click', e => {
    const a = e.target.closest('a[data-tab]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.tab === 'anforderungen') RequestsView.select(null);
    go(a.dataset.tab);
  });
  App.render = render; App.go = go;
  tab = fromHash();
  Store.subscribe(render);
  render();
  Store.init();
})();
