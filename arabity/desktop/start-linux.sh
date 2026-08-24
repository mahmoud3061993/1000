#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../dist" && pwd)"
cd "$DIR"
echo "عربيتي: http://127.0.0.1:8765"
(sleep 1; xdg-open "http://127.0.0.1:8765" >/dev/null 2>&1 || open "http://127.0.0.1:8765" >/dev/null 2>&1 || true) &
python3 -m http.server 8765 --bind 127.0.0.1
