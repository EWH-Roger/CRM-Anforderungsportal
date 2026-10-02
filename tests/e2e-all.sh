#!/usr/bin/env bash
# Baut die Seite und führt alle Klicktests aus. Exit 1, wenn einer scheitert.
set -uo pipefail
cd "$(dirname "$0")/.."
bash build.sh >/dev/null || exit 1
status=0; total=0; failed=0
run() { total=$((total+1)); out="$(bash tests/e2e.sh "$@")"; if [ $? -ne 0 ]; then failed=$((failed+1)); status=1; echo "--- e2e $*"; echo "$out" | grep -v '^PASS'; fi; }
run settings admin 0 einstellungen
run submit business 1 einreichen
run submit-readonly viewer 1 einreichen
run rate gremium 1 r-q3
run admin admin 1 r-q4
run analysis admin 1 auswertung
run roadmap admin 1 roadmap
for t in einreichen anforderungen auswertung roadmap r-q1 r-q3; do run nonull business 1 "$t"; run nonull admin 1 "$t"; done
run nonull admin 1 einstellungen
run fix-admin admin 1 r-q3
run fix-gremium gremium 1 r-q3
run fix-access viewer 1 einreichen
run fix-access anonym 1 einreichen
run fix-slow admin 1 einstellungen slow=1
for t in einreichen anforderungen auswertung roadmap einstellungen r-q1; do run narrow admin 1 "$t"; done
echo "SUMMARY e2e-läufe $((total-failed))/$total"
exit $status
