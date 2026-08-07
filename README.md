# CYOS — survey creation flow prototypes

Monorepo for the CYOS (create-your-own-survey) prototype phases, built on the
Effectory Engage Design System. Each phase is a self-contained Vite app in its
own folder with its own demo deployment — **updates are strictly scoped per
phase**: changing or deploying one phase never touches the others' live demos.

| Phase | Source | Live demo | Dev port |
|---|---|---|---|
| Phase 1 — base survey creation flow | [`phase-1/`](phase-1/) | https://n33g3k.github.io/cyos-survey-creation-flow-demo/ | 5180 |
| Phase 2 — survey-scoped customization | [`phase-2/`](phase-2/) | https://n33g3k.github.io/cyos-phase-2/ | 5181 |

## Working on a phase

Each phase folder is a standalone npm project:

```sh
cd phase-2
npm install
npm run dev
```

## Deploying a demo

Each phase has its own `deploy-demo.sh` that builds and force-pushes a single
clean commit to that phase's public demo repo (GitHub Pages serves it from
`main`). Nothing deploys automatically — a demo only changes when its script is
run deliberately:

```sh
./phase-2/deploy-demo.sh   # updates ONLY the phase-2 demo
./phase-1/deploy-demo.sh   # updates ONLY the phase-1 demo
```

Demo repos hold build output only (`cyos-survey-creation-flow-demo`,
`cyos-phase-2`) — never edit them by hand; this repo is the single source of
truth. See each phase's own README and NOTICE for details on what's implemented
and which files are vendored from the design system.
