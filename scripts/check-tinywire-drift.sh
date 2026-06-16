#!/usr/bin/env bash
# Fail if the vendored Tiny Wire files have drifted from the pinned source
# (stale version, or hand-edited). Run before deploy / in CI.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TW_REPO_DIR="${TW_REPO_DIR:-$(cd "$REPO_ROOT/.." && pwd)/tiny-wire}"
DEST="$REPO_ROOT/lib"
FILES=(globals.css tokens.css base.css components.css)

if [ ! -f "$TW_REPO_DIR/VERSION" ]; then
  echo "error: Tiny Wire source not found at $TW_REPO_DIR (set TW_REPO_DIR)" >&2
  exit 2
fi

src_ver="$(tr -d '[:space:]' < "$TW_REPO_DIR/VERSION")"
pinned="$(tr -d '[:space:]' < "$DEST/.tinywire-version" 2>/dev/null || echo '?')"
status=0

if [ "$src_ver" != "$pinned" ]; then
  echo "DRIFT: pinned v$pinned but source is v$src_ver — run scripts/sync-tinywire.sh"
  status=1
fi
for f in "${FILES[@]}"; do
  if ! diff -q "$TW_REPO_DIR/lib/$f" "$DEST/$f" >/dev/null 2>&1; then
    echo "DRIFT: lib/$f differs from Tiny Wire source (edited or stale)"
    status=1
  fi
done

[ $status -eq 0 ] && echo "OK — vendored Tiny Wire is in sync (v$src_ver)."
exit $status
