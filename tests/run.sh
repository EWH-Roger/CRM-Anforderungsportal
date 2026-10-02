#!/usr/bin/env bash
# Logik-Tests in Node; UI-Tests (ab Task 6) in Edge headless. Exit 1 bei Fehlern.
set -uo pipefail
here="$(cd "$(dirname "$0")" && (pwd -W 2>/dev/null || pwd))"
NODE="$(command -v node || echo "/c/Program Files/nodejs/node.exe")"
status=0
"$NODE" "$here/run-node.js" || status=1
if [ -f "$here/run.html" ]; then
  EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  dom="$("$EDGE" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=3000 --dump-dom "file:///$here/run.html" 2>/dev/null)"
  text="$(printf '%s' "$dom" | sed -n '/<pre id="out">/,/<\/pre>/p' | sed 's/<[^>]*>//g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&amp;/\&/g')"
  printf '%s\n' "$text"
  printf '%s' "$text" | grep -q '^SUMMARY' || { echo "Kein UI-Testergebnis erhalten"; status=1; }
  printf '%s' "$text" | grep -q '^FAIL' && status=1
fi
exit $status
