#!/bin/bash
cd "$(dirname "$0")"
echo "Opening Masaref at http://127.0.0.1:8765"
(sleep 1; open "http://127.0.0.1:8765") &
python3 -m http.server 8765
