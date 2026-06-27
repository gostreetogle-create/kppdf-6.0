#!/usr/bin/env bash
# scripts/listen-nextjs-eslint10.sh
#
# Polls upstream ecosystem and auto-creates an ESLint 10 retry task in
# agent-queue.json when compatibility changes make a retry viable.
#
# One-shot model: invoked externally every 12h via cron / Windows Task
# Scheduler / macOS launchd. Internal loop is intentionally NOT included so
# the script plays well with system schedulers on every platform.
#
# Exit codes:
#   0  No new task needed (defer or already-recorded)
#   1  Network error or missing dependency (jq/python3 not available)
#   2  New task added to agent-queue.json (manual review should follow)
#
# Usage:
#   ./scripts/listen-nextjs-eslint10.sh                          # one-shot from project root
#   ./scripts/listen-nextjs-eslint10.sh --quiet                  # suppress stdout (logs only)
#
# Recommended scheduler frequency: every 12h.
# Cron example (Linux/macOS):
#     0 */12 * * * cd /path/to/kppdf-5.0 && scripts/listen-nextjs-eslint10.sh
# Task Scheduler (Windows): basic task, daily every 12 hours, action = run this script
#
# Requirements:
#   - bash 3.2+ (Linux/macOS/Git-Bash)
#   - jq OR python3 (for JSON manipulation; falls back gracefully)
#   - curl (for GitHub releases API)
#   - npm (transitively, via check-eslint10-compat.sh)
#
# Composes with:
#   - scripts/check-eslint10-compat.sh (v1.0.4+) for authoritative trigger check.

set -u

SCRIPT_VERSION="1.0.1"
LOG_PREFIX="[listen-eslint10]"

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

# Portable state directory — HOME may not be set on Windows Git-Bash cron.
# Prefer XDG_STATE_HOME (Linux convention), fall back to project-local hidden dir,
# then TMPDIR for systems without HOME.
PICK_STATE_DIR() {
  if [ -n "${XDG_STATE_HOME:-}" ]; then
    printf '%s' "${XDG_STATE_HOME}/codebuff-eslint10-monitor"
  elif [ -n "${HOME:-}" ]; then
    printf '%s' "${HOME}/.codebuff-eslint10-monitor"
  else
    printf '%s' "${TMPDIR:-/tmp}/codebuff-eslint10-monitor"
  fi
}
STATE_DIR="${STATE_FILE_DIR:-$(PICK_STATE_DIR)}"
STATE_FILE="${STATE_DIR}/state.json"
LOG_FILE="/tmp/listen-eslint10-$(date -u +%Y%m%d-%H%M%S).log"

QUIET=false
for arg in "$@"; do
  case $arg in
    --quiet|-q) QUIET=true ;;
  esac
done

# Log rotation: keep last 5 timestamped files (prune others).
find /tmp -maxdepth 1 -name 'listen-eslint10-*.log' -type f 2>/dev/null \
  | sort \
  | head -n -5 \
  | while read -r old_log; do
      [ -n "$old_log" ] && rm -f "$old_log" 2>/dev/null || true
    done

mkdir -p "$STATE_DIR" 2>/dev/null || true

# Logger — tees to stdout (unless --quiet) and to daily log file.
say() {
  if [ "$QUIET" = false ]; then
    printf '%s %s\n' "$LOG_PREFIX" "$1"
  fi
  printf '%s %s\n' "$LOG_PREFIX" "$1" >> "$LOG_FILE" 2>/dev/null || true
}

# --- 1. Authoritative trigger check via existing compat script ---

COMP_SCRIPT="${PROJECT_ROOT}/scripts/check-eslint10-compat.sh"
if [ ! -f "$COMP_SCRIPT" ]; then
  say "ERROR: missing $COMP_SCRIPT — must be invoked from project root"
  exit 1
fi

say "=== run $(date -u +%Y-%m-%dT%H:%M:%SZ) v$SCRIPT_VERSION ==="

# Capture compat script output for audit + propagate exit code.
COMP_OUT_FILE="${STATE_DIR}/compat-stdout.tmp"
bash "$COMP_SCRIPT" > "$COMP_OUT_FILE" 2>&1
COMP_EXIT=$?
cat "$COMP_OUT_FILE" >> "$LOG_FILE"
rm -f "$COMP_OUT_FILE"

ADD_TASK=false
case $COMP_EXIT in
  0)
    say "✅ VIABLE: TRIGGER A or C fired — retry possible (examine then act)"
    ADD_TASK=true
    ;;
  1)
    say "⏸ NO PROGRESS: defer — exit 1 from compat script"
    ADD_TASK=false
    ;;
  2)
    say "⏸ PARTIAL PROGRESS: only TRIGGER B fired (hooks plugin) — main blocker remains"
    ADD_TASK=false
    ;;
  3)
    say "⚠ UNREACHABLE: compat script could not reach npm registry"
    exit 1
    ;;
  *)
    say "⚠ Unexpected exit code from compat script: ${COMP_EXIT}"
    exit 1
    ;;
esac

# --- 2. Informational GitHub releases polling (best-effort) ---
#
# GitHub unauthenticated rate limit = 60 req/h. We make 1-2 calls per run.
# Schedule ≤ every 20 minutes to stay comfortably within limit. With 12h
# cadence this is well under the cap.

GH_TIMEOUT=15

LATEST_NEXT="N/A"
LATEST_REACT_PLUG="N/A"

if command -v curl >/dev/null 2>&1; then
  NEXT_JSON=$(curl -fsS --max-time "$GH_TIMEOUT" \
    "https://api.github.com/repos/vercel/next.js/releases?per_page=3" \
    2>/dev/null) || NEXT_JSON=""

  if [ -n "$NEXT_JSON" ]; then
    LATEST_NEXT=$(printf '%s' "$NEXT_JSON" \
      | grep -oE '"tag_name"[[:space:]]*:[[:space:]]*"[^"]+"' \
      | head -1 \
      | cut -d'"' -f4 \
      | sed -E 's/^v?//')
  fi

  REACT_PLUGIN_JSON=$(curl -fsS --max-time "$GH_TIMEOUT" \
    "https://api.github.com/repos/jsx-eslint/eslint-plugin-react/releases?per_page=3" \
    2>/dev/null) || REACT_PLUGIN_JSON=""

  if [ -n "$REACT_PLUGIN_JSON" ]; then
    LATEST_REACT_PLUG=$(printf '%s' "$REACT_PLUGIN_JSON" \
      | grep -oE '"tag_name"[[:space:]]*:[[:space:]]*"[^"]+"' \
      | head -1 \
      | cut -d'"' -f4 \
      | sed -E 's/^v?//')
  fi
fi

say "GitHub: next.js latest=${LATEST_NEXT:-N/A}"
say "GitHub: eslint-plugin-react latest=${LATEST_REACT_PLUG:-N/A}"

# --- 3. Idempotent task creation ---
#
# We only ADD a task when the compat script exited 0 (full viable).
# Check existing agent-queue.json for an earlier task under the same id prefix.
# The id scheme "eslint-10-retry-cycle-N" allows multiple retries but skips
# duplicates of the same cycle.

if [ "$ADD_TASK" = false ]; then
  say "Skip task creation (compat did not fire exit 0)"
  exit 0
fi

QUEUE_FILE="${PROJECT_ROOT}/agent-queue.json"
if [ ! -f "$QUEUE_FILE" ]; then
  say "ERROR: missing $QUEUE_FILE — cannot auto-create task"
  exit 1
fi

# Idempotency check — only skip if there's a *pending* task with the same id
# pattern. Allow re-creation after manual cleanup / completion.
already_pending=0
if command -v jq >/dev/null 2>&1; then
  already_pending=$(jq --arg pre 'cycle-17-eslint-10-retry' \
    '[.tasks[] | select(.id | startswith($pre)) | select(.status == "pending")] | length' \
    "$QUEUE_FILE" 2>/dev/null || echo 0)
elif command -v python3 >/dev/null 2>&1; then
  already_pending=$(python3 -c "
import json, sys
try:
  with open('${QUEUE_FILE}', 'r', encoding='utf-8') as f:
    q = json.load(f)
  n = sum(1 for t in q.get('tasks', []) if t.get('id', '').startswith('cycle-17-eslint-10-retry') and t.get('status') == 'pending')
  print(n)
except Exception:
  print('0')
" 2>/dev/null || echo 0)
else
  # Fallback: rough grep-based check using sed (works on any platform).
  already_pending=$(grep -c '"id"[[:space:]]*:[[:space:]]*"cycle-17-eslint-10-retry' "$QUEUE_FILE" 2>/dev/null || echo 0)
fi
already_pending="${already_pending:-0}"

if [ "${already_pending}" -gt 0 ] 2>/dev/null; then
  say "Pending eslint-10-retry task already exists (count=${already_pending}) — skipping"
  exit 0
fi

# Next cycle number — start at 17 (cycles 15/16 are taken by plan + warnings cleanup).
# Increment if pending tasks already exist under a higher N.
next_cycle=17
existing=$(grep -oE '"id"[[:space:]]*:[[:space:]]*"cycle-([0-9]+)-eslint-10-retry' \
  "$QUEUE_FILE" \
  | grep -oE '[0-9]+' \
  | sort -n \
  | tail -1)
if [ -n "$existing" ] && [ "$existing" -ge "$next_cycle" ] 2>/dev/null; then
  next_cycle=$((existing + 1))
fi

TASK_ID="cycle-${next_cycle}-eslint-10-retry-execute"
TASK_TITLE="ESLint 10 retry viable — run per PLAN-ESLINT-10-RETRY §5"
TASK_DESC="Static compat check passed: TRIGGER A or TRIGGER C fired on $(date -u +%Y-%m-%d). Retry steps per ${PROJECT_ROOT}/PLAN-ESLINT-10-RETRY.md section 5. Pre-flight: re-run scripts/check-eslint10-compat.sh to confirm exit 0. Latest next.js: ${LATEST_NEXT:-N/A}. Latest eslint-plugin-react: ${LATEST_REACT_PLUG:-N/A}. See audit-log.md cycle 15 closure for context."

CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"

# JSON manipulation: try jq first, fall back to python3, exit 1 if neither.
modify_queue_with_jq() {
  jq --arg id "$TASK_ID" \
     --arg title "$TASK_TITLE" \
     --arg desc "$TASK_DESC" \
     --arg created "$CREATED_AT" \
     --argjson pending_mimo 1 \
     '.last_updated = $created |
      .agents.mimo.tasks_pending = (.agents.mimo.tasks_pending // 0) + 1 |
      .tasks += [{
        "id": $id,
        "title": $title,
        "assignee": "mimo",
        "status": "pending",
        "priority": 1,
        "depends_on": [],
        "description": $desc,
        "created_at": $created
      }]' \
     "$QUEUE_FILE" > "${QUEUE_FILE}.tmp" \
  && mv "${QUEUE_FILE}.tmp" "$QUEUE_FILE"
}

modify_queue_with_python3() {
  python3 <<PYEOF
import json
with open('${QUEUE_FILE}', 'r', encoding='utf-8') as f:
    q = json.load(f)
if 'mimo' not in q['agents']:
    q['agents']['mimo'] = {'tasks_pending': 0, 'tasks_in_progress': 0}
q['last_updated'] = '${CREATED_AT}'
q['agents']['mimo']['tasks_pending'] = q['agents']['mimo'].get('tasks_pending', 0) + 1
q['tasks'].append({
    'id': '${TASK_ID}',
    'title': '$TASK_TITLE'.replace("'", "\\'"),
    'assignee': 'mimo',
    'status': 'pending',
    'priority': 1,
    'depends_on': [],
    'description': '''$TASK_DESC''',
    'created_at': '${CREATED_AT}'
})
with open('${QUEUE_FILE}', 'w', encoding='utf-8') as f:
    json.dump(q, f, ensure_ascii=False, indent=2)
print('OK')
PYEOF
}

modify_ok=false
if command -v jq >/dev/null 2>&1; then
  say "Using jq for JSON modification"
  if modify_queue_with_jq; then
    modify_ok=true
  else
    say "jq modification failed — trying python3"
  fi
fi

if [ "$modify_ok" = false ] && command -v python3 >/dev/null 2>&1; then
  say "Using python3 for JSON modification"
  if modify_queue_with_python3; then
    modify_ok=true
  else
    say "python3 modification failed — aborting (no JSON tool available)"
    exit 1
  fi
fi

if [ "$modify_ok" = false ]; then
  say "Neither jq nor python3 available — recommend installing jq. Aborting task creation."
  exit 1
fi

say "✅ Task '$TASK_ID' added to agent-queue.json"
say "Manual review: open agent-queue.json, examine new entry, then run PLAN §5 retry steps"

# --- 4. Update local state (last seen) ---
STATE_SCHEMA_VERSION=1
cat > "$STATE_FILE" <<STATE_EOF
{
  "schema_version": ${STATE_SCHEMA_VERSION},
  "last_run": "${CREATED_AT}",
  "compat_exit": ${COMP_EXIT},
  "latest_next_js": "${LATEST_NEXT}",
  "latest_eslint_plugin_react": "${LATEST_REACT_PLUG}",
  "last_task_id": "${TASK_ID}"
}
STATE_EOF
say "State file updated: $STATE_FILE"

exit 2  # New task added — distinct exit so scheduler can notify user.
