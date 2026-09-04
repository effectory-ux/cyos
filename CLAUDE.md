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

### Keep the toolbar's knowledge of this prototype current

- The bar learns **screens** on its own: while a phase runs on its dev server,
  every route it shows lands in `public/proto-discovered.json` (commit it).
  Screens no `USE_CASES` entry leads to show up under Screens as "seen here,
  not in this list" and in `node node_modules/prototype-toolbar/check.js phase-N`.
  Before committing UI work, run that check and either add a `USE_CASES` entry
  (with the state setup in `gotoUseCase`) or decide it is not a screen.
- **Edge cases, variants and start points** only exist in the conversation.
  When a prompt introduces an account difference, a design variation, or a
  place the prototype should open, register it in `src/data/proto-config.js`
  (`USE_CASES`, `START_POINTS`, `VARIANTS`) or `src/data/edgecases.js` in the
  same change. A state that exists in the app but not in the toolbar is a bug.

