// proto-config.js — what THIS prototype puts in the (generic) prototype
// toolbar. Phase 1 is the finished first flow, kept as a reference: it gets
// the bar for identity and version switching (plus the link/share buttons),
// but no use cases, edge cases or variants — menus without entries are not
// rendered. Add them here if phase 1 ever needs presenting states again.
export const PROTO_STORAGE_PREFIX = "cyos";

// The key in `?<key>-toolbar-active`, the URL that carries the toolbar to
// someone else's browser on the deployed prototype. Same key as the other
// phases so one shared link convention covers the whole prototype family;
// rotate it here (and in prototype-versions.js) to invalidate handed-out
// phase-1 toolbar links.
export const PROTO_TOOLBAR_KEY = "id-backstage";
