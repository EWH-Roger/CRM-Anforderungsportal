#!/usr/bin/env bash
# Plattformunabhängige Pfade für Windows (Git Bash), macOS und Linux. Wird per «source» geladen.
# Setzt BROWSER (Edge oder Chrome, headless), NODE und die Funktion file_url <pfad>.
# Ein anderer Browser lässt sich mit der Umgebungsvariable BROWSER vorgeben.

if [ -z "${BROWSER:-}" ]; then
  for b in \
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "$(command -v microsoft-edge 2>/dev/null)" \
    "$(command -v google-chrome 2>/dev/null)" \
    "$(command -v chromium 2>/dev/null)"; do
    [ -n "$b" ] && [ -x "$b" ] && { BROWSER="$b"; break; }
  done
fi
[ -n "${BROWSER:-}" ] || { echo "FEHLER: Kein Browser gefunden (Edge oder Chrome). Pfad mit BROWSER=... vorgeben." >&2; exit 1; }

NODE="$(command -v node || echo "/c/Program Files/nodejs/node.exe")"

# Absoluter Pfad als file://-URL. Unter Git Bash liefert pwd -W «C:/...», sonst «/...».
file_url() {
  local p
  p="$(cd "$(dirname "$1")" && (pwd -W 2>/dev/null || pwd))/$(basename "$1")"
  case "$p" in /*) echo "file://$p" ;; *) echo "file:///$p" ;; esac
}
