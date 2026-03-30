#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# run-evals.sh
# Promptfoo evaluation runner for Meta-tsundr Next Gen agents
# Usage: ./scripts/run-evals.sh [--ci]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/evidence/evals"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

# --- Colors (disabled in CI) ---
if [[ "${CI:-}" == "true" ]] || [[ "${1:-}" == "--ci" ]]; then
  RED="" GREEN="" YELLOW="" BLUE="" RESET=""
else
  RED="\033[0;31m" GREEN="\033[0;32m" YELLOW="\033[0;33m" BLUE="\033[0;34m" RESET="\033[0m"
fi

info()  { echo -e "${BLUE}[INFO]${RESET}  $*"; }
ok()    { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error() { echo -e "${RED}[ERROR]${RESET} $*"; }

# --- 1. Check ANTHROPIC_API_KEY ---
info "Checking ANTHROPIC_API_KEY..."
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  # Try loading from .env.local
  ENV_FILE="$PROJECT_ROOT/.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    info "Loading from .env.local"
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
  fi
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  error "ANTHROPIC_API_KEY is not set."
  error "Set it via environment variable or .env.local"
  exit 1
fi

if [[ "$ANTHROPIC_API_KEY" == "sk-ant-xxxx" ]] || [[ "$ANTHROPIC_API_KEY" == "your_api_key_here" ]]; then
  error "ANTHROPIC_API_KEY is set to a placeholder value."
  error "Please set a valid API key."
  exit 1
fi

ok "ANTHROPIC_API_KEY is configured"

# --- 2. Create output directory ---
mkdir -p "$OUTPUT_DIR"
info "Output directory: $OUTPUT_DIR"

# --- 3. Check promptfoo is available ---
if ! npx promptfoo --version &>/dev/null; then
  error "promptfoo is not available. Run: npm install"
  exit 1
fi
ok "promptfoo $(npx promptfoo --version 2>/dev/null || echo 'available')"

# --- 4. Run evaluations ---
info "Running promptfoo evaluations..."
echo "---"

EVAL_OUTPUT="$OUTPUT_DIR/eval-results-${TIMESTAMP}.json"

cd "$PROJECT_ROOT"

npx promptfoo eval \
  --config promptfooconfig.yaml \
  --output "$EVAL_OUTPUT" \
  --no-cache \
  2>&1 | tee "$OUTPUT_DIR/eval-log-${TIMESTAMP}.txt"

EVAL_EXIT=${PIPESTATUS[0]}

echo "---"

# --- 5. Copy latest results ---
if [[ -f "$EVAL_OUTPUT" ]]; then
  cp "$EVAL_OUTPUT" "$OUTPUT_DIR/eval-results.json"
  ok "Results saved to: $EVAL_OUTPUT"
  ok "Latest symlink: $OUTPUT_DIR/eval-results.json"
fi

# --- 6. Generate summary ---
SUMMARY_FILE="$OUTPUT_DIR/eval-summary-${TIMESTAMP}.md"
cat > "$SUMMARY_FILE" <<EOF
# Eval Summary — $TIMESTAMP

- **Config**: promptfooconfig.yaml
- **Results**: eval-results-${TIMESTAMP}.json
- **Log**: eval-log-${TIMESTAMP}.txt
- **Exit code**: $EVAL_EXIT

## Quick View

\`\`\`bash
npx promptfoo view
\`\`\`
EOF
ok "Summary: $SUMMARY_FILE"

# --- 7. Exit ---
if [[ $EVAL_EXIT -ne 0 ]]; then
  warn "Evaluation completed with exit code $EVAL_EXIT"
  exit "$EVAL_EXIT"
fi

ok "All evaluations completed successfully"
