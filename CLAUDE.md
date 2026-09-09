## The prototype toolbar (`prototype-toolbar` package)

Every phase gets the shared prototype toolbar as the npm package
`prototype-toolbar`, installed from github.com/effectory-ux/prototype-toolbar
and pinned to a release line in each phase's package.json. Phase 2 is on
`#semver:^3.0.0`; phase 1 and phase 3 are still on `^2.0.0`, so they keep the
Events and Edit buttons until someone moves them across (a major does not
arrive via `npm update` — it needs `npm install …#semver:^3.0.0` plus the
plugin rename below and dropping any `events`/`funnels` props).
Rules:

- **Don't edit anything under `node_modules/prototype-toolbar`.** Change the
  toolbar in its own repo (locally `~/Claude/prototype-toolbar`) and release it
  there; then `npm update prototype-toolbar` in each phase and commit the lock
  files. To try an unreleased toolbar here, start a phase with
  `PROTO_TOOLBAR_DEV=~/Claude/prototype-toolbar npm --prefix phase-2 run dev`
  (the vite config aliases the package to that clone).
- The toolbar shows for any URL carrying `?prototype-toolbar`. It is a query
  parameter, so in CYOS it goes **after the page, before the `#`** —
  `…/phase-2/?prototype-toolbar#/surveys/s3/questionnaire`. Sloppier forms
  (at the very end, after the hash route) are tidied into that one on
  arrival, but only on a real page load: pasting the flag onto a route you
  already have open just changes the fragment, so reload once. Links of the
  older `?<key>-toolbar-active` form are dead since toolbar 2.0.0.
- The flag and the `(dialog:…)` route are independent: the flag lives in the
  query, the route in the hash, and `parse()` in `src/data/routes.js` drops
  anything from the first `?` so a stray flag can never eat the dialog
  segment. Keep both halves intact when touching either.
- CYOS's own settings for the bar live in `prototype-versions.js` (root) and
  each phase's `src/data/proto-config.js`.
- Imports are `prototype-toolbar/PrototypeBar.jsx` and the two vite plugins
  `prototype-toolbar/vite-plugin-proto-screens.js` / `…-proto-versions.js`.
- **Toolbar 3.0.0 dropped the Piwik event layer and inline text editing.**
  Both need dedicated time before they come back, so don't reintroduce
  `data-piwik` markers, `data-t` ids, a `piwik-events.js` registry or a
  `proto-edits.json`. The old spec is in git if it is ever picked up again.
  The bar is Screens, Edge cases, Variants, Figma and Share.

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

