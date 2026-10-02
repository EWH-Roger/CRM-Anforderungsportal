/* Tests für src/ui.js (laufen in Edge headless) */
test('h fügt Benutzertext wörtlich ein', () => {
  const el = UI.h('p', {}, '<img src=x onerror="window.__xss=1"><b>fett</b>');
  eq(el.children.length, 0); eq(el.textContent, '<img src=x onerror="window.__xss=1"><b>fett</b>'); ok(!window.__xss);
});
test('h: Attribute, Listener, ausgelassene Werte', () => {
  let clicked = 0;
  const el = UI.h('button', { class: 'btn', disabled: true, title: null, hidden: false, onclick: () => clicked++, 'data-x': 0 }, 'A', null, ['B', false]);
  eq(el.className, 'btn'); ok(el.hasAttribute('disabled')); ok(!el.hasAttribute('title')); ok(!el.hasAttribute('hidden'));
  eq(el.getAttribute('data-x'), '0'); eq(el.textContent, 'AB'); el.disabled = false; el.click(); eq(clicked, 1);
});
test('preserve behält geänderte Eingaben und den Fokus', () => {
  const box = document.getElementById('sandbox');
  const draw = () => box.append(UI.h('input', { id: 't-a', value: 'alt' }), UI.h('input', { id: 't-b', value: 'fix' }));
  UI.preserve(box, draw);
  const a = document.getElementById('t-a'); a.value = 'neu getippt'; a.dispatchEvent(new Event('input', { bubbles: true })); a.focus();
  UI.preserve(box, draw);
  eq(document.getElementById('t-a').value, 'neu getippt'); eq(document.getElementById('t-b').value, 'fix');
  eq(document.activeElement.id, 't-a');
  UI.clearDirty('t-a'); UI.preserve(box, draw); eq(document.getElementById('t-a').value, 'alt');
  box.replaceChildren();
});
test('fmtNum und fmtDate', () => {
  eq(UI.fmtNum(NaN), '–'); eq(UI.fmtNum(null), '–'); ok(UI.fmtNum(1.234, 2).startsWith('1')); eq(UI.fmtDate(''), '–');
  eq(UI.fmtDate('2026-10-02T10:00:00Z'), '02.10.2026');
});
