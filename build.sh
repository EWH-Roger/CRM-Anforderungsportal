#!/usr/bin/env bash
# Setzt src/ zu einer einzigen veröffentlichbaren Seite zusammen.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
JS="src/logic.js src/ui.js src/store.js src/view-settings.js src/view-submit.js src/view-requests.js src/view-analysis.js src/view-roadmap.js src/main.js"
present=""
for f in $JS; do [ -f "$f" ] && present="$present $f"; done
if grep -l '</script' $present >/dev/null 2>&1; then echo "FEHLER: '</script' im JavaScript"; exit 1; fi
{
  sed '/<!-- SCRIPTS -->/,$d' src/page.html
  echo '<script>'
  for f in $present; do cat "$f"; echo; done
  echo '</script>'
  sed '1,/<!-- SCRIPTS -->/d' src/page.html
} > dist/anforderungsportal.html
logo="data:image/png;base64,$(base64 -w0 assets/ewh-logo.png)"
sed -i "s|{{LOGO}}|$logo|" dist/anforderungsportal.html
{
  echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
  if [ -f tests/mock-claude.js ]; then echo '<script>'; cat tests/mock-claude.js; echo '</script>'; fi
  cat dist/anforderungsportal.html
  echo '</body></html>'
} > dist/dev.html
echo "dist/anforderungsportal.html: $(wc -c < dist/anforderungsportal.html) Bytes"
