#!/usr/bin/env bash
# SteadyCap release gate — run from repo root OUTSIDE the agent sandbox.
#
# Reproduces every `run:` step from:
#   .github/workflows/ci.yml     → npm run verify
#                              → FINISH_MATRIX=1 npm run test:matrix
#   .github/workflows/pages.yml  → ALLOW_PATHS=… FORBIDDEN_EXTRA=docs
#                                  bash scripts/stage-pages-site.sh _site
#
# Then: full Playwright (--retries=0), WebKit-only ios-behaviour-check against
# staged _site, prod-ready audit harness (strict gates), G-8 version coherence.
#
# Logs → qa/release/logs/   Summary → qa/release/SUMMARY.md
# Expects: node_modules + Playwright browsers already installed (no network installs).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/qa/release/logs"
SUMMARY="$ROOT/qa/release/SUMMARY.md"
mkdir -p "$LOG_DIR"

EXPECT_VERSION="2.7.0"
EXPECT_SW="steadycap-v70"
STAGE_PORT="${STAGE_PORT:-8860}"
ALLOW_PATHS="${ALLOW_PATHS:-index.html landing.html pitch.html presentation.html privacy.html changelog.html screen-gallery.html sw.js manifest.json VERSION.json css js assets}"
FORBIDDEN_EXTRA="${FORBIDDEN_EXTRA:-docs}"

declare -a STEPS=()
declare -a STATUSES=()
declare -a DETAILS=()

pass() { STEPS+=("$1"); STATUSES+=("PASS"); DETAILS+=("$2"); }
fail() { STEPS+=("$1"); STATUSES+=("FAIL"); DETAILS+=("$2"); }

run_logged() {
  local name="$1"
  local log="$LOG_DIR/$2"
  shift 2
  set +e
  "$@" >"$log" 2>&1
  local rc=$?
  set -e
  return $rc
}

key_from_log() {
  local log="$1"
  local hint="$2"
  if [[ -f "$log" ]]; then
    local line
    # Prefer "N failed" so FAIL rows do not show only "N passed".
    line="$(grep -E '[0-9]+ failed' "$log" | tail -1 | tr -d '\r' || true)"
    if [[ -z "$line" ]]; then
      line="$(grep -E "$hint" "$log" | tail -1 | tr -d '\r' || true)"
    fi
    if [[ -n "$line" ]]; then
      echo "$line" | head -c 120
      return
    fi
    echo "$(wc -l <"$log" | tr -d ' ') lines"
  else
    echo "no log"
  fi
}

SERVER_PID=""
cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "== SteadyCap release checks (expect ${EXPECT_VERSION} / ${EXPECT_SW}) =="

# --- 0. HIG static guards (standing rules 1–4; no browser) ---
if run_logged "hig-guards" "00-hig-guards.log" node scripts/hig-guards.mjs; then
  pass "hig-guards (standing rules 1–4)" "$(key_from_log "$LOG_DIR/00-hig-guards.log" 'OK|hit')"
else
  fail "hig-guards (standing rules 1–4)" "$(key_from_log "$LOG_DIR/00-hig-guards.log" 'hit|Error|OK')"
fi

# --- 1a. CI verify ---
if run_logged "ci-verify" "01-ci-verify.log" npm run verify; then
  pass "ci.yml · npm run verify" "$(key_from_log "$LOG_DIR/01-ci-verify.log" 'passed|failed|skipped|Error')"
else
  fail "ci.yml · npm run verify" "$(key_from_log "$LOG_DIR/01-ci-verify.log" 'failed|Error|passed')"
fi

# --- 1b. CI finish-matrix ---
if run_logged "ci-matrix" "02-ci-matrix.log" env FINISH_MATRIX=1 npm run test:matrix; then
  pass "ci.yml · FINISH_MATRIX=1 test:matrix" "$(key_from_log "$LOG_DIR/02-ci-matrix.log" 'passed|failed|matrix|Error')"
else
  fail "ci.yml · FINISH_MATRIX=1 test:matrix" "$(key_from_log "$LOG_DIR/02-ci-matrix.log" 'failed|Error|passed')"
fi

# --- 1c. Pages stage (exact env from pages.yml) ---
if run_logged "pages-stage" "03-pages-stage.log" \
  env ALLOW_PATHS="$ALLOW_PATHS" FORBIDDEN_EXTRA="$FORBIDDEN_EXTRA" \
  bash scripts/stage-pages-site.sh _site; then
  pass "pages.yml · stage-pages-site.sh _site" "$(key_from_log "$LOG_DIR/03-pages-stage.log" 'OK|FAIL|staged')"
else
  fail "pages.yml · stage-pages-site.sh _site" "$(key_from_log "$LOG_DIR/03-pages-stage.log" 'FAIL|OK|staged')"
fi

# --- 2. Full Playwright suite, retries=0 ---
if run_logged "pw-full" "04-playwright-full.log" \
  npx playwright test --retries=0; then
  pass "Playwright full (--retries=0)" "$(key_from_log "$LOG_DIR/04-playwright-full.log" 'passed|failed|skipped')"
else
  fail "Playwright full (--retries=0)" "$(key_from_log "$LOG_DIR/04-playwright-full.log" 'failed|Error|passed')"
fi

# --- Serve staged site ---
STAGE_URL="http://127.0.0.1:${STAGE_PORT}/"
STAGE_OK=0
if [[ -d "$ROOT/_site" ]]; then
  QA_ROOT="$ROOT/_site" PORT="$STAGE_PORT" node scripts/qa-serve.mjs \
    >"$LOG_DIR/05-stage-serve.log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 40); do
    if curl -sf -o /dev/null "$STAGE_URL"; then break; fi
    sleep 0.25
  done
  if curl -sf -o /dev/null "$STAGE_URL"; then
    STAGE_OK=1
    pass "stage serve _site" "port ${STAGE_PORT}"
  else
    fail "stage serve _site" "could not reach $STAGE_URL"
  fi
else
  fail "stage serve _site" "_site missing"
fi

# --- 3. iOS behaviour (WebKit only) against staged site ---
if [[ "$STAGE_OK" -eq 1 ]]; then
  if run_logged "ios-check" "06-ios-behaviour.log" \
    env WEBKIT_ONLY=1 node scripts/ios-behaviour-check.mjs "$STAGE_URL"; then
    ios_pass="$(grep -c '^PASS' "$LOG_DIR/06-ios-behaviour.log" 2>/dev/null || echo 0)"
    ios_fail="$(grep -c '^FAIL' "$LOG_DIR/06-ios-behaviour.log" 2>/dev/null || echo 0)"
    pass "ios-behaviour-check (WebKit · staged)" "${ios_pass} PASS / ${ios_fail} FAIL"
  else
    ios_pass="$(grep -c '^PASS' "$LOG_DIR/06-ios-behaviour.log" 2>/dev/null || echo 0)"
    ios_fail="$(grep -c '^FAIL' "$LOG_DIR/06-ios-behaviour.log" 2>/dev/null || echo 0)"
    fail "ios-behaviour-check (WebKit · staged)" "${ios_pass} PASS / ${ios_fail} FAIL"
  fi
else
  fail "ios-behaviour-check (WebKit · staged)" "skipped — stage serve not up"
fi

# --- 4. Prod-ready audit harness (strict) ---
if [[ "$STAGE_OK" -eq 1 ]]; then
  if run_logged "prod-ready" "07-prod-ready-audit.log" \
    env PROD_READY_STRICT=1 node scripts/prod-ready-audit.mjs "$STAGE_URL"; then
    pass "prod-ready audit (strict)" "$(key_from_log "$LOG_DIR/07-prod-ready-audit.log" 'gates|axeSerious|offline|PROD_READY')"
  else
    fail "prod-ready audit (strict)" "$(key_from_log "$LOG_DIR/07-prod-ready-audit.log" 'gates|FAIL|axeSerious|offline')"
  fi
else
  fail "prod-ready audit (strict)" "skipped — stage serve not up"
fi

# --- 5. Version coherence ---
VER_LOG="$LOG_DIR/08-version-coherence.log"
set +e
{
  echo "expect version=${EXPECT_VERSION} swCache=${EXPECT_SW}"
  node -e "
    const fs = require('fs');
    const path = require('path');
    const root = process.cwd();
    const v = JSON.parse(fs.readFileSync('VERSION.json','utf8'));
    const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
    const sw = fs.readFileSync('sw.js','utf8');
    const app = fs.readFileSync('js/app.js','utf8');
    const cache = (sw.match(/const CACHE = '([^']+)'/) || [])[1];
    const reg = (app.match(/sw\\.js\\?v=([^'\"]+)/) || [])[1];
    const appVer = (app.match(/window\\.APP_VERSION\\s*=\\s*['\"]([^'\"]+)['\"]/) || [])[1];
    const staged = path.join('_site','VERSION.json');
    let stagedVer = null;
    if (fs.existsSync(staged)) stagedVer = JSON.parse(fs.readFileSync(staged,'utf8')).version;
    const errors = [];
    if (v.version !== '${EXPECT_VERSION}') errors.push('VERSION.json=' + v.version);
    if (pkg.version !== '${EXPECT_VERSION}') errors.push('package.json=' + pkg.version);
    if (appVer !== '${EXPECT_VERSION}') errors.push('APP_VERSION=' + appVer);
    if (v.swCache !== '${EXPECT_SW}') errors.push('swCache=' + v.swCache);
    if (cache !== '${EXPECT_SW}') errors.push('sw.js CACHE=' + cache);
    if ('steadycap-v' + reg !== '${EXPECT_SW}') errors.push('register ?v=' + reg);
    if (stagedVer && stagedVer !== '${EXPECT_VERSION}') errors.push('_site VERSION=' + stagedVer);
    if (errors.length) { console.error('FAIL', errors.join('; ')); process.exit(1); }
    console.log('OK', v.version, v.swCache, 'register?v=' + reg, 'staged=' + (stagedVer || 'n/a'));
  "
} >"$VER_LOG" 2>&1
ver_rc=$?
set -e
if [[ $ver_rc -eq 0 ]]; then
  pass "G-8 version coherence" "$(key_from_log "$VER_LOG" 'OK|FAIL')"
else
  fail "G-8 version coherence" "$(key_from_log "$VER_LOG" 'FAIL|OK')"
fi

# --- Summary table ---
{
  echo "# SteadyCap release check summary"
  echo
  echo "| Step | Result | Detail |"
  echo "|---|---|---|"
  any_fail=0
  for i in "${!STEPS[@]}"; do
    echo "| ${STEPS[$i]} | ${STATUSES[$i]} | ${DETAILS[$i]} |"
    if [[ "${STATUSES[$i]}" == "FAIL" ]]; then any_fail=1; fi
  done
  echo
  echo "Expect: **${EXPECT_VERSION}** / \`${EXPECT_SW}\`"
  echo "Logs: \`qa/release/logs/\`"
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >"$SUMMARY"

echo
echo "=== SUMMARY ==="
printf '%-48s %-6s %s\n' "STEP" "RESULT" "DETAIL"
for i in "${!STEPS[@]}"; do
  printf '%-48s %-6s %s\n' "${STEPS[$i]}" "${STATUSES[$i]}" "${DETAILS[$i]}"
done
echo
echo "Wrote $SUMMARY"

any_fail=0
for s in "${STATUSES[@]}"; do
  if [[ "$s" == "FAIL" ]]; then any_fail=1; fi
done
exit $any_fail
