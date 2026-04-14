#!/bin/bash
# -------- Download Node.js Binary for a Target Platform --------
# Usage: download-node.sh <os> <arch> <node-version> <output-dir>
set -euo pipefail

TARGET_OS="$1"
TARGET_ARCH="$2"
NODE_VERSION="$3"
OUTPUT_DIR="$4"

# -- Map our naming to Node.js distribution naming --
case "${TARGET_OS}" in
  darwin) NODE_OS="darwin" ;;
  linux)  NODE_OS="linux" ;;
  win)    NODE_OS="win" ;;
  *)      echo "Unknown OS: ${TARGET_OS}"; exit 1 ;;
esac

case "${TARGET_ARCH}" in
  arm64) NODE_ARCH="arm64" ;;
  x64)   NODE_ARCH="x64" ;;
  *)     echo "Unknown arch: ${TARGET_ARCH}"; exit 1 ;;
esac

# -- Build download URL --
BASE_URL="https://nodejs.org/dist/${NODE_VERSION}"

if [[ "${TARGET_OS}" == "win" ]]; then
  ARCHIVE_NAME="node-${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}.zip"
  NODE_BIN_PATH="node-${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}/node.exe"
else
  ARCHIVE_NAME="node-${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}.tar.gz"
  NODE_BIN_PATH="node-${NODE_VERSION}-${NODE_OS}-${NODE_ARCH}/bin/node"
fi

DOWNLOAD_URL="${BASE_URL}/${ARCHIVE_NAME}"
CACHE_DIR="${OUTPUT_DIR}/.node-cache"
CACHED_ARCHIVE="${CACHE_DIR}/${ARCHIVE_NAME}"

mkdir -p "${CACHE_DIR}"

# -- Download if not cached --
if [[ ! -f "${CACHED_ARCHIVE}" ]]; then
  echo "    Downloading ${ARCHIVE_NAME}..."
  curl -sL "${DOWNLOAD_URL}" -o "${CACHED_ARCHIVE}"
else
  echo "    Using cached ${ARCHIVE_NAME}"
fi

# -- Extract the node binary --
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

if [[ "${TARGET_OS}" == "win" ]]; then
  BINARY_NAME="sonarqube-enricher-${TARGET_OS}-${TARGET_ARCH}.exe"
  unzip -q "${CACHED_ARCHIVE}" "${NODE_BIN_PATH}" -d "${TEMP_DIR}"
else
  BINARY_NAME="sonarqube-enricher-${TARGET_OS}-${TARGET_ARCH}"
  tar -xzf "${CACHED_ARCHIVE}" -C "${TEMP_DIR}" "${NODE_BIN_PATH}"
fi

cp "${TEMP_DIR}/${NODE_BIN_PATH}" "${OUTPUT_DIR}/${BINARY_NAME}"
echo "    Extracted -> ${BINARY_NAME}"
