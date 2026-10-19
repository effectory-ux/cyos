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
  { key: "select-questions", label: "Question library", desc: "From the bar: tick to add, untick to remove; new topics at the end" },
  { key: "library-in-topic", label: "Question library from a topic", desc: "A topic's Add questions: what you tick goes into that topic" },
  { key: "question-settings", label: "Benchmarked question", desc: "Alternative wording + description" },
  { key: "question-edited", label: "Question with a variant", desc: "Alternative wording already applied" },
  { key: "topic-dialog", label: "Topic settings", desc: "Participant intro screen" },
  { key: "topic-custom", label: "Custom topic", desc: "A topic added in this survey" },
  { key: "add-topic", label: "Add topic", desc: "Name a new topic where you clicked; it arrives empty, ready to fill" },
  { key: "empty-topics", label: "Next step with an empty topic", desc: "Add questions and Next step turn secondary; Next shows a notification and outlines the empty topic" },
  { key: "other-questions", label: "Other questions", desc: "A custom question added without a topic lands in this automatic topic" },
  { key: "new-custom-question", label: "New custom question", desc: "Question check, then the translations come in; no topic → Other questions" },
  { key: "theme-details", label: "Theme details", desc: "A theme's questions, from a question's tag" },
  { key: "intro-screen", label: "Welcome page editor", desc: "Title and welcome text on the survey design's own photo (the Welcome page text color variant adds a text color option)" },
  { key: "out-of-scope", label: "Live survey", desc: "Opens elsewhere: live monitoring is another prototype" },
  { key: "translations", label: "Translations", desc: "Machine-translated strings to review" },
];

// Design variants under exploration (the toolbar's Variants menu). Once one
// wins, it becomes the default and leaves this list.
export const VARIANTS = [
  { key: "addAtBottom", label: "Add questions at the bottom of each topic",
    desc: "Off (default) = an Add questions button in each topic's header. On = the previous design: an Add questions row as each topic's last row." },
  { key: "pagesRail", label: "Survey pages panel",
    desc: "Off (default) = no panel; the welcome page's title, text and photo sit above the topics, and the card opens its editor. On = the previous design: a Survey pages panel on the left, switching between the welcome page and the questionnaire." },
  { key: "dialogGrouped", label: "Add questions: one browsable list",
    desc: "Off (default) = the rail with a page per source — Library questions, Custom questions, and Themes / Templates as question sets — with a checkbox per question and Add in the footer. On = one list, browsed by topic / theme / template, custom questions on their own." },
  { key: "introTextColor", label: "Welcome page text color",
    desc: "Off (default) = the welcome page always has light text, on the design's photo. On = a Text color button in the welcome page editor: light or dark text (and, with the text background variant on too, the background on or off)." },
  { key: "introTextBox", label: "Welcome page text background",
    desc: "Off (default) = the welcome text sits straight on the photo (under a soft shade). On = a see-through panel behind the welcome text: dark behind light text, light behind dark text." },
  { key: "whiteTopics", label: "White topic headers",
    desc: "Off (default) = each topic header takes the floating bar's light shade of the survey design, so topics stand apart from their white questions. On = the previous design: white topic headers, like the questions under them." },
  { key: "checkWarnsOnly", label: "Custom question check only warns",
    desc: "Off (default) = Create question stays disabled until the question check has nothing left to fix and a possible duplicate is decided. On = the check only advises; Create always works." },
];
