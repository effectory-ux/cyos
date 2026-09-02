// proto-config.js — what THIS prototype puts in the (generic) prototype
// toolbar. The whole module is handed to the bar as `config={PROTO}`: declare
// a setting here and its menu shows up, no extra wiring in the bar.
export const PROTO_STORAGE_PREFIX = "cyos";

// The key in `?<key>-toolbar-active`, the URL that carries the toolbar to
// someone else's browser on the deployed prototype. Same key as the other
// phases so one shared link convention covers the whole prototype family;
// rotate it here (and in prototype-versions.js) to invalidate handed-out
// phase-1 toolbar links.
export const PROTO_TOOLBAR_KEY = "id-backstage";

export const START_POINTS = [
  { key: "surveys", label: "Surveys list" },
  { key: "template-dialog", label: "Choose a template" },
  { key: "builder", label: "Questionnaire (draft survey)" },
  { key: "builder-scratch", label: "Questionnaire (empty)" },
];

// States that are otherwise fiddly to reproduce by hand while presenting.
export const USE_CASES = [
  { key: "surveys", label: "Surveys list", desc: "The landing page" },
  { key: "template-dialog", label: "Choose a template", desc: "6 templates, search, start from scratch" },
  { key: "name-dialog", label: "Name your survey", desc: "After choosing a template" },
  { key: "builder", label: "Questionnaire", desc: "A draft built from a template" },
  { key: "builder-scratch", label: "Questionnaire: empty", desc: "Nothing added yet" },
  { key: "select-questions", label: "Add questions", desc: "Library, custom, themes, templates" },
];

// Design variants under exploration (the toolbar's Variants menu). Once one
// wins, it becomes the default and leaves this list.
export const VARIANTS = [
  { key: "templateTags", label: "Active templates on the summary",
    desc: "DEFAULT — the summary card tags each template that is fully in the questionnaire; the tag opens it in Templates. Off = no template tags on the card." },
];
export const defaultVariants = { templateTags: true };

// Not every account is the same — flip these to show a use case both ways.
export const EDGE_CASES = [
  { key: "required", label: "Org-required questions", on: true,
    desc: "Questions the organization always asks: pre-selected and not removable" },
];
export const defaultEdges = { required: true };
