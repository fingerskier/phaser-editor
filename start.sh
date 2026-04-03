#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
export PORT="${1:-7433}"
export PHASER_PROJECT_DIR="${2:-.}"
echo "Starting Phaser Editor on http://localhost:$PORT"
(sleep 1 && open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null) &
exec node "$DIR/build/index.js"
