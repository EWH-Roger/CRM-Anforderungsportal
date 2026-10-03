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
  // Blindbewertung: Mitglieder des Release Boards sehen Ergebnisse erst nach der eigenen Bewertung oder nach der Einplanung.
  function canSeeResults({ isAdmin, isMember, hasRated, status }) {
    if (isAdmin || hasRated) return true;
    if (isMember) return status === 'eingeplant' || status === 'umgesetzt';
    return RESULTS_VISIBLE.includes(status);
  }

  // ---- Einreichung ----
  const FREQUENCIES = ['täglich', 'wöchentlich', 'monatlich', 'seltener'];
  const CONSEQUENCES = ['Fehler', 'Doppelerfassung', 'Medienbrüche', 'Kundenreklamationen', 'Compliance-Risiko'];
  const LIMITS = { titleMax: 120, situationMin: 80, gainMin: 50 };
  const REQUIRED_KEYS = ['title', 'department', 'crmArea', 'pain.situation', 'pain.frequency', 'pain.hoursPerWeek', 'pain.persons', 'gain.department', 'gain.successCriterion'];

  function parseNum(v) {
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim().replace(',', '.');
    return s === '' ? NaN : Number(s);
  }
  const len = v => String(v == null ? '' : v).trim().length;

  function validateSubmission(f) {
    const e = {};
    const p = f.pain || {}, g = f.gain || {};
    if (!len(f.title)) e.title = 'Bitte einen Titel angeben.';
    else if (len(f.title) > LIMITS.titleMax) e.title = `Der Titel darf höchstens ${LIMITS.titleMax} Zeichen lang sein.`;
    if (!len(f.department)) e.department = 'Bitte die Abteilung wählen.';
    if (!len(f.crmArea)) e.crmArea = 'Bitte den betroffenen CRM-Bereich wählen.';
    if (len(p.situation) < LIMITS.situationMin) e['pain.situation'] = `Bitte die heutige Situation genauer beschreiben: mindestens ${LIMITS.situationMin} Zeichen (aktuell ${len(p.situation)}).`;
    if (!FREQUENCIES.includes(p.frequency)) e['pain.frequency'] = 'Bitte die Häufigkeit wählen.';
    const hours = parseNum(p.hoursPerWeek);
    if (!Number.isFinite(hours) || hours < 0) e['pain.hoursPerWeek'] = 'Bitte den Zeitaufwand in Stunden pro Woche angeben (0 oder mehr, z. B. 1,5).';
    const persons = parseNum(p.persons);
    if (!Number.isInteger(persons) || persons < 1) e['pain.persons'] = 'Bitte die Anzahl betroffener Personen als ganze Zahl ab 1 angeben.';
    if (len(g.department) < LIMITS.gainMin) e['gain.department'] = `Bitte den Nutzen für die Abteilung genauer beschreiben: mindestens ${LIMITS.gainMin} Zeichen (aktuell ${len(g.department)}).`;
    if (!len(g.successCriterion)) e['gain.successCriterion'] = 'Bitte ein messbares Erfolgskriterium angeben.';
    if (len(g.deadline) && !len(g.deadlineReason)) e['gain.deadlineReason'] = 'Bitte den Grund für die Frist angeben.';
    const badLink = (f.links || []).find(u => !/^https?:\/\/\S+$/i.test(u));
    if (badLink) e.links = `Dieser Link ist ungültig: ${badLink}. Links beginnen mit http:// oder https://.`;
    return { valid: Object.keys(e).length === 0, errors: e, quality: quality(f, e) };
  }
  function quality(f, errors) {
    const optional = [
      len(f.useCase) > 0,
      ((f.pain && f.pain.consequences) || []).length > 0,
      len(f.gain && f.gain.company) > 0,
      ((f.systems && f.systems.affected) || []).length > 0,
      ((f.systems && f.systems.replaceable) || []).length > 0,
      (f.links || []).length > 0,
    ];
    const got = REQUIRED_KEYS.filter(k => !errors[k]).length + 0.5 * optional.filter(Boolean).length;
    const total = REQUIRED_KEYS.length + 0.5 * optional.length;
    return Math.round((got / total) * 100);
  }
  function savingsHoursPerYear(pain, weeksPerYear) {
    const h = parseNum(pain && pain.hoursPerWeek), n = parseNum(pain && pain.persons);
    if (!Number.isFinite(h) || !Number.isFinite(n)) return 0;
    return Math.round(h * n * weeksPerYear);
  }

  // ---- Hinweise im Portal ----
  // Leitet aus dem Statusverlauf ab, was für diese Person seit `since` neu ist. Eigene Aktionen zählen nicht.
  function notifications({ requests, meId, isAdmin, isMember, hasRated, since }) {
    if (!since) return [];
    const out = [];
    for (const r of requests) {
      (r.statusHistory || []).forEach((e, i) => {
        if (!(e.at > since) || e.by === meId) return;
        const suffix = e.comment ? ': ' + e.comment : '';
        let text = null;
        if (isAdmin && e.status === 'eingereicht') text = (i === 0 ? 'Neue Anforderung' : 'Erneut eingereicht') + suffix;
        else if (isMember && e.status === 'bewertung' && r.status === 'bewertung' && !hasRated(r.id)) text = 'Zur Bewertung freigegeben';
        else if (r.submittedBy === meId) text = STATUS_LABEL[e.status] + suffix;
        if (text) out.push({ requestId: r.id, number: r.number, title: r.title, status: e.status, at: e.at, text });
      });
    }
    return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  }

  // ---- Roadmap ----
  function suggestRoadmap(backlog, releases) {
    const open = releases.filter(r => r.status === 'offen').slice().sort((a, b) => a.order - b.order)
      .map(r => ({ id: r.id, free: r.capacity - (r.used || 0) }));
    const items = backlog.filter(b => Number.isFinite(b.points) && b.points >= 0).slice()
      .sort((a, b) => (b.score - a.score) || (a.number - b.number));
    const out = [];
    for (const it of items) {
      const rel = open.find(r => r.free >= it.points);
      if (rel) { rel.free -= it.points; out.push({ requestId: it.id, releaseId: rel.id }); }
    }
    return out;
  }
  function releaseUsage(releaseId, items) {
    return items.filter(i => i.releaseId === releaseId).reduce((sum, i) => sum + (Number.isFinite(i.points) ? i.points : 0), 0);
  }

  // ---- Kennzahlen ----
  function nextNumber(requests) { return requests.reduce((m, r) => Math.max(m, Number(r.number) || 0), 0) + 1; }
  function countBy(items, keyFn) {
    const m = new Map();
    for (const it of items) {
      const keys = keyFn(it);
      for (const k of [].concat(keys == null ? [] : keys)) {
        if (k == null || k === '') continue;
        m.set(k, (m.get(k) || 0) + 1);
      }
    }
    return [...m.entries()].map(([key, count]) => ({ key, count }))
      .sort((a, b) => (b.count - a.count) || String(a.key).localeCompare(String(b.key), 'de'));
  }
  function leadTimeDays(history) {
    const s = (history || []).find(x => x.status === 'eingereicht');
    const b = (history || []).find(x => x.status === 'bewertet');
    if (!s || !b) return null;
    return Math.max(0, (Date.parse(b.at) - Date.parse(s.at)) / 86400000);
  }
  function average(nums) {
    const v = nums.filter(Number.isFinite);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  }
  function replacementPotential(requests) {
    return countBy(requests, r => [...new Set(((r.systems && r.systems.replaceable) || [])
      .map(x => String(x.system || '').trim()).filter(Boolean))]);
  }

  // ---- CSV ----
  function csvCell(v) {
    if (v === null || v === undefined) return '';
    let s = String(v);
    if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = "'" + s;
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(columns, rows) {
    const lines = [columns.map(c => csvCell(c.label)).join(';'), ...rows.map(r => columns.map(c => csvCell(r[c.key])).join(';'))];
    return '﻿' + lines.join('\r\n');
  }

  return {
    STATUS_LABEL, STATUSES, RESULTS_VISIBLE, canTransition, manualTargets, needsReason, withStatus,
    BENEFIT_KEYS, CRITERIA, CRITERIA_LABEL, QUADRANT_LABEL, isValidRating, committeeRatings, evaluate,
    benefitIndex, score, quadrant, effortPoints, shouldMarkRated, canSeeResults,
    FREQUENCIES, CONSEQUENCES, LIMITS, parseNum, validateSubmission, savingsHoursPerYear,
    suggestRoadmap, releaseUsage, nextNumber, countBy, leadTimeDays, average, replacementPotential, toCsv, notifications,
  };
})();
