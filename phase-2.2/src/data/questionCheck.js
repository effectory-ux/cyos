// questionCheck.js — the writing rules a custom question is checked against
// while it's written, after Effectory's guide "How to create effective custom
// questions" (GUIDE_URL): a statement (for the agreement scale), one idea,
// positive wording, the right scale — and, only when they're broken, no
// GDPR-restricted data, no jargon, no leading or self-assessment questions.
// Plain English heuristics, no model: they only have to catch the common traps.
// Whether it already exists is the similarity check's job (semantic.js).
//
// checkQuestion(text, type) → { ready, rules, fails, warns, rewrite }
//   ready    enough words to judge — until then every rule stays idle
//   rules    [{ key, label, status: "pass" | "fail" | "warn" | "idle", hint, hl }]
//            hl: a word in the hint to show bold ("support and tools")
//   rewrite  a suggested wording that passes, when one can be made

const ASKS = /^(do|does|did|don['’]t|doesn['’]t|didn['’]t|are|aren['’]t|is|isn['’]t|was|were|am|can|could|would|will|should|shall|have|has|had|may|might|how|what|why|when|where|which|who|whom|whose|to what extent)\b/i;
const YES_NO = /^(do|does|did|don['’]t|doesn['’]t|are|aren['’]t|is|isn['’]t|was|were|am|can|could|would|will|should|have|has|had)\b/i;
// Negation, and plainly negative words — "I hate…" is as hard to agree with
// cleanly as "I don't…". ANTONYM turns the common ones around for a rewrite.
const NEGATIVE = /\b\w+n['’]t\b|\b(not|no|never|nobody|nothing|none|neither|nor|hardly|barely|lack|lacks|unable|cannot|hate|hates|dislike|dislikes|bad|worse|worst|poor|poorly|terrible|awful|horrible|unhappy|unfair|unclear|unsafe|frustrat\w*|annoy\w*|difficult|problem\w*|fail\w*|boring|useless|toxic)\b/i;
const ANTONYM = { hate: "like", hates: "likes", dislike: "like", dislikes: "likes", bad: "good", worse: "better", worst: "best", poor: "good",
  poorly: "well", terrible: "great", awful: "great", horrible: "great", unhappy: "happy", unfair: "fair", unclear: "clear", unsafe: "safe",
  difficult: "easy", boring: "interesting", useless: "useful" };
// Whether a wording is negative (a negation or a negative word). Two questions
// that point opposite ways are never the same question, however close in topic.
export const isNegative = (text) => NEGATIVE.test(text || "") || NEEDS_FIX.test(text || "");
const OTHER_SCALE = /^(how (often|much|many|satisfied|likely|well|long|would you rate)|to what extent|rate\b|on a scale)/i;
const JOINS = /\s(and|or)\s/i;
const FILLER = new Set(["a", "an", "the", "my", "our", "your", "their", "his", "her", "its", "good", "enough", "clear", "more"]);

export const GUIDE_URL = "https://support.effectory.com/hc/en-us/articles/26444837226909-how-to-create-effective-custom-questions";

// GDPR: data that can't be processed without an exemption. The guide's own
// line: workload is fine to ask about, the stress or illness it causes isn't.
const SENSITIVE = [
  [/\b(health|illness|ill|sick(ness)?|disease|medical|medication|burn-?out|stress(ed)?|anxiety|depress(ed|ion)|mental health|disabilit(y|ies)|pregnan(t|cy))\b/i, "health", "ask about workload or support instead"],
  [/\b(race|racial|ethnic(ity)?|nationality|country of birth|ancestry|skin colou?r)\b/i, "ethnic origin", "leave it out of the survey"],
  [/\b(sexual|sexuality|gay|lesbian|bisexual|transgender|lgbt\w*)\b/i, "sexual orientation", "leave it out of the survey"],
  [/\b(political|politics|vote|voted|voting)\b/i, "political views", "leave it out of the survey"],
  [/\b(religio(n|us)|faith|church|mosque|synagogue|pray(er)?)\b/i, "religious beliefs", "leave it out of the survey"],
  [/\b(trade union|union member(ship)?)\b/i, "trade union membership", "leave it out of the survey"],
  [/\b(criminal|convict(ed|ion)?|arrested|offen[cs]e)\b/i, "criminal records", "ask about experiences at work instead"],
];
// Jargon and abbreviations, with the plain word the guide would use.
const JARGON = { kpi: "goals", kpis: "goals", okr: "objectives", okrs: "objectives", roi: "results", synergy: "working together", synergies: "working together", "sustainable employability": "staying healthy and skilled at work", culture: "the way we work together" };
const JARGON_RX = /\b(kpis?|okrs?|roi|synerg(y|ies)|sustainable employability|culture)\b/i;
const NEEDS_FIX = /\b(needs? to improve|needs? improvement|should (be )?improv\w*|could be better|falls? short)\b/i;
const LEADING = /\b(problems?|issues?|complaints?|frustrations?|wrong)\b/i;
const SELF = /^I\s+(contribute|perform|deliver|work hard|do (a )?good|am (a )?(good|great|productive|hard-working|valuable|high performer))/i;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const bare = (w) => (w || "").replace(/[^\w'’-]/g, "");
const isQuestion = (t) => /\?\s*$/.test(t) || ASKS.test(t);

// "give" → "gives", after "my manager" / "the team".
function thirdPerson(rest) {
  const [v, ...more] = rest.split(/\s+/);
  const irregular = { have: "has", do: "does", go: "goes", be: "is", are: "is" };
  const w = v.toLowerCase();
  const s = irregular[w] || (/(s|sh|ch|x|z|o)$/.test(w) ? w + "es" : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + "s");
  return [s, ...more].join(" ");
}
const toMe = (s) => s.replace(/\byourself\b/gi, "myself").replace(/\byour\b/gi, "my").replace(/\byou\b/gi, "me");

// A rewrite for the usual shapes: a question turned into a statement, a
// negation turned around, and two ideas cut back to the first. Only offered
// when the result passes the rules itself.
function rewriteOf(text) {
  let s = text.trim().replace(/[?.!]+$/, "").trim();
  let m;
  // Questions → statements.
  if ((m = s.match(/^(?:do|does|did|don['’]t|doesn['’]t|didn['’]t)\s+you\s+(.+)$/i))) s = "I " + toMe(m[1]);
  else if ((m = s.match(/^(?:do|does|did|don['’]t|doesn['’]t|didn['’]t)\s+(your|the|my)\s+(\w+)\s+(.+)$/i))) s = `${m[1].toLowerCase() === "the" ? "The" : "My"} ${m[2]} ${thirdPerson(toMe(m[3]))}`;
  else if ((m = s.match(/^(?:do|don['’]t|did|didn['’]t)\s+(\w+s)\s+(.+)$/i))) s = `${cap(m[1])} ${toMe(m[2])}`;
  else if ((m = s.match(/^(?:are|aren['’]t)\s+you\s+(.+)$/i))) s = "I am " + toMe(m[1]);
  else if ((m = s.match(/^(?:is|isn['’]t)\s+(your|the|my)\s+(\w+)\s+(.+)$/i))) s = `${m[1].toLowerCase() === "the" ? "The" : "My"} ${m[2]} is ${toMe(m[3])}`;
  else if (isQuestion(s)) return null;
  // Negations turned around — "needs to improve" the guide's way.
  s = s.replace(/\bneeds to improve\b/i, "is improving").replace(/\bneed to improve\b/i, "are improving").replace(/\b(I|we|they|you)\s+(?:don['’]t|do not)\s+/i, "$1 ")
    .replace(/\b(\w+)\s+(?:doesn['’]t|does not)\s+(\w+)/i, (_, subj, v) => `${subj} ${thirdPerson(v)}`)
    .replace(/\b(am|is|are)\s+not\s+/i, "$1 ")
    .replace(/\b\w+\b/g, w => { const a = ANTONYM[w.toLowerCase()]; return a ? (w[0] === w[0].toUpperCase() ? cap(a) : a) : w; })
    .replace(/\b(\w+)n['’]t\b/i, "$1");
  // Two ideas → the first, when that still reads as a question on its own.
  const j = s.match(JOINS);
  if (j) { const first = s.slice(0, j.index).trim(); if (first.split(/\s+/).length >= 4) s = first; }
  s = s.replace(/\s+/g, " ").trim();
  if (!s || s.toLowerCase() === text.trim().replace(/[?.!]+$/, "").toLowerCase()) return null;
  s = cap(s);
  return isQuestion(s) || NEGATIVE.test(s) ? null : s;
}

// "support and tools": the word either side of the join, skipping filler.
function joinHint(text) {
  const words = text.replace(/[?.!,]/g, "").split(/\s+/);
  const i = words.findIndex((w, k) => k > 0 && /^(and|or)$/i.test(w));
  if (i < 0) return null;
  const before = bare(words[i - 1]);
  let k = i + 1; while (k < words.length - 1 && FILLER.has(words[k].toLowerCase())) k++;
  return { before, join: words[i].toLowerCase(), after: bare(words[k]) };
}

export function checkQuestion(text, type, { suggest = true } = {}) {
  const t = (text || "").trim();
  const ready = t.split(/\s+/).filter(Boolean).length >= 2;
  const scale = type === "scale5";
  const open = type === "text";
  const rules = [];
  const add = (key, ok, pass, fix, hint, bad = "fail") =>
    rules.push({ key, label: ok || !ready ? pass : fix, status: !ready ? "idle" : ok ? "pass" : bad, hint: ready && !ok ? hint : null });
  // The rarer traps only get a row once they're broken.
  const flag = (key, fix, hint, bad = "warn") => { if (ready) rules.push({ key, label: fix, status: bad, hint }); };

  const neg = t.match(NEGATIVE) || t.match(NEEDS_FIX);
  const join = joinHint(t);
  const joinText = join && `This asks about ${join.before} ${join.join} ${join.after} — consider splitting.`;
  const other = t.match(OTHER_SCALE);
  if (scale) {
    add("statement", !isQuestion(t), "Written as a statement", "Write it as a statement",
      "You've written a question — agreement scales need a statement.");
    add("positive", !neg, "Positive wording", "Use positive wording",
      neg && `"${cap(neg[0])}" makes it negative and harder to interpret.`);
    add("one", !join, "One idea per question", "Keep to one idea", joinText, "warn");
    const yesNo = /^(did|have you|has|were you|was)\b/i.test(t);
    const likely = /^how likely\b/i.test(t);
    add("scale", !other && !yesNo && !likely, "Matches the answer scale", "Match the answer scale",
      yesNo ? "A yes/no question — use single choice with Yes and No."
        : likely ? `"How likely" fits a 0–10 scale better than agree–disagree.`
        : other && `"${cap(other[0])}" asks for a different scale than agree–disagree.`);
    if (SELF.test(t)) flag("self", "Avoid self-assessment", "People rate themselves generously — ask what they see around them: \"People in my team…\".");
  } else if (open) {
    const q = isQuestion(t), yn = YES_NO.test(t);
    add("open", q && !yn, "Asks for an answer in their own words", q ? "Ask an open question" : "Write it as a question",
      q ? "People can answer this with yes or no — ask what, how or why." : "Phrase it as a question people answer in their own words.", "warn");
    add("one", !join, "One idea per question", "Keep to one idea", joinText, "warn");
    add("positive", !neg, "Neutral wording", "Use neutral wording",
      neg && `"${cap(neg[0])}" can steer people towards a negative answer.`, "warn");
    const lead = t.match(LEADING);
    if (lead) flag("leading", "Avoid a leading question", `"${cap(lead[0])}" assumes there is something wrong — ask it openly.`);
  } else {
    add("question", isQuestion(t), "Written as a question", "Write it as a question",
      "People pick from your answers — ask a question they answer.", "warn");
    add("one", !join, "One idea per question", "Keep to one idea", joinText, "warn");
    add("positive", !neg, "Positive wording", "Use positive wording",
      neg && `"${cap(neg[0])}" makes it negative and harder to interpret.`, "warn");
  }
  // For every type: plain words, and nothing GDPR restricts.
  const jar = t.match(JARGON_RX);
  if (jar) flag("jargon", "Keep it simple", `"${jar[0]}" may not mean the same to everyone — try "${JARGON[jar[0].toLowerCase()]}".`);
  const sens = SENSITIVE.find(([rx]) => rx.test(t));
  if (sens) flag("gdpr", "Leave out sensitive personal data", `Questions about ${sens[1]} aren't allowed under GDPR — ${sens[2]}.`, "fail");
  rules.forEach(r => { if (r.key === "one" && join && r.hint) r.hl = join.join; });
  const fails = rules.filter(r => r.status === "fail").length;
  const warns = rules.filter(r => r.status === "warn").length;
  // A rewrite can fix the wording, not the scale: that is the answer type's job.
  const scaleOk = !rules.some(r => r.key === "scale" && r.status === "fail");
  // …and it's only offered when it passes the check itself (GDPR included).
  // Not for a fragment: "I hate" → "I like" helps nobody.
  const whole = t.split(/\s+/).filter(Boolean).length >= 3;
  const rw = suggest && scale && whole && scaleOk && (fails || warns) ? rewriteOf(t) : null;
  const rewrite = rw && checkQuestion(rw, type, { suggest: false }).fails === 0 ? rw : null;
  return { ready, rules, fails, warns, rewrite };
}
