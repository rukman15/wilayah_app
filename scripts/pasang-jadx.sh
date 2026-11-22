#!/usr/bin/env bash
# Unduh JAR JADX headless MCP 0.7.1 untuk analisis Android di REA.
# Versi dan SHA-256 sesuai yang dipatok REA (docs/guides/android/android-analysis.md).
set -euo pipefail
URL="https://github.com/1013503897/jadx-headless-mcp/releases/download/v0.7.1/jadx-headless-mcp-0.7.1-all.jar"
SHA="6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75"
DEST="${HOME}/.cache/rea/jadx-headless-mcp-0.7.1-all.jar"

if [ -f "$DEST" ] && echo "$SHA  $DEST" | sha256sum -c --status; then
  echo "JADX sudah terpasang: $DEST"
  exit 0
fi
mkdir -p "$(dirname "$DEST")"
curl -fsSL "$URL" -o "$DEST.tmp"
if ! echo "$SHA  $DEST.tmp" | sha256sum -c --status; then
  rm -f "$DEST.tmp"
  echo "Checksum JADX tidak cocok, file dibuang." >&2
  exit 1
fi
mv "$DEST.tmp" "$DEST"
echo "JADX terpasang: $DEST"
