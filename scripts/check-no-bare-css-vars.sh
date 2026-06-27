#!/usr/bin/env bash
# scripts/check-no-bare-css-vars.sh
#
# Regression guard: detect bare var(X) without -- prefix in CSS/TSX/TS source.
# CSS custom properties MUST use var(--name), not var(name).
#
# v1.0.6 (2026-06-19) — single-invocation perl -c capture (was double-invoke).
# v1.0.5 — three hardenings from v1.0.4 review:
#   • CRLF: strip \r after slurp so line counting is accurate on Windows files.
#   • scan.pl self-test (perl -c) before the find loop so a typo in scan.pl
#     aborts loudly (exit 2) instead of being swallowed by `|| true` + 2>/dev/null.
#   • Friendly SEARCH_DIR-not-found message before find.
# v1.0.4 — moved Perl source to a temp .pl file (removed bash↔Perl escape
# collapse bug from v1.0.3).
# v1.0.3 — line-preserving comment strip (broken — see v1.0.4 note).
# v1.0.2 — Perl -0777 refactor.
# v1.0.1 — Python heredoc (rejected: portability).
# v1.0.0 — shell grep (false-positives on CSS block comments).
#
# Strategy:
#   1. Write scan.pl to a tmp file with `<<'PERL_EOF'` heredoc (no shell
#      interpolation).
#   2. Self-test `perl -c` on scan.pl; abort 2 on syntax error.
#   3. `perl scan.pl "$f"` per candidate file (one fork per file).
#   4. scan.pl: slurp file, strip \r, replace /* … */ with same-N newlines,
#      remove // line comments in TS/JS, then print each `var(<word-char>`
#      hit with source line number.
#
# Exit codes (v1.0.6):
#   0  CLEAN — no bare var() in source (comments correctly stripped)
#   1  VIOLATIONS — bare var() in actual code; reported line numbers match source
#   2  perl missing / mktemp failed / scan.pl invalid (perl -c exit 2 on parse error) / SEARCH_DIR missing
#
# Usage:
#   ./scripts/check-no-bare-css-vars.sh                # check src/
#   ./scripts/check-no-bare-css-vars.sh src/components  # check specific dir

set -euo pipefail

SCRIPT_VERSION="1.0.7"
SEARCH_DIR="${1:-src}"

if ! command -v perl >/dev/null 2>&1; then
  echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ perl required (not in PATH)" >&2
  exit 2
fi

if [ ! -d "$SEARCH_DIR" ]; then
  echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ SEARCH_DIR not found: $SEARCH_DIR" >&2
  exit 2
fi

PERL_SCAN="$(mktemp 2>/dev/null)" || { echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ mktemp failed" >&2; exit 2; }
TMP_VIOLATIONS="$(mktemp 2>/dev/null)" || { rm -f "$PERL_SCAN"; echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ mktemp failed" >&2; exit 2; }
TMP_VIOLATIONS_PASS2="$(mktemp 2>/dev/null)" || { rm -f "$PERL_SCAN" "$TMP_VIOLATIONS"; echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ mktemp failed" >&2; exit 2; }
trap 'rm -f "$PERL_SCAN" "$TMP_VIOLATIONS" "$TMP_VIOLATIONS_PASS2"' EXIT

# Write Perl scanner to a tmp file. Single-quoted heredoc preserves backslashes
# exactly as perl source code expects — no shell↔perl escape ambiguity.
cat > "$PERL_SCAN" <<'PERL_EOF'
use strict;
use warnings;
local $/;  # slurp mode: $_ = <> reads whole file
my $file   = $ARGV;
my $is_ts  = ($file =~ /\.(tsx?|jsx?)$/i);
my $nl     = chr(10);  # literal newline character

$_ = <>;  # slurp the entire file into $_

# Strip CR (CRLF safety) so Windows-edited files get accurate line counts.
s/\r//g;

# Replace each /* … */ block with the SAME number of newlines it contained,
# preserving source line positions for accurate line-number reporting.
s|/\*.*?\*/|($nl x ($& =~ tr/\n//))|egs;

# Strip // line comments in TS/JS (CSS does not allow //, so this is safe).
if ($is_ts) {
  s|//[^\n]*||g;
}

# Find every `var(<word-char>` and report it.
while (/var\([a-zA-Z0-9_]/g) {
  my $pre     = substr($_, 0, pos($_));
  my $lineno  = 1 + ($pre =~ tr/\n//);
  print "$file:$lineno: $&\n";
}
PERL_EOF

# Self-test: catch a typo/syntax error in scan.pl BEFORE the find loop.
# Without this, `|| true` + `2>/dev/null` would silently report ✅ CLEAN even
# if scan.pl was completely broken.
if ! PERL_CHECK=$(perl -c "$PERL_SCAN" 2>&1); then
  echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ scan.pl failed self-test:" >&2
  echo "$PERL_CHECK" >&2
  exit 2
fi

# Find candidate files. POSIX find + -print0 + read -d '' handles spaces & unicode.
# Note: the `*.tsx` clause is essential — `find -name '*.ts'` does NOT match
# `.tsx`; do not remove it as redundant.
# --- Pass 1: with comment stripping (default) ---
find "$SEARCH_DIR" \
  \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.turbo/*' \
  -print0 2>/dev/null \
| while IFS= read -r -d '' f; do
  perl "$PERL_SCAN" "$f" 2>/dev/null >> "$TMP_VIOLATIONS" || true
done

# --- Pass 2: WITHOUT comment stripping (Tailwind content-scanner footguns) ---
# Re-write scan.pl without comment stripping for pass-2
cat > "$PERL_SCAN" <<'PERL_EOF'
use strict;
use warnings;
local $/;
my $file   = $ARGV;
my $nl     = chr(10);

$_ = <>;
s/\r//g;

# NO comment stripping — catch everything

while (/var\([a-zA-Z0-9_]/g) {
  my $pre     = substr($_, 0, pos($_));
  my $lineno  = 1 + ($pre =~ tr/\n//);
  print "$file:$lineno: $& (raw)\n";
}
PERL_EOF

if ! PERL_CHECK=$(perl -c "$PERL_SCAN" 2>&1); then
  echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ scan.pl pass-2 failed self-test:" >&2
  echo "$PERL_CHECK" >&2
  exit 2
fi

find "$SEARCH_DIR" \
  \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.next/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.turbo/*' \
  -print0 2>/dev/null \
| while IFS= read -r -d '' f; do
  perl "$PERL_SCAN" "$f" 2>/dev/null >> "$TMP_VIOLATIONS_PASS2" || true
done

# Combine results
if [ -s "$TMP_VIOLATIONS_PASS2" ]; then
  cat "$TMP_VIOLATIONS_PASS2" >> "$TMP_VIOLATIONS"
fi

if [ ! -s "$TMP_VIOLATIONS" ]; then
  echo "[css-vars-guard v${SCRIPT_VERSION}] ✅ CLEAN — no bare var() in $SEARCH_DIR/"
  exit 0
fi

COUNT=$(wc -l < "$TMP_VIOLATIONS" | tr -d ' ')
echo "[css-vars-guard v${SCRIPT_VERSION}] ❌ $COUNT VIOLATION(S) — bare var() without -- prefix:"
echo ""
cat "$TMP_VIOLATIONS"
echo ""
echo "Fix: var(name) → var(--name) for CSS custom properties."
echo "Example: var(primary) → var(--primary)"
exit 1
