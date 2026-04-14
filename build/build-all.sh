#!/bin/bash
# -------- Cross-Platform SEA Build for All Architectures --------
# Produces 6 binaries: {darwin,linux,win} x {arm64,x64}
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${PROJECT_DIR}/dist"
HELPERS_DIR="${SCRIPT_DIR}/helpers"

# -- Use the same Node.js major version as the build machine --
NODE_VERSION="v$(node -v | sed 's/^v//' | cut -d. -f1).20.1"
NODE_FULL=$(node -v)
echo "=== SonarQube Findings Enricher — Cross-Platform Build ==="
echo "  Node.js version for targets: ${NODE_FULL}"
echo ""

# -- Target matrix: os/arch pairs --
TARGETS=(
  "darwin:arm64"
  "darwin:x64"
  "linux:arm64"
  "linux:x64"
  "win:arm64"
  "win:x64"
)

# -- Step 1: Bundle modules --
echo "[1/3] Bundling modules..."
node "${SCRIPT_DIR}/bundle.js"
echo ""

# -- Step 2: Generate SEA blob --
echo "[2/3] Generating SEA blob..."
cd "${PROJECT_DIR}"
node --experimental-sea-config build/sea-config.json
echo ""

# -- Step 3: Build each target --
echo "[3/3] Building binaries for ${#TARGETS[@]} targets..."
echo ""

chmod +x "${HELPERS_DIR}/download-node.sh"
chmod +x "${HELPERS_DIR}/inject-sea.sh"

for target in "${TARGETS[@]}"; do
  IFS=':' read -r os arch <<< "${target}"
  echo "  Building: ${os}-${arch}"

  # -- Download the Node.js binary for this target --
  bash "${HELPERS_DIR}/download-node.sh" \
    "${os}" "${arch}" "${NODE_FULL}" "${DIST_DIR}"

  # -- Inject the SEA blob --
  if [[ "${os}" == "win" ]]; then
    BINARY="${DIST_DIR}/sonarqube-enricher-${os}-${arch}.exe"
  else
    BINARY="${DIST_DIR}/sonarqube-enricher-${os}-${arch}"
  fi

  bash "${HELPERS_DIR}/inject-sea.sh" \
    "${BINARY}" "${DIST_DIR}/sea-prep.blob" "${os}"

  echo ""
done

# -- Summary --
echo "=== Build complete ==="
echo ""
echo "Binaries in ${DIST_DIR}/:"
for target in "${TARGETS[@]}"; do
  IFS=':' read -r os arch <<< "${target}"
  if [[ "${os}" == "win" ]]; then
    name="sonarqube-enricher-${os}-${arch}.exe"
  else
    name="sonarqube-enricher-${os}-${arch}"
  fi
  size=$(ls -lh "${DIST_DIR}/${name}" 2>/dev/null | awk '{print $5}')
  echo "  ${name}  (${size})"
done
