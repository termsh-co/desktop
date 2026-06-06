#!/usr/bin/env bash
# macOS: opak 1024 kare → icon.icns (squircle maskesini OS uygular; şeffaf kenar kullanma).
# Windows: icon.ico (`tauri icon`, full-bleed app-icon.png).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src/assets/brand/app-icon.png"
PADDED="$ROOT/src/assets/brand/app-icon-macos.png"
ICONS="$ROOT/src-tauri/icons"
ICONSET="$ROOT/src-tauri/icons/AppIcon.iconset"
PAD_SCRIPT="$ROOT/scripts/macos-icon-pad.swift"

if [[ ! -f "$SRC" ]]; then
  echo "Missing source icon: $SRC" >&2
  exit 1
fi

chmod +x "$PAD_SCRIPT"
swift "$PAD_SCRIPT" "$SRC" "$PADDED"

rm -rf "$ICONSET"
mkdir -p "$ICONSET"

add_size() {
  local size="$1"
  local out="$ICONSET/icon_${size}x${size}.png"
  local out2x="$ICONSET/icon_${size}x${size}@2x.png"
  sips -z "$size" "$size" "$PADDED" --out "$out" >/dev/null
  sips -z "$((size * 2))" "$((size * 2))" "$PADDED" --out "$out2x" >/dev/null
}

add_size 16
add_size 32
add_size 128
add_size 256
add_size 512

iconutil -c icns "$ICONSET" -o "$ICONS/icon.icns"
rm -rf "$ICONSET"

echo "Wrote $ICONS/icon.icns (macOS padded)"
