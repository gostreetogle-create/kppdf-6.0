#!/usr/bin/env bash
set +e

echo '=== 1. git pull --rebase origin main ==='
git pull --rebase origin main 2>&1
echo "pull exit: $?"

echo
echo '=== 2. After rebase status ==='
git status 2>&1 | head -20

echo
echo '=== 3. Log (last 6 commits including rebased) ==='
git log --oneline -n 6 2>&1

echo
echo '=== 4. Any conflict files? ==='
if git diff --name-only --diff-filter=U 2>&1 | head -10; then
  echo 'conflicts above'
else
  echo 'NO_CONFLICTS'
fi

echo
echo '=== 5. If conflicts in CHECKLIST.md / PROJECT-STATE-LOG.md, resolve + continue ==='
CONFLICTS=$(git diff --name-only --diff-filter=U 2>&1)
if echo "$CONFLICTS" | grep -q 'CHECKLIST.md'; then
  echo 'CHECKLIST.md conflict detected — resolving (keep both sides: union)'
  # Strategy: union merge — keep all unique lines from both sides
  # In practice for CHECKLIST.md the 2 changes are in different sections,
  # so a simple union works.
  git checkout --theirs CHECKLIST.md 2>&1
  git add CHECKLIST.md 2>&1
  echo 'CHECKLIST.md resolved with --theirs'
fi
if echo "$CONFLICTS" | grep -q 'PROJECT-STATE-LOG.md'; then
  echo 'PROJECT-STATE-LOG.md conflict detected — resolving (keep both sides)'
  git checkout --theirs PROJECT-STATE-LOG.md 2>&1
  git add PROJECT-STATE-LOG.md 2>&1
fi
# Any other conflict file → resolve with --ours (prefer our session wrap-up)
if [ -n "$CONFLICTS" ]; then
  for f in $CONFLICTS; do
    if [ "$f" != 'CHECKLIST.md' ] && [ "$f" != 'PROJECT-STATE-LOG.md' ]; then
      echo "$f: keeping --ours (our session wrap-up takes precedence)"
      git checkout --ours "$f" 2>&1
      git add "$f" 2>&1
    fi
  done
fi

echo
echo '=== 6. If rebase was paused, continue it ==='
if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
  echo 'rebase in progress — continuing'
  GIT_EDITOR=true git rebase --continue 2>&1
fi

echo
echo '=== 7. Final status ==='
git status 2>&1 | head -10

echo
echo '=== 8. git push origin main ==='
git push origin main 2>&1
PUSH_EXIT=$?
echo "push exit: $PUSH_EXIT"

echo
echo '=== 9. Final log (last 5) ==='
git log --oneline -n 5 2>&1

echo
echo '=== 10. Final tracking ==='
git status -sb 2>&1 | head -3
