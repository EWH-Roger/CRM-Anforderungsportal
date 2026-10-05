#!/usr/bin/env bash
# Logik-Tests in Node; UI-Tests im Browser headless. Exit 1 bei Fehlern.
set -uo pipefail
cd "$(dirname "$0")"
source ./env.sh
status=0
"$NODE" run-node.js || status=1
if [ -f run.html ]; then
  dom="$("$BROWSER" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=3000 --dump-dom "$(file_url run.html)" 2>/dev/null)"
  text="$(printf '%s' "$dom" | sed -n '/<pre id="out">/,/<\/pre>/p' | sed 's/<[^>]*>//g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&amp;/\&/g')"
  printf '%s\n' "$text"
  printf '%s' "$text" | grep -q '^SUMMARY' || { echo "Kein UI-Testergebnis erhalten"; status=1; }
  printf '%s' "$text" | grep -q '^FAIL' && status=1
fi
exit $status
