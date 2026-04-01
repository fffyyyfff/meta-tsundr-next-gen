#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/evidence/logs"
LOG_FILE="$LOG_DIR/security-check.log"

mkdir -p "$LOG_DIR"

PASS=0
WARN=0
FAIL=0

log() { echo "$1" | tee -a "$LOG_FILE"; }
pass() { PASS=$((PASS + 1)); log "[PASS] $1"; }
warn() { WARN=$((WARN + 1)); log "[WARN] $1"; }
fail() { FAIL=$((FAIL + 1)); log "[FAIL] $1"; }

: > "$LOG_FILE"
log "=== Security Check $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="
log ""

# 1. npm audit
log "--- npm audit ---"
if npm audit --audit-level=high >> "$LOG_FILE" 2>&1; then
  pass "npm audit: no high/critical vulnerabilities"
else
  fail "npm audit: high or critical vulnerabilities found (see log)"
fi
log ""

# 2. Known vulnerable package versions
log "--- Known vulnerable versions ---"
if [ -f "$PROJECT_DIR/package-lock.json" ]; then
  AXIOS_VERSIONS=$(grep -oP '"axios":\s*\{"version":\s*"\K[^"]+' "$PROJECT_DIR/package-lock.json" 2>/dev/null || true)
  for v in $AXIOS_VERSIONS; do
    case "$v" in
      1.7.4|0.30.0) warn "axios $v has known SSRF vulnerability (CVE-2024-39338)" ;;
      *) pass "axios $v — no known critical CVE" ;;
    esac
  done
  [ -z "$AXIOS_VERSIONS" ] && log "  axios not found in dependencies"
else
  log "  package-lock.json not found, skipping"
fi
log ""

# 3. .env in .gitignore
log "--- .env gitignore check ---"
if [ -f "$PROJECT_DIR/.gitignore" ]; then
  if grep -qE '^\s*\.env(\*|\.\*|\.local)?\s*$' "$PROJECT_DIR/.gitignore"; then
    pass ".env files are in .gitignore"
  else
    fail ".env files are NOT in .gitignore — secrets may be committed"
  fi
else
  fail ".gitignore not found"
fi
log ""

# 4. Suspicious postinstall scripts in node_modules
log "--- Suspicious postinstall scripts ---"
SUSPICIOUS=$(find "$PROJECT_DIR/node_modules" -maxdepth 2 -name "package.json" -exec \
  grep -l '"postinstall"' {} \; 2>/dev/null | \
  grep -vE '(esbuild|prisma|playwright|sharp|fsevents|protobuf|grpc|bufbuild|better-sqlite3|canvas)' || true)
if [ -n "$SUSPICIOUS" ]; then
  warn "Packages with postinstall scripts (review manually):"
  echo "$SUSPICIOUS" | while read -r f; do
    log "  - $(dirname "$f" | xargs basename)"
  done
else
  pass "No suspicious postinstall scripts found"
fi
log ""

# 5. Hardcoded secrets in source
log "--- Hardcoded secrets scan ---"
SECRETS_FOUND=$(grep -rnE '(sk-ant-|ghp_|gho_|AKIA[A-Z0-9]{16})' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.go' \
  "$PROJECT_DIR/src" "$PROJECT_DIR/backend/cmd" "$PROJECT_DIR/backend/internal" 2>/dev/null || true)
if [ -n "$SECRETS_FOUND" ]; then
  fail "Potential hardcoded secrets found:"
  log "$SECRETS_FOUND"
else
  pass "No hardcoded API keys/tokens in source"
fi
log ""

# Summary
log "=== Summary ==="
log "PASS: $PASS  WARN: $WARN  FAIL: $FAIL"
log "Full log: $LOG_FILE"

if [ "$FAIL" -gt 0 ]; then
  log "Status: FAILED"
  exit 1
else
  log "Status: OK"
  exit 0
fi
