// logic.js — question logic (conditional visibility / masking).
//
// A question's rule lives in qMeta[id].logic:
//   { match: "all" | "any", conditions: [
//       { type: "answer",    trigger: <qId>, answers: [<index>…] },
//       { type: "attribute", attribute: <key>, values: [<index>…] } ] }
// An answer condition points BACKWARDS only — its trigger must be an earlier
// question in the questionnaire (a participant answers it first). An
// attribute condition reads the employee data (characteristics.js). Within a
// condition the chosen answers/values are OR; across conditions `match`
// decides all/any. One rule per question.
import { answerOptionsOf } from "./data.js";
import { characteristicOf } from "./characteristics.js";

// `earlier` = the questions BEFORE the rule's own question, in questionnaire
// order — the only valid triggers. A condition whose trigger left the survey
// or moved below the question is simply not OK (dormant), never an error the
// participant could hit.
export const conditionOK = (c, earlier) => {
  if (!c) return false;
  if (c.type === "answer") {
    const t = (earlier || []).find(x => x.id === c.trigger);
    return !!t && (c.answers || []).length > 0;
  }
  return !!characteristicOf(c.attribute) && (c.values || []).length > 0;
};

export const conditionPhrase = (c, earlier) => {
  if (c.type === "answer") {
    const t = (earlier || []).find(x => x.id === c.trigger);
    if (!t) return null;
    const opts = answerOptionsOf(t);
    const picked = (c.answers || []).map(i => opts[i]).filter(Boolean);
    return picked.length ? `“${t.text}” is ${picked.join(" or ")}` : null;
  }
  const a = characteristicOf(c.attribute);
  if (!a) return null;
  const picked = (c.values || []).map(i => a.values[i]).filter(Boolean);
  return picked.length ? `${a.label.toLowerCase()} is ${picked.join(" or ")}` : null;
};

// One readable sentence for the summary row and the builder tag's tooltip.
export const logicSummary = (logic, earlier) => {
  const phrases = (logic && logic.conditions ? logic.conditions : [])
    .map(c => conditionPhrase(c, earlier)).filter(Boolean);
  if (!phrases.length) return "";
  if (phrases.length === 1) return `Only when ${phrases[0]}`;
  const lead = logic.match === "any" ? "When one matches:"
    : phrases.length === 2 ? "When both match:" : "When all match:";
  return `${lead} ${phrases.join("; ")}`;
};

export const activeConditions = (logic, earlier) =>
  (logic && logic.conditions ? logic.conditions : []).filter(c => conditionOK(c, earlier));
