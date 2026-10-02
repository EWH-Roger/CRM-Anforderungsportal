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

  // ---- Bewertung ----
  const BENEFIT_KEYS = ['nutzen', 'betroffene', 'dringlichkeit', 'fit'];
  const CRITERIA = [...BENEFIT_KEYS, 'aufwand'];
  const CRITERIA_LABEL = { nutzen: 'Geschäftsnutzen', betroffene: 'Anzahl Betroffene', dringlichkeit: 'Dringlichkeit', fit: 'Strategischer Fit', aufwand: 'Aufwand' };
  const QUADRANT_LABEL = { quickwin: 'Quick Win', gross: 'Grosses Vorhaben', lueckenfueller: 'Lückenfüller', vermeiden: 'Vermeiden' };

  function isValidRating(r) { return !!r && CRITERIA.every(k => Number.isInteger(r[k]) && r[k] >= 1 && r[k] <= 5); }
  function committeeRatings(requestId, ratingDocs, committee) {
    const out = {};
    for (const uid of committee || []) {
      const r = ratingDocs && ratingDocs[uid] && ratingDocs[uid].byRequest ? ratingDocs[uid].byRequest[requestId] : null;
      if (isValidRating(r)) out[uid] = r;
    }
    return out;
  }
  function benefitIndex(avg, weights) {
    let sw = 0, s = 0;
    for (const k of BENEFIT_KEYS) {
      const w = weights && Number.isFinite(weights[k]) ? weights[k] : 1;
      sw += w; s += w * avg[k];
    }
    return sw ? s / sw : 0;
  }
  function score(benefit, effort) { return Math.round((benefit / effort) * 100) / 100; }
  function quadrant(benefit, effort) {
    if (benefit >= 3) return effort < 3 ? 'quickwin' : 'gross';
    return effort < 3 ? 'lueckenfueller' : 'vermeiden';
  }
  function evaluate(requestId, ratingDocs, settings) {
    const ratings = committeeRatings(requestId, ratingDocs, settings.committee);
    const list = Object.values(ratings);
    if (!list.length) return { count: 0, ratings, avg: null, benefit: null, effort: null, score: null, quadrant: null };
    const avg = {};
    for (const k of CRITERIA) avg[k] = list.reduce((sum, r) => sum + r[k], 0) / list.length;
    const benefit = benefitIndex(avg, settings.weights);
    const effort = avg.aufwand;
    return { count: list.length, ratings, avg, benefit, effort, score: score(benefit, effort), quadrant: quadrant(benefit, effort) };
  }
  function effortPoints(request, evaluation) {
    if (request && Number.isFinite(request.effortOverride)) return request.effortOverride;
    return evaluation && evaluation.count ? Math.round(evaluation.avg.aufwand) : null;
  }
  function shouldMarkRated(status, count, minRatings) { return status === 'bewertung' && count >= minRatings; }

  return {
    STATUS_LABEL, STATUSES, RESULTS_VISIBLE, canTransition, manualTargets, needsReason, withStatus,
    BENEFIT_KEYS, CRITERIA, CRITERIA_LABEL, QUADRANT_LABEL, isValidRating, committeeRatings, evaluate,
    benefitIndex, score, quadrant, effortPoints, shouldMarkRated,
  };
})();
