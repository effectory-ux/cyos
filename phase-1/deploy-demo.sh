#!/bin/sh
# Rebuild and redeploy the public live demo (GitHub Pages).
#
#   Source repo (private):  N33G3K/cyos-survey-creation-flow
#   Demo repo   (public):   N33G3K/cyos-survey-creation-flow-demo
#   Live URL:               https://n33g3k.github.io/cyos-survey-creation-flow-demo/
#
# Builds the app, then pushes the build output to the demo repo's main branch.
# Requires `gh` auth (or git push access) to the demo repo.
set -e
cd "$(dirname "$0")"
DEMO_REPO="https://github.com/N33G3K/cyos-survey-creation-flow-demo.git"
LIVE_URL="https://n33g3k.github.io/cyos-survey-creation-flow-demo/"

echo "▸ Building…"
npm run build

TMP="$(mktemp -d)"
echo "▸ Cloning demo repo…"
git clone --depth 1 "$DEMO_REPO" "$TMP" >/dev/null 2>&1

# Replace the build output, preserving repo metadata + README + .nojekyll.
find "$TMP" -mindepth 1 -maxdepth 1 \
  ! -name .git ! -name README.md ! -name .nojekyll -exec rm -rf {} +
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"

cd "$TMP"
git add -A
if git diff --cached --quiet; then
  echo "▸ No changes to deploy."
else
  git commit -q -m "Redeploy demo build"
  git push -q origin main
  echo "▸ Deployed. Live in ~1 min at: $LIVE_URL"
fi
rm -rf "$TMP"
