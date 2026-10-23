#!/usr/bin/env bash
# Tell the agent when phase 2.3 has moved on, so phase 3 keeps building on top
# of it. Run by a UserPromptSubmit hook (.claude/settings.json); silent when
# there is nothing to do. Prints the hook JSON with an additionalContext note:
#   - new phase-2.3 commits since phase-3/.phase23-sync-base → run the sync now
#   - uncommitted phase-2.3 work → it syncs once it's committed (don't port
#     a working tree by hand: the later replay then rejects every hunk)
cd "$(dirname "$0")/.." 2>/dev/null || exit 0
base=$(cat phase-3/.phase23-sync-base 2>/dev/null) || exit 0
new=$(git rev-list --count "$base"..HEAD -- phase-2.3/ 2>/dev/null || echo 0)
wip=$(git status --porcelain -- phase-2.3/ 2>/dev/null | grep -v 'proto-discovered.json' | wc -l | tr -d ' ')
msg=""
if [ "$new" -gt 0 ]; then
  subjects=$(git log --format='%h %s' "$base"..HEAD -- phase-2.3/ | head -5 | tr '\n' ';')
  msg="Phase 2.3 has $new new commit(s) since phase 3's sync base ($subjects). Phase 3 builds on 2.3: run ./phase-3/sync-from-phase-2.3.sh and resolve any .rej (2.3 wins where phase 3 only duplicated it) before other phase-3 work, and tell Jamal what came in."
fi
if [ "$wip" -gt 0 ]; then
  msg="$msg Phase 2.3 also has $wip uncommitted change(s) in progress; they sync once committed — don't port the working tree by hand."
fi
[ -z "$msg" ] && exit 0
jq -n --arg m "$msg" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$m}}'
