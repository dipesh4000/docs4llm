#!/usr/bin/env bash
# Used by vercel.json -> ignoreCommand.
# Exit 0  => skip Vercel deploy
# Exit 1  => continue build
#
# Skips when:
# - Commit message contains [skip vercel]
# - Open PR for this branch has the skip-vercel label

set -euo pipefail

MSG="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if echo "$MSG" | grep -qi '\[skip vercel\]'; then
  echo "vercel-ignore: commit message has [skip vercel] — skipping"
  exit 0
fi

REPO="${VERCEL_GIT_REPO_OWNER:-docs4llm}/${VERCEL_GIT_REPO_SLUG:-docs4llm}"
PR_ID="${VERCEL_GIT_PULL_REQUEST_ID:-}"

if [ -z "$PR_ID" ] || [ "$PR_ID" = "0" ]; then
  # Not a PR deployment — still allow skip via commit message (handled above).
  echo "vercel-ignore: no PR id — continuing build"
  exit 1
fi

LABELS_JSON="$(curl -fsSL "https://api.github.com/repos/${REPO}/issues/${PR_ID}/labels" || echo '[]')"
if echo "$LABELS_JSON" | grep -q '"name": "skip-vercel"'; then
  echo "vercel-ignore: PR #${PR_ID} has skip-vercel label — skipping"
  exit 0
fi

echo "vercel-ignore: PR #${PR_ID} has no skip-vercel label — continuing build"
exit 1
