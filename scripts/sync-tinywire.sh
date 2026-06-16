#!/usr/bin/env bash
# Sync Tiny Wire's vendored lib/ into this consumer, verbatim.
# Do NOT hand-edit the vendored files — put overrides in app-tokens.css / app.css.
# See the design system's lib/CONSUMING.md for the full contract.
set -euo pipefail

# --- config (per consumer) ---
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TW_REPO_DIR="${TW_REPO_DIR:-$(cd "$REPO_ROOT/.." && pwd)/tiny-wire}"  # sibling checkout
DEST="$REPO_ROOT/lib"                                                # vendored location in this repo
FILES=(globals.css tokens.css base.css components.css)               # the vendored unit (Profile A: vanilla)
# --- end config ---

if [ ! -f "$TW_REPO_DIR/VERSION" ] || [ ! -d "$TW_REPO_DIR/lib" ]; then
  echo "error: Tiny Wire source not found at $TW_REPO_DIR (set TW_REPO_DIR=/path/to/tiny-wire)" >&2
  exit 1
fi

ver="$(tr -d '[:space:]' < "$TW_REPO_DIR/VERSION")"
mkdir -p "$DEST"
for f in "${FILES[@]}"; do
  cp "$TW_REPO_DIR/lib/$f" "$DEST/$f"
done
printf '%s\n' "$ver" > "$DEST/.tinywire-version"
echo "Synced Tiny Wire v$ver -> $DEST (${FILES[*]}). Review visually before deploy."
