#!/usr/bin/env bash
set -e

echo '=== 1. Check .gitignore for auto-generated files ==='
grep -E 'next-env|tsbuildinfo|\.next' .gitignore 2>&1 || echo 'no matches'

echo
echo '=== 2. Stage all session wrap-up files (skip auto-generated if gitignored) ==='
git add .gitignore CHECKLIST.md MASTER-VISION.md 2>&1
git add '99_Справочники/TASKS/ТЗ-011-RUN-2-5-АНАЛИТИК-ДОГОВОР.md' 2>&1
git add '99_Справочники/TASKS/ТЗ-012-RUN-3-5-АНАЛИТИК-ПРОИЗВОДСТВО.md' 2>&1
git add '04_Склад/LAUNCH-ANALYST-SKLAD.md' 2>&1
git add '05_Финансы/LAUNCH-ANALYST-FINANSY.md' 2>&1
git add '99_Справочники/ID-ALIAS-MAP.md' 2>&1
git add '99_Справочники/TASKS/ТЗ-013-RUN-4-5-АНАЛИТИК-СКЛАД.md' 2>&1
git add '99_Справочники/TASKS/ТЗ-014-RUN-5-5-АНАЛИТИК-ФИНАНСЫ.md' 2>&1

echo
echo '=== 3. Staged set ==='
git diff --cached --stat 2>&1

echo
echo '=== 4. tsconfig.tsbuildinfo status (should be untracked or gitignored) ==='
git status --short tsconfig.tsbuildinfo 2>&1 || true
git status --short next-env.d.ts 2>&1 || true

echo
echo '=== 5. Write commit msg to .tmp/commit-msg.txt ==='
mkdir -p .tmp
cat > .tmp/commit-msg.txt << 'MSGEOF'
chore(docs): session wrap-up - launch packages for run 4/5 + 5/5 + id-alias-map

10 files (8 new + 2 modified) from session wrap-up for analyst pipeline:

new:
- 04_Склад/LAUNCH-ANALYST-SKLAD.md: launch package for run 4/5 analyst sklad
- 05_Финансы/LAUNCH-ANALYST-FINANSY.md: launch package for run 5/5 analyst finansy
- 99_Справочники/ID-ALIAS-MAP.md: id alias map for frozen upstream cross-refs
- 99_Справочники/TASKS/ТЗ-013: run 4/5 sklad analyst spec (finalized)
- 99_Справочники/TASKS/ТЗ-014: run 5/5 finansy analyst spec (finalized)

modified:
- 99_Справочники/TASKS/ТЗ-011, ТЗ-012: code-reviewer final polish
- CHECKLIST.md: 10 ready to launch → 0 ready (all closed)
- MASTER-VISION.md: §4 next-step cli
- .gitignore: minor hygiene

Refs: PSL-040 (ТЗ-013 finalized), psl-041 (run 4/5 launch),
      psl-043 (id-alias-map), psl-045 (prisma schema drift fix).
MSGEOF

echo 'wrote .tmp/commit-msg.txt'
echo
echo '=== 6. Verify commit msg line lengths (commitlint max 100) ==='
awk '{ print length, $0 }' .tmp/commit-msg.txt | sort -nr | head -5

echo
echo '=== 7. Commit (let husky pre-commit run) ==='
git commit -F .tmp/commit-msg.txt 2>&1 | tail -20

echo
echo '=== 8. Confirm commit landed ==='
git log --oneline -n 3 2>&1
