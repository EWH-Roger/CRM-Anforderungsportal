/* Mini-Testframework für Node und Edge headless. */
const __results = [];
function test(name, fn) {
  try { fn(); __results.push({ name, ok: true }); }
  catch (e) { __results.push({ name, ok: false, msg: e && e.message ? e.message : String(e) }); }
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg ? msg + ' ' : '') + 'erwartet ' + b + ', erhalten ' + a);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'Bedingung nicht erfüllt'); }
function report() {
  const fails = __results.filter(r => !r.ok);
  document.getElementById('out').textContent =
    __results.map(r => (r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : ' :: ' + r.msg)).join('\n') +
    '\nSUMMARY ' + (__results.length - fails.length) + '/' + __results.length;
}
