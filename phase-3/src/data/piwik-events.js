// piwik-events.js — the Piwik analytics spec for this prototype.
//
// In Figma these lived in comments pinned to a frame:
//
//   PIWIK event
//   Category: { feature_flow }
//   Action: { page_name }-{ feature info }-{ button_text }-{ action }
//
// Here every definition is a key in this registry, and the element that
// triggers it carries data-piwik="<key>" in the JSX. The toolbar's Events
// mode draws the registry over the live UI (src/proto/EventLayer.jsx) and
// logs events as they fire, so a developer reads the spec off the working
// interaction instead of a sticky note.
//
// `on` is the trigger: "click" fires when the element is clicked, "view"
// fires when the element appears — a success state is an appearance, not a
// click, and a funnel that ends "one way or another" has to end on the
// outcome, not on any one button.
//
// A funnel is a task with a clear start and end. Several events may carry
// the same funnel start (any of them begins the task); the end is reached
// however the user gets there.

export const PIWIK_FUNNELS = {
  create_custom_question: {
    label: "Create custom question",
    desc: "From the create button to the question landing in the questionnaire, whether the check passes clean or the user confirms past similar questions",
  },
  add_questions: {
    label: "Add questions",
    desc: "From opening Select questions (from the toolbar or from a topic) to confirming the selection",
  },
};

export const PIWIK_EVENTS = {
  // ---- Funnel: add questions --------------------------------------------
  "builder.add-questions": {
    label: "Add questions",
    category: "survey_creation",
    action: "questionnaire-questions-add_questions-click",
    on: "click",
    funnel: { id: "add_questions", role: "start" },
  },
  "builder.add-questions-topic": {
    label: "Add questions to this topic",
    category: "survey_creation",
    action: "questionnaire-topics-add_questions_to_this_topic-click",
    on: "click",
    funnel: { id: "add_questions", role: "start" },
  },
  "eq.confirm": {
    label: "Confirm selected questions",
    category: "survey_creation",
    action: "questionnaire-select_questions-confirm-click",
    on: "click",
    funnel: { id: "add_questions", role: "end" },
  },

  // ---- Funnel: create custom question ------------------------------------
  "eq.add-custom": {
    label: "Add custom question",
    category: "survey_creation",
    action: "questionnaire-custom_question-add_custom_question-click",
    on: "click",
    funnel: { id: "create_custom_question", role: "start" },
  },
  "cq.check": {
    label: "Check question",
    category: "survey_creation",
    action: "questionnaire-custom_question-check_question-click",
    on: "click",
  },
  "cq.confirm-add": {
    label: "Confirm and add",
    category: "survey_creation",
    action: "questionnaire-custom_question-confirm_and_add-click",
    on: "click",
  },
  "cq.added": {
    label: "Question added",
    category: "survey_creation",
    action: "questionnaire-custom_question-question_added-view",
    on: "view",
    funnel: { id: "create_custom_question", role: "end" },
  },

  // ---- Standalone events --------------------------------------------------
  "builder.save-close": {
    label: "Save and close",
    category: "survey_creation",
    action: "questionnaire-builder-save_and_close-click",
    on: "click",
  },
  "builder.next": {
    label: "Next step",
    category: "survey_creation",
    action: "questionnaire-builder-next_step-click",
    on: "click",
  },
};
