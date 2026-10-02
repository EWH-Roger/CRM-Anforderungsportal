/* Reine Fachlogik des CRM-Anforderungsportals. Keine DOM- und keine Datenbankzugriffe. */
const Logic = (() => {
  'use strict';

  // ---- Status ----
  const STATUS_LABEL = {
    eingereicht: 'Eingereicht', klaerung: 'In Klärung', bewertung: 'In Bewertung', bewertet: 'Bewertet',
    eingeplant: 'Eingeplant', umgesetzt: 'Umgesetzt', abgelehnt: 'Abgelehnt', zurueckgestellt: 'Zurückgestellt',
  };
  const STATUSES = Object.keys(STATUS_LABEL);
  const TRANSITIONS = {
    eingereicht: ['klaerung', 'bewertung', 'abgelehnt', 'zurueckgestellt'],
    klaerung: ['eingereicht', 'abgelehnt', 'zurueckgestellt'],
    bewertung: ['bewertet', 'abgelehnt', 'zurueckgestellt'],
    bewertet: ['eingeplant', 'abgelehnt', 'zurueckgestellt'],
    eingeplant: ['bewertet', 'umgesetzt'],
    umgesetzt: [],
    abgelehnt: [],
    zurueckgestellt: ['eingereicht'],
  };
  const MANUAL_TARGETS = ['eingereicht', 'klaerung', 'bewertung', 'abgelehnt', 'zurueckgestellt'];
  const REASON_REQUIRED = ['klaerung', 'abgelehnt', 'zurueckgestellt'];
  const RESULTS_VISIBLE = ['bewertet', 'eingeplant', 'umgesetzt'];
  const CLEARS_RELEASE = ['bewertet', 'eingereicht', 'abgelehnt', 'zurueckgestellt'];

  function canTransition(from, to) { return (TRANSITIONS[from] || []).includes(to); }
  function manualTargets(from) { return (TRANSITIONS[from] || []).filter(s => MANUAL_TARGETS.includes(s)); }
  function needsReason(to) { return REASON_REQUIRED.includes(to); }
  function withStatus(request, to, by, at, comment) {
    if (!canTransition(request.status, to)) {
      throw new Error(`Der Wechsel von «${STATUS_LABEL[request.status] || request.status}» zu «${STATUS_LABEL[to] || to}» ist nicht erlaubt.`);
    }
    const patch = { status: to, statusHistory: [...(request.statusHistory || []), { status: to, at, by, comment: comment || '' }] };
    if (to === 'abgelehnt' || to === 'zurueckgestellt') patch.decisionReason = comment || '';
    if (to === 'eingereicht') patch.decisionReason = null;
    if (CLEARS_RELEASE.includes(to)) patch.releaseId = null;
    return patch;
  }

  return { STATUS_LABEL, STATUSES, RESULTS_VISIBLE, canTransition, manualTargets, needsReason, withStatus };
})();
