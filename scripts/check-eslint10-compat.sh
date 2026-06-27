#!/usr/bin/env bash
# scripts/check-eslint10-compat.sh
#
# Exit codes (refined to distinguish partial vs full progress):
#   0  FULL PROGRESS — TRIGGER A or TRIGGER C fired.
#                   ESLint 10 retry is viable. Follow PLAN-ESLINT-10-RETRY.md §5.
#   1  NO PROGRESS  — all TRIGGERS failed. Upstream not ready. Retry next quarter.
#   2  PARTIAL      — a peripheral TRIGGER (B) fired but the main blocker (A or C) didn't.
#                   Retry would still fail via transitive deps. Continue monitoring.
#   3  UNREACHABLE  — npm registry cannot be reached. Investigate network and retry.
#
# Usage:
#   ./scripts/check-eslint10-compat.sh                                # full report
#   ./scripts/check-eslint10-compat.sh > /dev/null && echo "ready"   # CI friendly
#
# Compatible with: Linux bash 4+, macOS bash 3.2+, Git Bash on Windows.
# Requires: `npm` on PATH (live registry — no offline cache consulted).
#
# Implements TRIGGER conditions from PLAN-ESLINT-10-RETRY.md §3.
# Refined to encode the architectural insight that TRIGGER A and TRIGGER C
# are "main blockers" (the breaking transitive pair), while TRIGGER B alone
# is peripheral — sufficient for progress reports but insufficient for retry.

set -u

SCRIPT_VERSION="1.0.4"
ECHO_PREFIX="[eslint10-compat]"

# --- Network pre-flight -------------------------------------------------------
network_check() {
  # Prefer `npm ping` (works on all platforms where npm is installed).
  # Fallback to curl if npm ping is unavailable or noisy.
  if npm ping --silent 2>/dev/null; then
    return 0
  fi
  if command -v curl >/dev/null 2>&1; then
    if curl -fsSI --max-time 5 https://registry.npmjs.org/ >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

# --- Helpers -----------------------------------------------------------------

# safe_view <package> <field>
# Query npm registry for one field. Returns "N/A" on failure (network,
# missing field, package unpublished). Never throws so callers stay simple.
safe_view() {
  local pkg="$1"
  local field="${2:-}"
  local result
  result=$(npm view "$pkg" "$field" 2>/dev/null) || result="N/A"
  printf '%s' "$result"
}

# has_10_in_peer <peer-deps-string>
# Returns 0 if string declares `^10`, `>=10`, `>10` (in any position of a
# "||"-separated list). Uses POSIX-safe regex without GNU `\b` or `\s`.
# Tolerates whitespace between `||` and the next term (real-world peer
# strings are formatted as `^3.0.0 || ^4.0.0 || ...`, not `^3.0.0||^4.0.0`).
# Note: `[[:space:]]*` is the POSIX-defined character class — equivalent
# to `\s*` but portable to BSD grep on macOS (which treats `\s` as literal).
has_10_in_peer() {
  local peer="$1"
  if [ -z "$peer" ] || [ "$peer" = "N/A" ]; then return 1; fi
  echo "$peer" | grep -qE '(^|\|[[:space:]]*)(\^|>=?[[:space:]]*)10(\.|[^0-9]|$)' && return 0 || return 1
}

# extract_major <semver>
# Extracts leading integer from a semver like "7.37.5" → "7".
extract_major() {
  printf '%s' "$1" | grep -oE '^[0-9]+' | head -1
}

# --- Pre-flight ---------------------------------------------------------------

printf '%s ESLint 10 ecosystem compatibility check\n' "$ECHO_PREFIX"
printf '%s Script version : %s\n' "$ECHO_PREFIX" "$SCRIPT_VERSION"
printf '%s Date           : %s\n' "$ECHO_PREFIX" "$(date -u +%Y-%m-%d 2>/dev/null || date)"
printf '%s Node           : %s (ESLint 10 requires >=20.19.0)\n' \
  "$ECHO_PREFIX" "$(node -v 2>/dev/null || echo 'N/A')"
echo ""

if ! network_check; then
  printf '%s ⚠ npm registry unreachable — run again when online\n' "$ECHO_PREFIX" >&2
  echo ""
  echo "Hints:"
  echo "  - npm config get registry"
  echo "  - check proxy / firewall rules"
  echo "  - retry when network restored"
  exit 3
fi

# --- Trigger state ------------------------------------------------------------
TRIGGER_A=false  # eslint-plugin-react supports ^10 (main blocker)
TRIGGER_B=false  # eslint-plugin-react-hooks supports ^10 (peripheral)
TRIGGER_C=false  # eslint-config-next no longer bundles incompatible react preset

# --- Package snapshot ---------------------------------------------------------

echo "--- Package versions & peer dependencies (live npm registry) ---"
echo ""

# 1) eslint-plugin-react
REACT_V=$(safe_view eslint-plugin-react version)
REACT_PEER=$(safe_view eslint-plugin-react peerDependencies.eslint)
REACT_MAJ=$(extract_major "$REACT_V")
echo "eslint-plugin-react"
printf '  version           : %s\n' "${REACT_V:-N/A}"
printf '  major             : %s\n' "${REACT_MAJ:-N/A}"
printf '  peer-deps[eslint] : %s\n' "${REACT_PEER:-N/A}"
echo ""

# 2) eslint-plugin-react-hooks
HOOKS_V=$(safe_view eslint-plugin-react-hooks version)
HOOKS_PEER=$(safe_view eslint-plugin-react-hooks peerDependencies.eslint)
HOOKS_MAJ=$(extract_major "$HOOKS_V")
echo "eslint-plugin-react-hooks"
printf '  version           : %s\n' "${HOOKS_V:-N/A}"
printf '  major             : %s\n' "${HOOKS_MAJ:-N/A}"
printf '  peer-deps[eslint] : %s\n' "${HOOKS_PEER:-N/A}"
echo ""

# 3) eslint-config-next
NEXT_V=$(safe_view eslint-config-next version)
NEXT_PEER=$(safe_view eslint-config-next peerDependencies.eslint)
NEXT_DEPS=$(safe_view eslint-config-next dependencies)
# Count occurrences of `eslint-plugin-react` substring in transitive deps string.
NEXT_HAS_REACT_DEP=$(printf '%s' "$NEXT_DEPS" | grep -c 'eslint-plugin-react' || true)
echo "eslint-config-next"
printf '  version           : %s\n' "${NEXT_V:-N/A}"
printf '  peer-deps[eslint] : %s\n' "${NEXT_PEER:-N/A}"
printf '  deps contains eslint-plugin-react: %s\n' \
  "$([ "${NEXT_HAS_REACT_DEP:-0}" -gt 0 ] && echo 'YES (transitive blocker)' || echo 'no')"
echo ""

# --- Trigger evaluation -------------------------------------------------------

echo "--- Trigger evaluation (from PLAN-ESLINT-10-RETRY.md §3) ---"
echo ""

# TRIGGER A: peer-deps must declare ESLint 10 support.
# Conservative: we only fire A if `peer-deps[eslint]` actually lists ^10 /
# >=10. Major-version advancement alone is not a signal — a hypothetical
# v8.0.0 with peer still capped at ^9.7 would still ERESOLVE against ESLint 10.
if has_10_in_peer "$REACT_PEER"; then
  TRIGGER_A=true
  printf 'TRIGGER A (eslint-plugin-react supports ESLint 10)         : ✅ FIRED (peer indicates ^10/>=10)\n'
else
  printf 'TRIGGER A (eslint-plugin-react supports ESLint 10)         : ⏸ not yet  (peer=%s, major=%s)\n' \
    "${REACT_PEER:-N/A}" "${REACT_MAJ:-N/A}"
fi

# TRIGGER B: same conservative rule.
if has_10_in_peer "$HOOKS_PEER"; then
  TRIGGER_B=true
  printf 'TRIGGER B (eslint-plugin-react-hooks supports ESLint 10)    : ✅ FIRED (peer indicates ^10/>=10)\n'
else
  printf 'TRIGGER B (eslint-plugin-react-hooks supports ESLint 10)    : ⏸ not yet  (peer=%s, major=%s)\n' \
    "${HOOKS_PEER:-N/A}" "${HOOKS_MAJ:-N/A}"
fi

# TRIGGER C: eslint-config-next no longer bundles the incompatible react preset.
if [ "${NEXT_HAS_REACT_DEP:-0}" -eq 0 ]; then TRIGGER_C=true; fi
printf 'TRIGGER C (eslint-config-next free of incompatible preset) : %s\n' \
  "$([ "$TRIGGER_C" = true ] && echo '✅ FIRED' || echo '⏸ not yet')"

echo ""

# --- Final decision ----------------------------------------------------------
#
# Architecture rationale:
#   - TRIGGER A and TRIGGER C are "main blockers" — they cover the actual
#     install failures because eslint-plugin-react@7.37.5 still calls
#     contextOrFilename.getFilename() which is removed in ESLint 10.
#   - TRIGGER B (hooks) is "peripheral" — it's bundled by eslint-config-next
#     too, but the critical runtime dep is eslint-plugin-react itself.
#   - Therefore: full retry viability = A OR C; partial progress = only B fires.

if [ "$TRIGGER_A" = true ] || [ "$TRIGGER_C" = true ]; then
  printf '%s ✅ TRIGGER A or TRIGGER C FIRED — ESLint 10 retry is viable.\n' "$ECHO_PREFIX"
  echo ""
  echo "Next steps:"
  echo "  1. Add task to agent-queue.json: cycle-N-eslint-10-retry-execute (priority 1)"
  echo "  2. Follow PLAN-ESLINT-10-RETRY.md §5 (retry execution steps)"
  echo "  3. Validate: tsc 0 errors / vitest 64+/64 / lint exit 0 / build success"
  echo "  4. Roll back per §8 if any step regresses"
  echo ""
  exit 0
elif [ "$TRIGGER_B" = true ]; then
  printf '%s ⏸ PARTIAL PROGRESS — TRIGGER B (hooks) fired but main blocker remains.\n' "$ECHO_PREFIX"
  echo ""
  echo "Why this is partial:"
  echo "  - eslint-plugin-react still caps peer-deps at ^9.7 (TRIGGER A: not fired)"
  echo "  - eslint-config-next@latest still bundles eslint-plugin-react (TRIGGER C: not fired)"
  echo "  - npm install with eslint@10 will fail with ERESOLVE"
  echo ""
  echo "Recommendation: continue monitoring. The hooks plugin upgrade is a"
  echo "good sign, but retry requires TRIGGER A or TRIGGER C to fire."
  echo "Plan reference: PLAN-ESLINT-10-RETRY.md §3"
  echo ""
  exit 2
else
  printf '%s ⏸ ALL TRIGGERS FAILED — upstream ecosystem not ready.\n' "$ECHO_PREFIX"
  echo ""
  echo "Reference state (June 2026 baseline):"
  echo "  - eslint-plugin-react@7.37.5 caps peer-deps[eslint] at ^9.7, no 8.x exists"
  echo "  - eslint-plugin-react-hooks pending TRIGGER-A fix (or any post-update)"
  echo "  - eslint-config-next@16.2.9 transitively bundles eslint-plugin-react"
  echo ""
  echo "Recommendation: re-run this check next quarter (Q3 2026)."
  echo "Plan reference: PLAN-ESLINT-10-RETRY.md §4.2 (this script)"
  echo ""
  exit 1
fi
