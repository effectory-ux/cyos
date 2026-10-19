#!/usr/bin/env bash
# Replay phase-2.3 commits onto phase-3/.
#
# Phase 3 was forked from phase-2.3/ at the commit recorded in
# phase-3/.phase23-sync-base. This script replays every commit since then that
# touched phase-2.3/ onto phase-3/ (paths rewritten), then advances the base.
#
# Per-phase identity files are never synced: vite.config.js (port),
# package.json (name) and this phase's README.md (its header names phase 3).
# The lock file is skipped too — its hunks never apply across the renamed
# package; run `npm install --prefix phase-3` after a sync that touched
# dependencies and commit the regenerated lock.
#
# Conflicts: hunks that no longer apply are written next to the file as .rej;
# the script stops at that commit with the base already advanced past it, so
# resolve the .rej files by hand and re-run.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

BASE_FILE=phase-3/.phase23-sync-base
base=$(cat "$BASE_FILE")

EXCLUDES=(
  ':(exclude)phase-2.3/vite.config.js'
  ':(exclude)phase-2.3/package.json'
  ':(exclude)phase-2.3/package-lock.json'
  ':(exclude)phase-2.3/README.md'
)

commits=$(git rev-list --reverse "$base"..HEAD -- phase-2.3/)
if [ -z "$commits" ]; then
  echo "phase-3 is already in sync with phase-2.3 (base $(git rev-parse --short "$base"))."
  git rev-parse HEAD > "$BASE_FILE"
  exit 0
fi

for c in $commits; do
  subj=$(git log -1 --format='%h %s' "$c")
  patch=$(git diff-tree --no-commit-id --binary --relative=phase-2.3 -p "$c" -- phase-2.3/ "${EXCLUDES[@]}")
  if [ -z "$patch" ]; then
    echo "skip   $subj (only excluded files)"
    git rev-parse "$c" > "$BASE_FILE"
    continue
  fi
  if printf '%s\n' "$patch" | git apply --binary --directory=phase-3 --reject; then
    echo "synced $subj"
    git rev-parse "$c" > "$BASE_FILE"
  else
    git rev-parse "$c" > "$BASE_FILE"
    echo
    echo "CONFLICT while replaying: $subj"
    echo "Some hunks were applied; the rest are in these .rej files:"
    find phase-3 -name '*.rej' | sort
    echo "Resolve them (apply by hand, delete the .rej), then re-run this script."
    exit 1
  fi
done

git rev-parse HEAD > "$BASE_FILE"
echo "Done — base advanced to $(git rev-parse --short HEAD)."
