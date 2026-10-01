// proto-config.js — what THIS prototype puts in the (generic) prototype
// toolbar: the states worth jumping to, and where the prototype can open.
// The toolbar itself is the `prototype-toolbar` package and knows nothing of
// CYOS — everything specific to this prototype arrives as props.
export const PROTO_STORAGE_PREFIX = "cyos";


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
  { key: "template-empty", label: "Template search: no results", desc: "Empty state with illustration" },
  { key: "name-dialog", label: "Let's get started", desc: "Name + project, from All surveys" },
  { key: "builder", label: "Questionnaire", desc: "A draft built from a template" },
  { key: "builder-scratch", label: "Questionnaire: empty", desc: "Nothing added yet" },
  { key: "select-questions", label: "Select questions", desc: "Library, custom, themes, templates" },
  { key: "question-settings", label: "Benchmarked question", desc: "Alternative wording + description" },
  { key: "question-edited", label: "Question with a variant", desc: "Alternative wording already applied" },
  { key: "topic-dialog", label: "Topic settings", desc: "Participant intro screen" },
  { key: "topic-custom", label: "Custom topic", desc: "A topic added in this survey" },
  { key: "translations", label: "Translations", desc: "Machine-translated strings to review" },
];

// Design variants under exploration (the toolbar's Variants menu). Once one
// wins, it becomes the default and leaves this list.
export const VARIANTS = [
  { key: "dialogGrouped", label: "Add questions: one browsable list",
    desc: "Off (default) = the rail with a page per source — Library questions, Custom questions, and Themes / Templates as question sets — with Add buttons. On = one list, browsed by topic / theme / template, custom questions on their own." },
  { key: "checkWarnsOnly", label: "Custom question check only warns",
    desc: "Off (default) = Create question stays disabled until the question check has nothing left to fix and a possible duplicate is decided. On = the check only advises; Create always works." },
];
