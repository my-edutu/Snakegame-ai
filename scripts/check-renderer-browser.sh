#!/usr/bin/env bash
set -euo pipefail

HOST="${RENDER_PREVIEW_HOST:-127.0.0.1}"
PORT="${RENDER_PREVIEW_PORT:-4173}"
URL="http://${HOST}:${PORT}"
EVIDENCE_DIR="apps/render-preview/browser-smoke"
SERVER_LOG="${EVIDENCE_DIR}/server.log"
BROWSER_LOG="${EVIDENCE_DIR}/browser.log"
DOM_OUTPUT="${EVIDENCE_DIR}/dom.html"
SCREENSHOT="${EVIDENCE_DIR}/preview-1080p.png"

rm -rf "${EVIDENCE_DIR}"
mkdir -p "${EVIDENCE_DIR}"

pnpm --filter @snake/render-preview preview -- --host "${HOST}" --port "${PORT}" --strictPort >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 60); do
  if curl --silent --fail "${URL}" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 0.25
done

if [[ "${ready}" -ne 1 ]]; then
  echo "renderer preview server did not become ready" >&2
  cat "${SERVER_LOG}" >&2 || true
  exit 1
fi

CHROME=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "${candidate}" >/dev/null 2>&1; then
    CHROME="$(command -v "${candidate}")"
    break
  fi
done

if [[ -z "${CHROME}" ]]; then
  echo "no Chrome/Chromium binary is available for renderer smoke verification" >&2
  exit 1
fi

COMMON_FLAGS=(
  --headless=new
  --no-sandbox
  --disable-dev-shm-usage
  --enable-unsafe-swiftshader
  --use-angle=swiftshader
  --window-size=1920,1080
  --virtual-time-budget=10000
)

"${CHROME}" "${COMMON_FLAGS[@]}" --dump-dom "${URL}" >"${DOM_OUTPUT}" 2>"${BROWSER_LOG}"

if grep -q 'data-renderer-state="error"' "${DOM_OUTPUT}"; then
  echo "renderer preview reported an error state" >&2
  cat "${BROWSER_LOG}" >&2 || true
  exit 1
fi

grep -q 'data-renderer-state="ready"' "${DOM_OUTPUT}" || {
  echo "renderer preview never reached ready state" >&2
  cat "${DOM_OUTPUT}" >&2 || true
  cat "${BROWSER_LOG}" >&2 || true
  exit 1
}

grep -q '<canvas' "${DOM_OUTPUT}" || {
  echo "renderer preview did not mount a canvas" >&2
  exit 1
}

grep -q 'width="1920"' "${DOM_OUTPUT}" || {
  echo "renderer canvas did not preserve the 1920-pixel internal width" >&2
  exit 1
}

grep -q 'height="1080"' "${DOM_OUTPUT}" || {
  echo "renderer canvas did not preserve the 1080-pixel internal height" >&2
  exit 1
}

"${CHROME}" "${COMMON_FLAGS[@]}" --screenshot="${SCREENSHOT}" "${URL}" >>"${BROWSER_LOG}" 2>&1
[[ -s "${SCREENSHOT}" ]] || {
  echo "renderer browser screenshot was not created" >&2
  exit 1
}

echo "renderer compiled-browser smoke: PASS"
