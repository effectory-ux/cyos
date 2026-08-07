#!/bin/sh
# Rebuild and (re)deploy the public live demo (GitHub Pages).
#
#   Source:      phase-1/ in N33G3K/cyos (monorepo)
#   Demo repo:   N33G3K/cyos-survey-creation-flow-demo (public, build output only)
#   Live URL:    https://n33g3k.github.io/cyos-survey-creation-flow-demo/
#
# Publishes the build output as a SINGLE clean commit (force-push), so the public
# demo repo never accumulates history — only the latest build is ever present.
# Requires `gh` auth (or git push access) to the demo repo.
set -e
cd "$(dirname "$0")"
DEMO_REPO="https://github.com/N33G3K/cyos-survey-creation-flow-demo.git"
LIVE_URL="https://n33g3k.github.io/cyos-survey-creation-flow-demo/"

echo "▸ Building…"
npm run build

TMP="$(mktemp -d)"
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"
cat > "$TMP/README.md" <<'EOF'
# CYOS survey creation flow — live demo

Generated static build of the CYOS survey-creation flow prototype, published via
GitHub Pages for testing and sharing.

**Live demo:** https://n33g3k.github.io/cyos-survey-creation-flow-demo/

⚠️ Build output only — do not edit by hand. Source lives in the `phase-1/` folder of
https://github.com/N33G3K/cyos — rebuild and re-deploy from there with `./deploy-demo.sh`.
EOF

cd "$TMP"
git init -q
git checkout -q -b main
git config user.name "Jamal van Rooijen"
git config user.email "N33G3K@users.noreply.github.com"
git add -A
git commit -q -m "Live demo build"
git remote add origin "$DEMO_REPO"
echo "▸ Publishing (single clean commit)…"
git push -q --force origin main
cd - >/dev/null
rm -rf "$TMP"
echo "▸ Deployed. Live in ~1 min at: $LIVE_URL"
