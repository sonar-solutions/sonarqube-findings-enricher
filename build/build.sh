#!/bin/bash
# -------- SEA Build Script for SonarQube Findings Enricher --------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${PROJECT_DIR}/dist"

echo "=== SonarQube Findings Enricher — SEA Build ==="
echo ""

# -- Step 1: Bundle all modules into a single file --
echo "[1/5] Bundling modules..."
node "${SCRIPT_DIR}/bundle.js"

# -- Step 2: Generate the SEA preparation blob --
echo "[2/5] Generating SEA blob..."
cd "${PROJECT_DIR}"
node --experimental-sea-config build/sea-config.json

# -- Step 3: Copy the node binary --
echo "[3/5] Copying Node.js binary..."
NODE_BIN="$(command -v node)"
cp "${NODE_BIN}" "${DIST_DIR}/sonarqube-enricher"

# -- Step 4: Remove code signature (macOS) or skip --
if [[ "$(uname)" == "Darwin" ]]; then
  echo "[4/5] Removing macOS code signature..."
  codesign --remove-signature "${DIST_DIR}/sonarqube-enricher" 2>/dev/null || true
else
  echo "[4/5] Skipping signature removal (not macOS)"
fi

# -- Step 5: Inject SEA blob into the binary --
echo "[5/5] Injecting SEA blob..."
POSTJECT_ARGS=(
  "${DIST_DIR}/sonarqube-enricher"
  NODE_SEA_BLOB
  "${DIST_DIR}/sea-prep.blob"
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
)

# -- macOS needs --macho-segment-name for ARM64 compatibility --
if [[ "$(uname)" == "Darwin" ]]; then
  POSTJECT_ARGS+=( --macho-segment-name NODE_SEA )
fi

npx --yes postject "${POSTJECT_ARGS[@]}"

# -- Re-sign on macOS --
if [[ "$(uname)" == "Darwin" ]]; then
  echo "Re-signing binary for macOS..."
  codesign --sign - "${DIST_DIR}/sonarqube-enricher"
fi

echo ""
echo "=== Build complete ==="
echo "Binary: ${DIST_DIR}/sonarqube-enricher"
echo ""
echo "Usage:"
echo "  ./dist/sonarqube-enricher -p <project-key>"
echo "  ./dist/sonarqube-enricher -p <project-key> -f json -o findings.json"
