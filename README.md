# CYOS — survey creation flow prototypes

Monorepo for the CYOS (create-your-own-survey) prototype phases, built on the
Effectory Engage Design System. Each phase is a self-contained Vite app in its
own folder with its own demo deployment — **updates are strictly scoped per
phase**: changing or deploying one phase never touches the others' live demos.

All phases are served from this repo's own GitHub Pages site, with a landing
page at **https://effectory-ux.github.io/cyos/**:

| Phase | Source | Live demo | Dev port |
|---|---|---|---|
| Phase 1 — base survey creation flow | [`phase-1/`](phase-1/) | https://effectory-ux.github.io/cyos/phase-1/ | 5180 |
| Phase 2 — survey-scoped customization | [`phase-2/`](phase-2/) | https://effectory-ux.github.io/cyos/phase-2/ | 5181 |

Phase 1's original demo link, https://n33g3k.github.io/cyos-survey-creation-flow-demo/,
still works — it's now a static redirect (served from the personal
`cyos-survey-creation-flow-demo` repo) that forwards to the phase-1 demo above,
so existing bookmarks keep resolving. It has no build step.

## Working on a phase

Each phase folder is a standalone npm project:

```sh
cd phase-2
npm install
npm run dev
```

## Deploying the demos

Nothing deploys automatically — pushing to `main` changes no demo. The Pages
site (landing page + all phases) is published only by manually running the
**Deploy demos** workflow:

```sh
gh workflow run "Deploy demos"
```

A run rebuilds every phase from `main`; phases whose source didn't change build
to an identical app, so they stay effectively frozen. Phase 1's original demo
link is no longer built separately — the personal `cyos-survey-creation-flow-demo`
repo now serves only a static redirect to `phase-1/` above, so there's nothing
to deploy for it.

See each phase's own README and NOTICE for what's implemented and which files
are vendored from the design system.
