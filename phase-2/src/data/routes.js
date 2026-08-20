// routes.js — every step of the prototype gets a URL, written in the platform's
// own shape so a link reads like the real product:
//
//   /projects/31092/survey-list
//   /projects/31092/survey-list(dialog:create-draft-survey)
//   /surveys/s3/questionnaire
//   /surveys/s3/questionnaire(dialog:select-questions)
//   /surveys/s3/questionnaire(dialog:question-settings/q2)
//
// Production uses real paths; a static prototype on GitHub Pages has no server
// rewrites, so the path lives in the hash (`#/surveys/s3/questionnaire(...)`).
// Everything after `#` is byte-identical to the platform path, which is the part
// that matters when sharing a link in a review.

export const PROJECT_ID = "31092"; // fixed in the prototype, mirrors the platform shape

// A route is { screen, surveyId?, dialog?, arg? }.
export function serialize(route) {
  const { screen, surveyId, dialog, arg } = route || {};
  const base = screen === "builder" && surveyId
    ? `/surveys/${surveyId}/questionnaire`
    : `/projects/${PROJECT_ID}/survey-list`;
  const suffix = dialog ? `(dialog:${dialog}${arg ? "/" + arg : ""})` : "";
  return "#" + base + suffix;
}

export function parse(hash) {
  const raw = (hash || "").replace(/^#/, "");
  if (!raw) return null;
  const m = raw.match(/^(.*?)(?:\(dialog:([^/)]+)(?:\/([^)]*))?\))?$/);
  if (!m) return null;
  const [, path, dialog, arg] = m;
  const survey = path.match(/^\/surveys\/([^/]+)\/questionnaire\/?$/);
  return {
    screen: survey ? "builder" : "surveys",
    surveyId: survey ? survey[1] : undefined,
    dialog: dialog || undefined,
    arg: arg || undefined,
  };
}

// Replace the hash without adding a history entry (state changes are not
// separate "pages"); `push` is used when the user genuinely navigated.
export function writeRoute(route, push = false) {
  const next = serialize(route);
  if (next === window.location.hash) return;
  if (push) window.location.hash = next;
  else window.history.replaceState(null, "", next);
}
