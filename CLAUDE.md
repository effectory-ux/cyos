## The prototype toolbar (`prototype-toolbar` package)

Every phase gets the shared prototype toolbar as the npm package
`prototype-toolbar`, installed from github.com/effectory-ux/prototype-toolbar
and pinned to a release line (`#semver:^1.0.0` in each phase's package.json).
Rules:

- **Don't edit anything under `node_modules/prototype-toolbar`.** Change the
  toolbar in its own repo (locally `~/Claude/prototype-toolbar`) and release it
  there; then `npm update prototype-toolbar` in each phase and commit the lock
  files. To try an unreleased toolbar here, start a phase with
  `PROTO_TOOLBAR_DEV=~/Claude/prototype-toolbar npm --prefix phase-2 run dev`
  (the vite config aliases the package to that clone).
- CYOS's own settings for the bar live in `prototype-versions.js` (root) and
  each phase's `src/data/proto-config.js` and `src/data/piwik-events.js`.
- Imports are `prototype-toolbar/PrototypeBar.jsx` and the two vite plugins
  `prototype-toolbar/vite-plugin-proto-edits.js` / `…-proto-versions.js`.
