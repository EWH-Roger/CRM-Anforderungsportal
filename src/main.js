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
    const roles = [s.isAdmin && 'Product Owner', Store.isCommittee() && 'Release Board'].filter(Boolean).join(' · ') || (s.canWrite === false ? 'Lesezugriff' : 'Einreichende');
    el.replaceChildren(UI.h('strong', {}, s.me.name || 'Angemeldet'), ' · ' + roles);
  }
  function renderBanner(s) {
    const el = document.getElementById('banner');
    let msg = null;
    if (s.error) msg = s.error;
    else if (s.ready && !s.me.id) msg = 'Bitte melden Sie sich in claude.ai an, um Anforderungen einzureichen und zu bewerten.';
    else if (s.ready && s.canWrite === false) {
      msg = 'Sie haben Lesezugriff. Zum Einreichen und Bewerten braucht es die Freigabe «Contributor». Bitte beim Product Owner melden.';
    } else if (s.ready && s.isAdmin && s.settings && Logic.backupDue(s.settings.lastExportAt, new Date().toISOString())) {
      msg = 'Datensicherung: Die Daten wurden seit über 30 Tagen nicht exportiert. Bitte unter «Einstellungen» die Daten als CSV exportieren und ablegen.';
    } else if (s.ready && s.db && s.loaded.settings && !s.settings) {
      msg = s.isAdmin
        ? 'Das Portal ist noch nicht eingerichtet. Bitte unter «Einstellungen» die Wertelisten prüfen und speichern.'
        : 'Das Portal wird gerade eingerichtet. Einreichen ist möglich, sobald der Product Owner die Einrichtung abgeschlossen hat.';
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
    const n = s.ready ? Store.notifications().length : 0;
    document.querySelector('#tabs a[data-tab="anforderungen"]').replaceChildren('Anforderungen',
      ...(n ? [' ', UI.h('span', { class: 'badge', 'aria-label': n + ' neu' }, n)] : []));
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
  // Farbschema: System, Hell oder Dunkel; die Wahl gilt pro Person und Browser.
  const THEME_KEY = 'portal-theme';
  function applyTheme(choice) {
    const root = document.documentElement;
    if (choice === 'light' || choice === 'dark') root.setAttribute('data-portal-theme', choice);
    else root.removeAttribute('data-portal-theme');
    for (const b of document.querySelectorAll('header .theme button')) {
      b.setAttribute('aria-pressed', String(b.dataset.themeChoice === (choice === 'light' || choice === 'dark' ? choice : 'system')));
    }
  }
  document.querySelector('header .theme').addEventListener('click', e => {
    const b = e.target.closest('button[data-theme-choice]');
    if (!b) return;
    const choice = b.dataset.themeChoice;
    try { if (choice === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, choice); } catch (err) { /* Speicher gesperrt: Wahl gilt nur bis zum Neuladen */ }
    applyTheme(choice);
  });
  let storedTheme = null;
  try { storedTheme = localStorage.getItem(THEME_KEY); } catch (err) { storedTheme = null; }
  applyTheme(storedTheme);

  App.render = render; App.go = go;
  tab = fromHash();
  Store.subscribe(render);
  render();
  Store.init();
})();
