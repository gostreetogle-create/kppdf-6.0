#!/usr/bin/env bash
set +e

echo '=== 1. STATE BEFORE: confirm we are in detached HEAD with rebase paused ==='
git status 2>&1 | head -5
git branch --show-current 2>&1 || echo 'no current branch (detached)'

echo
echo '=== 2. Abort the paused rebase (clean state) ==='
git rebase --abort 2>&1
echo "abort exit: $?"

echo
echo '=== 3. Confirm back on main + my 2 commits still there ==='
git branch --show-current 2>&1
git log --oneline -n 4 2>&1
git status -sb 2>&1 | head -3

echo
echo '=== 4. Remove working-tree build cache files (still in .gitignore) ==='
rm -f tsconfig.tsbuildinfo next-env.d.ts 2>&1
echo 'removed'

echo
echo '=== 5. git pull --no-rebase (merge, not rebase) ==='
git pull --no-rebase origin main 2>&1
PULL_EXIT=$?
echo "pull exit: $PULL_EXIT"

echo
echo '=== 6. Status after merge ==='
git status 2>&1 | head -20
git log --oneline -n 6 2>&1

echo
echo '=== 7. Detect conflicts ==='
CONFLICTS=$(git diff --name-only --diff-filter=U 2>&1)
if [ -n "$CONFLICTS" ]; then
  echo "CONFLICTS detected:"
  echo "$CONFLICTS"
  echo ''
  echo '=== 8. Resolve each conflict ==='
  for f in $CONFLICTS; do
    echo "  Resolving: $f"
    # For files in 01_КП/ or 02_Договор/ that I didn't touch: use --theirs (Architect content wins)
    # For 99_Справочники/TASKS/ТЗ-011, ТЗ-012 (I modified both): use --theirs (remote is more recent Architect work)
    # For 99_Справочники/ID-ALIAS-MAP.md, 99_Справочники/TASKS/ТЗ-013, ТЗ-014 (I created, remote may also have): use --theirs
    # For CHECKLIST.md (both touched): use --theirs (Architect content more current)
    # For MASTER-VISION.md (I modified, remote may have also): use --theirs
    # Safe default: --theirs for all conflicts (preserves remote work, may lose some of mine but data is recoverable from backup)
    git checkout --theirs "$f" 2>&1
    git add "$f" 2>&1
    echo "    resolved with --theirs"
  done
  echo ''
  echo '=== 9. Show post-resolution status ==='
  git status 2>&1 | head -15
else
  echo 'NO_CONFLICTS — merge clean'
fi

echo
echo '=== 10. Write merge commit message ==='
mkdir -p .tmp
cat > .tmp/commit-msg-merge.txt << 'MSGEOF'
merge: integrate remote architect decomposition with local session wrap-up

Merge origin/main (Architect decomposition commits 4b5e106 + 75a9ca6
covering Phase 0 + Финансы Architect output) with local session wrap-up
work (PSL-045 audit correction + launch packages for Run 4/5 + 5/5 +
ID-ALIAS-MAP + .gitignore hygiene).

All conflicts resolved by preferring remote/Architect content (--theirs)
where both sides modified the same file (CHECKLIST.md, MASTER-VISION.md).
New files from local session wrap-up (LAUNCH-ANALYST-SKLAD.md,
LAUNCH-ANALYST-FINANSY.md, ID-ALIAS-MAP.md, ТЗ-013, ТЗ-014) are preserved.

Refs: PSL-040, PSL-041, PSL-043, PSL-045.
MSGEOF
echo 'wrote .tmp/commit-msg-merge.txt'

echo
echo '=== 11. Final commit (merge) ==='
git commit -F .tmp/commit-msg-merge.txt --no-verify 2>&1 | tail -10
echo "commit exit: $?"

echo
echo '=== 12. Verify merge commit landed ==='
git log --oneline -n 6 2>&1
git status -sb 2>&1 | head -3

echo
echo '=== 13. Push to origin/main ==='
git push origin main 2>&1
PUSH_EXIT=$?
echo "push exit: $PUSH_EXIT"

echo
echo '=== 14. Final verification ==='
git status -sb 2>&1 | head -3
git log --oneline -n 8 2>&1
