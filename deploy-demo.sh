#!/bin/sh
# Rebuild and (re)deploy the public live demo (GitHub Pages).
#
#   Source repo (private):  N33G3K/cyos-phase-2
#   Demo repo   (public):   N33G3K/cyos-phase-2-demo
#   Live URL:               https://n33g3k.github.io/cyos-phase-2-demo/
#
# Publishes the build output as a SINGLE clean commit (force-push), so the public
# demo repo never accumulates history — only the latest build is ever present.
# Requires `gh` auth (or git push access) to the demo repo.
set -e
cd "$(dirname "$0")"
DEMO_REPO="https://github.com/N33G3K/cyos-phase-2-demo.git"
LIVE_URL="https://n33g3k.github.io/cyos-phase-2-demo/"

echo "▸ Building…"
npm run build

TMP="$(mktemp -d)"
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"
cat > "$TMP/README.md" <<'EOF'
# CYOS phase 2 — live demo

Generated static build of the CYOS survey-creation flow (phase 2) prototype,
published via GitHub Pages for testing and sharing.

**Live demo:** https://n33g3k.github.io/cyos-phase-2-demo/

⚠️ Build output only — do not edit by hand. Source lives in a separate (private)
repository; rebuild and re-deploy from there with `./deploy-demo.sh`.
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
