/* Hilfen für automatisierte Klicktests in dist/dev.html (nur lokal, mit Mock). */
const E2E = (() => {
  const results = [];
  const wait = (ms = 50) => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  async function until(fn, msg, tries = 80) {
    for (let i = 0; i < tries; i++) { const v = fn(); if (v) return v; await wait(50); }
    throw new Error('Zeitüberschreitung: ' + msg);
  }
  const el = s => { const e = typeof s === 'string' ? $(s) : s; if (!e) throw new Error('Element fehlt: ' + s); return e; };
  function setVal(s, v) { const e = el(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
  function check(s, on = true) { const e = el(s); e.checked = on; e.dispatchEvent(new Event('change', { bubbles: true })); }
  const click = s => el(s).click();
  const byText = (sel, text) => $$(sel).find(e => e.textContent.trim().includes(text));
  const clickText = (sel, text) => { const e = byText(sel, text); if (!e) throw new Error(`Kein ${sel} mit Text «${text}»`); e.click(); };
  const toast = () => { const t = $('#toast'); return t && !t.hidden ? t.textContent : ''; };
  function expect(cond, msg) { if (!cond) throw new Error(msg); }
  async function run(steps, opts = {}) {
    if (opts.waitLoaded === false) await until(() => Store.state.ready, 'Store bereit');
    else await until(() => Store.state.ready && Store.state.loaded.settings && Store.state.loaded.requests, 'Store bereit');
    await wait(150);
    for (const [name, fn] of steps) {
      try { await fn(); results.push('PASS ' + name); }
      catch (e) { results.push('FAIL ' + name + ' :: ' + (e && e.message ? e.message : e)); }
      await wait(150);
    }
    const pre = document.createElement('pre');
    pre.id = 'e2e-out';
    pre.textContent = results.join('\n') + '\nSUMMARY e2e ' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length;
    document.body.append(pre);
  }
  return { $, $$, wait, until, setVal, check, click, byText, clickText, toast, expect, run };
})();
