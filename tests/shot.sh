#!/usr/bin/env bash
# Screenshot von dist/dev.html. Verwendung: tests/shot.sh <reiter|r-q1> [rolle] [breite] [dark]
set -uo pipefail
cd "$(dirname "$0")/.."
source tests/env.sh
tab="${1:-einreichen}"; role="${2:-admin}"; width="${3:-1280}"; theme="${4:-light}"
extra="--blink-settings=preferredColorScheme=1"; [ "$theme" = "dark" ] && extra="--blink-settings=preferredColorScheme=0"
out="$(pwd -W 2>/dev/null || pwd)/dist/shot-$tab-$role-$width-$theme.png"
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --window-size="$width,1800" --virtual-time-budget=4000 $extra \
  --screenshot="$out" "$(file_url dist/dev.html)?seed=1&role=$role#$tab" >/dev/null 2>&1
echo "$out"
