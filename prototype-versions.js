// prototype-versions.js — the CYOS prototype registry: every version of this
// flow the shared toolbar (toolbar/) can switch between. This file is
// HOST-specific by design — the toolbar itself stays generic and receives
// this list through the PrototypeBar `versions` prop and the protoVersions
// vite plugin. A project with a single version simply passes nothing.
//
//   key         unique id; also what the dev-server starter receives
//   label       short name on the toolbar badge and in its menu
//   desc        one line under the label in the switcher menu
//   port        dev-server port (localhost switching and auto-start)
//   path        this version's folder in the repo AND its path segment on the
//               deployed Pages site (…github.io/cyos/<path>/), so switch
//               links stay in step with what the deploy workflow publishes
//   url         the live (deployed) address of this version — what the
//               toolbar's Share menu hands out, from localhost too
//   toolbarKey  the ?<key>-toolbar-active gate of THAT version's deploy
const LIVE = "https://effectory-ux.github.io/cyos/";
export const VERSIONS = [
  { key: "phase-1", label: "Phase 1", desc: "Survey creation flow", port: 5180, path: "phase-1", url: LIVE + "phase-1/", toolbarKey: "id-backstage" },
  { key: "phase-2", label: "Phase 2", desc: "Survey-scoped customization", port: 5181, path: "phase-2", url: LIVE + "phase-2/", toolbarKey: "id-backstage" },
  { key: "phase-3", label: "Phase 3", desc: "Question logic on top of phase 2", port: 5182, path: "phase-3", url: LIVE + "phase-3/", toolbarKey: "id-backstage" },
];
