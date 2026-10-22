// logic.js — conditional logic (who gets a question).
//
// A question's rule lives in qMeta[id].logic, deliberately small (Jamal:
// "nothing more, nothing less"): at most ONE condition of each kind —
//   { conditions: [
//       { type: "answer",    trigger: <qId>, op: "is"|"not", answers: [<index>…] },
//       { type: "attribute", attribute: <key>, op: "is"|"not", values: [<index>…] } ] }
// An answer condition points BACKWARDS only — its trigger must be an earlier
// question in the questionnaire (a participant answers it first). An
// attribute condition reads the employee data (characteristics.js). Within a
// condition the chosen answers/values are OR ("is" any of them, or "is not"
// any of them); when both conditions exist, both must hold. One rule per
// question.
import { answerOptionsOf } from "./data.js";
import { characteristicOf } from "./characteristics.js";

export const conditionOfType = (logic, type) =>
  ((logic && logic.conditions) || []).find(c => c && c.type === type) || null;

// BROKEN is different from incomplete: the creator finished the condition,
// but the survey changed under it — its trigger question was removed or now
// comes after the question. Still dormant for participants, but the creator
// gets a guardrail: red tag/badge plus an always-on error in the pane.
export const conditionBroken = (c, earlier) => {
  if (!c) return false;
  if (c.type === "answer") return !!c.trigger && !(earlier || []).some(x => x.id === c.trigger);
  return !!c.attribute && !characteristicOf(c.attribute);
};

export const logicBroken = (logic, earlier) =>
  (logic && logic.conditions ? logic.conditions : []).some(c => conditionBroken(c, earlier));

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
  const opWord = c.op === "not" ? "is not" : "is";
  if (c.type === "answer") {
    const t = (earlier || []).find(x => x.id === c.trigger);
    if (!t) return null;
    const opts = answerOptionsOf(t);
    const picked = (c.answers || []).map(i => opts[i]).filter(Boolean);
    return picked.length ? `“${t.text}” ${opWord} ${picked.join(" or ")}` : null;
  }
  const a = characteristicOf(c.attribute);
  if (!a) return null;
  const picked = (c.values || []).map(i => a.values[i]).filter(Boolean);
  return picked.length ? `${a.label.toLowerCase()} ${opWord} ${picked.join(" or ")}` : null;
};

// One readable sentence for the Who-gets-it tooltip and the builder tag.
export const logicSummary = (logic, earlier) => {
  const phrases = (logic && logic.conditions ? logic.conditions : [])
    .map(c => conditionPhrase(c, earlier)).filter(Boolean);
  if (!phrases.length) return "";
  if (phrases.length === 1) return `Only when ${phrases[0]}`;
  return `When both match: ${phrases.join("; ")}`;
};

export const activeConditions = (logic, earlier) =>
  (logic && logic.conditions ? logic.conditions : []).filter(c => conditionOK(c, earlier));
