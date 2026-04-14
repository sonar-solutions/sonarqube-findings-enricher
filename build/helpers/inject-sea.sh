#!/bin/bash
# -------- Inject SEA Blob into a Node.js Binary --------
# Usage: inject-sea.sh <binary-path> <blob-path> <target-os>
set -euo pipefail

BINARY_PATH="$1"
BLOB_PATH="$2"
TARGET_OS="$3"

BINARY_NAME=$(basename "${BINARY_PATH}")

# -- Remove existing signature on macOS binaries --
if [[ "${TARGET_OS}" == "darwin" ]]; then
  echo "    Removing signature from ${BINARY_NAME}..."
  codesign --remove-signature "${BINARY_PATH}" 2>/dev/null || true
fi

# -- Build postject arguments --
POSTJECT_ARGS=(
  "${BINARY_PATH}"
  NODE_SEA_BLOB
  "${BLOB_PATH}"
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
)

# -- macOS needs --macho-segment-name for ARM64 compatibility --
if [[ "${TARGET_OS}" == "darwin" ]]; then
  POSTJECT_ARGS+=( --macho-segment-name NODE_SEA )
fi

echo "    Injecting SEA blob into ${BINARY_NAME}..."
npx --yes postject "${POSTJECT_ARGS[@]}" 2>&1 | grep -v "^$"

# -- Re-sign macOS binaries --
if [[ "${TARGET_OS}" == "darwin" ]]; then
  echo "    Re-signing ${BINARY_NAME}..."
  codesign --sign - "${BINARY_PATH}"
fi

echo "    Done: ${BINARY_NAME}"
