#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICONS="$ROOT/src-tauri/icons"
SOURCE="${1:-$ICONS/tray-icon@2x.png}"

if [[ ! -f "$SOURCE" ]]; then
  echo "Tray source not found: $SOURCE" >&2
  exit 1
fi

swift "$ROOT/scripts/build-tray-icons.swift" "$SOURCE" "$ICONS"
