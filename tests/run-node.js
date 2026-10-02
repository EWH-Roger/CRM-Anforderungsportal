/* Führt die Logik-Tests in Node aus: harness, logic und Tests teilen sich einen vm-Kontext. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = vm.createContext({ console });
for (const f of ['harness.js', '../src/logic.js', 'logic.test.js']) {
  const file = path.join(__dirname, f);
  if (fs.existsSync(file)) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: f });
}
const results = vm.runInContext('__results', ctx);
const fails = results.filter(r => !r.ok);
for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : ' :: ' + r.msg));
console.log(`SUMMARY logic ${results.length - fails.length}/${results.length}`);
process.exit(fails.length ? 1 : 0);
