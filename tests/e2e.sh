#!/usr/bin/env bash
# Automatischer Klicktest. Verwendung: tests/e2e.sh <name> <rolle> <seed 0|1> <reiter>
set -uo pipefail
cd "$(dirname "$0")/.."
name="$1"; role="${2:-admin}"; seed="${3:-1}"; tab="${4:-einreichen}"
root="$(pwd -W 2>/dev/null || pwd)"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
q="role=$role&e2e=$name"; [ "$seed" = "1" ] && q="seed=1&$q"
dom="$("$EDGE" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=30000 --dump-dom "file:///$root/dist/dev.html?$q#$tab" 2>/dev/null)"
text="$(printf '%s' "$dom" | sed -n '/<pre id="e2e-out">/,/<\/pre>/p' | sed 's/<[^>]*>//g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&amp;/\&/g')"
printf '%s\n' "$text"
printf '%s' "$text" | grep -q '^SUMMARY' || { echo "Kein e2e-Ergebnis ($name)"; exit 1; }
printf '%s' "$text" | grep -q '^FAIL' && exit 1
exit 0
