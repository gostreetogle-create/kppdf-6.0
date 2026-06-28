#!/usr/bin/env bash
set +e

echo '=== 1. STATE BEFORE: confirm we are in detached HEAD with rebase paused ==='
git status 2>&1 | head -5
git branch --show-current 2>&1 || echo 'no current branch (detached)'

echo
echo '=== 2. Abort the paused rebase ==='
git rebase --abort 2>&1
echo "abort exit: $?"
git status 2>&1 | head -5

echo
echo '=== 3. Confirm back on main + my 2 commits still there ==='
git branch --show-current 2>&1
git log --oneline -n 4 2>&1

echo
echo '=== 4. Remove working-tree build cache files (now in .gitignore) ==='
rm -f tsconfig.tsbuildinfo next-env.d.ts 2>&1
echo 'removed'
ls -la tsconfig.tsbuildinfo next-env.d.ts 2>&1 || echo 'both gone'

echo
echo '=== 5. Clean untracked files that would block rebase ==='
git clean -f tsconfig.tsbuildinfo next-env.d.ts 2>&1 || echo 'no need'

echo
echo '=== 6. Now rebase against origin/main ==='
git pull --rebase origin main 2>&1
PULL_EXIT=$?
echo "pull exit: $PULL_EXIT"

echo
echo '=== 7. Status after rebase ==='
git status 2>&1 | head -15
git log --oneline -n 6 2>&1

echo
echo '=== 8. Detect conflicts + resolve ==='
CONFLICTS=$(git diff --name-only --diff-filter=U 2>&1)
if [ -n "$CONFLICTS" ]; then
  echo "CONFLICTS detected: $CONFLICTS"
  for f in $CONFLICTS; do
    echo "  Resolving $f: prefer --theirs (remote/Architect output)"
    git checkout --theirs "$f" 2>&1
    git add "$f" 2>&1
  done
  echo
  echo '=== 9. Continue rebase ==='
  GIT_EDITOR=true git rebase --continue 2>&1 | head -20
else
  echo 'NO_CONFLICTS — rebase clean'
fi

echo
echo '=== 10. Final state after rebase ==='
git status 2>&1 | head -5
git log --oneline -n 8 2>&1

echo
echo '=== 11. Tracking ==='
git status -sb 2>&1 | head -3

echo
echo '=== 12. Push to origin/main ==='
git push origin main 2>&1
PUSH_EXIT=$?
echo "push exit: $PUSH_EXIT"

echo
echo '=== 13. Final verification ==='
git status -sb 2>&1 | head -3
git log --oneline -n 6 2>&1
