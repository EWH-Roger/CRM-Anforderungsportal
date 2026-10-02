/* Gemeinsame Oberflächen-Helfer. */
const App = { render() {}, go() {} };

const UI = (() => {
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  let toastTimer;
  function toast(message, kind = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = message; t.dataset.kind = kind; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, kind === 'err' ? 7000 : 3500);
  }

  function confirmDialog(message, opts = {}) {
    const dlg = document.getElementById('confirm');
    const reasonWrap = document.getElementById('confirm-reason-wrap');
    const reason = document.getElementById('confirm-reason');
    const err = document.getElementById('confirm-err');
    const okBtn = document.getElementById('confirm-ok');
    document.getElementById('confirm-msg').textContent = message;
    document.getElementById('confirm-reason-label').textContent = opts.reasonLabel || '';
    okBtn.textContent = opts.confirmLabel || 'Bestätigen';
    reasonWrap.hidden = !opts.reasonLabel; reason.value = ''; err.hidden = true;
    const cancelBtn = dlg.querySelector('button[value="cancel"]');
    return new Promise(resolve => {
      // Direkt in den Klick-Handlern auflösen; das close-Ereignis deckt nur Escape ab.
      let done = false;
      const finish = result => {
        if (done) return;
        done = true;
        dlg.removeEventListener('close', onClose);
        if (dlg.open) dlg.close();
        resolve(result);
      };
      const onClose = () => finish({ ok: false });
      okBtn.onclick = e => {
        e.preventDefault();
        if (opts.reasonLabel && !reason.value.trim()) { err.textContent = 'Bitte einen Text eingeben.'; err.hidden = false; reason.focus(); return; }
        finish({ ok: true, reason: reason.value.trim() });
      };
      cancelBtn.onclick = e => { e.preventDefault(); finish({ ok: false }); };
      dlg.addEventListener('close', onClose);
      dlg.showModal();
      if (opts.reasonLabel) reason.focus();
    });
  }

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
  const fmtDateTime = iso => iso ? new Date(iso).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';
  function fmtNum(n, digits = 0) {
    return Number.isFinite(n) ? n.toLocaleString('de-CH', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '–';
  }
  const pill = status => h('span', { class: 'pill s-' + status }, Logic.STATUS_LABEL[status] || status);

  function markDirty(e) { if (e.target && e.target.id) e.target.dataset.dirty = '1'; }
  document.addEventListener('input', markDirty, true);
  document.addEventListener('change', markDirty, true);
  function clearDirty(...ids) { for (const id of ids) { const el = document.getElementById(id); if (el) delete el.dataset.dirty; } }

  // Zeichnet den Container neu und behält dabei Eingaben, Fokus und Scrollposition.
  function preserve(container, renderFn) {
    const saved = {};
    for (const el of container.querySelectorAll('[id][data-dirty]')) {
      saved[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? { checked: el.checked } : { value: el.value };
    }
    const active = document.activeElement;
    const focusId = active && container.contains(active) ? active.id : null;
    let sel = null;
    try { if (focusId && active.selectionStart != null) sel = [active.selectionStart, active.selectionEnd]; } catch (e) { sel = null; }
    const scroll = window.scrollY;
    container.replaceChildren();
    renderFn();
    for (const [id, v] of Object.entries(saved)) {
      const el = document.getElementById(id);
      if (!el || !container.contains(el)) continue;
      if ('checked' in v) el.checked = v.checked; else el.value = v.value;
      el.dataset.dirty = '1';
    }
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el && container.contains(el)) {
        el.focus({ preventScroll: true });
        if (sel && el.setSelectionRange) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* Feldtyp ohne Auswahl */ } }
      }
    }
    window.scrollTo(0, scroll);
  }

  function field(id, label, control, hint) {
    return h('div', { class: 'field' },
      h('label', { for: id }, label),
      hint ? h('p', { class: 'hint' }, hint) : null,
      control,
      h('p', { class: 'err', id: id + '-err', hidden: true }));
  }
  function showErrors(root, errors, keyToId) {
    root.querySelectorAll('p.err[id$="-err"]').forEach(p => { p.hidden = true; p.textContent = ''; });
    root.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    for (const [k, msg] of Object.entries(errors)) {
      const id = keyToId[k];
      const p = id && document.getElementById(id + '-err');
      if (p) { p.textContent = msg; p.hidden = false; }
      const el = id && document.getElementById(id);
      if (el) el.setAttribute('aria-invalid', 'true');
    }
  }
  function select(id, options, value, opts = {}) {
    const s = h('select', { id, 'aria-label': opts.label || null, onchange: opts.onchange || null });
    if (opts.placeholder != null) s.append(h('option', { value: '' }, opts.placeholder));
    for (const o of options) {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      s.append(h('option', { value: v, selected: String(v) === String(value == null ? '' : value) }, l));
    }
    return s;
  }

  async function nameMap(ids) {
    const user = typeof Store !== 'undefined' ? Store.state.user : null;
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!user || !uniq.length) return {};
    const ps = await user.profiles(uniq);
    const out = {};
    for (const id of uniq) out[id] = (ps[id] && ps[id].name) || 'Unbekannte Person';
    return out;
  }
  function nameSpan(id) {
    const s = h('span', { class: 'person' }, id ? '…' : 'Unbekannte Person');
    if (id) nameMap([id]).then(m => { s.textContent = m[id] || 'Unbekannte Person'; });
    return s;
  }

  return { h, toast, confirmDialog, fmtDate, fmtDateTime, fmtNum, pill, preserve, clearDirty, field, showErrors, select, nameMap, nameSpan };
})();
