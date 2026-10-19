# CYOS — survey creation flow prototypes

Monorepo for the CYOS (create-your-own-survey) prototype phases, built on the
Effectory Engage Design System. Each phase is a self-contained Vite app in its
own folder with its own demo deployment — **updates are strictly scoped per
phase**: changing or deploying one phase never touches the others' live demos.

All phases are served from ux.effectory.com (Azure Static Web Apps, behind
Microsoft sign-in; access: Effectory staff), with a landing page at
**https://ux.effectory.com/prototypes/cyos/**:

| Phase | Source | Live demo | Dev port |
|---|---|---|---|
| Phase 1 — base survey creation flow | [`phase-1/`](phase-1/) | https://ux.effectory.com/prototypes/cyos/demo/phase-1/ | 5180 |
| Phase 2 — survey-scoped customization | [`phase-2/`](phase-2/) | https://ux.effectory.com/prototypes/cyos/demo/phase-2/ | 5181 |
| Phase 2.1 — iteration on phase 2 | [`phase-2.1/`](phase-2.1/) | https://ux.effectory.com/prototypes/cyos/demo/phase-2.1/ | 5183 |
| Phase 2.2 — iteration on phase 2.1 | [`phase-2.2/`](phase-2.2/) | https://ux.effectory.com/prototypes/cyos/demo/phase-2.2/ | 5184 |
| Phase 2.3 — iteration on phase 2.2 | [`phase-2.3/`](phase-2.3/) | https://ux.effectory.com/prototypes/cyos/demo/phase-2.3/ | 5185 |
| Phase 3 — next version, restarted from phase 2.3 | [`phase-3/`](phase-3/) | https://ux.effectory.com/prototypes/cyos/demo/phase-3/ | 5182 |

Phase 1's original demo link, https://n33g3k.github.io/cyos-survey-creation-flow-demo/,
is a static redirect in the personal `cyos-survey-creation-flow-demo` repo. It
still points at the old GitHub Pages address of phase 1.

## Working on a phase

Each phase folder is a standalone npm project:

```sh
cd phase-2
npm install
npm run dev
```

## Deploying the demos

Nothing deploys automatically — pushing source changes to `main` changes no
demo. ux.effectory.com serves `main` as-is, without a build step, so the built
site lives in [`demo/`](demo/) on `main` and the root `index.html` forwards to
it. Never edit `demo/` by hand. The **Deploy demos** workflow builds only the
slice you pick and commits it to `demo/`; everything else there stays
byte-identical:

```sh
gh workflow run "Deploy demos" -f target=site-and-research   # landing + research docs only
gh workflow run "Deploy demos" -f target=phase-2             # phase-2 demo only
gh workflow run "Deploy demos" -f target=phase-2.1           # phase-2.1 demo only
gh workflow run "Deploy demos" -f target=phase-2.2           # phase-2.2 demo only
gh workflow run "Deploy demos" -f target=phase-2.3           # phase-2.3 demo only
gh workflow run "Deploy demos" -f target=phase-1             # phase-1 demo only
gh workflow run "Deploy demos" -f target=phase-3             # phase-3 demo only
gh workflow run "Deploy demos" -f target=everything
```

A phase built locally (for example when CI can't reach the private toolbar)
goes the same way: copy its `dist/` to `demo/<phase>/` and commit that to `main`.

Research docs are static pages in `site/research/<slug>/index.html`, linked
from the landing page. Phase 1's original demo link is not built separately —
the personal `cyos-survey-creation-flow-demo` repo serves only a static
redirect to `phase-1/` above, so there's nothing to deploy for it.

See each phase's own README and NOTICE for what's implemented and which files
are vendored from the design system.
