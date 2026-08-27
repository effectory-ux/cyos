// similar.js — "is this question already in the library?" check for the
// custom-question dialog. Runs while the user types: a benchmarked match is
// worth surfacing (their results become comparable), and reusing an existing
// custom question keeps big orgs from accumulating near-duplicates.
//
// Prototype-grade similarity: token overlap on content words with a naive
// plural/verb-suffix strip. Real semantic matching is a backend concern — this
// is enough to demo the interaction honestly.

const STOP = new Set([
  "i", "im", "my", "me", "we", "our", "us", "you", "your", "the", "a", "an",
  "to", "of", "in", "on", "at", "and", "or", "for", "with", "is", "are", "am",
  "be", "being", "it", "its", "this", "that", "these", "those", "do", "does",
  "have", "has", "had", "can", "could", "will", "would", "by", "as", "from",
  "here", "there", "day", "find", "feel", "get",
]);

// Suffix stripping, longest ending first, then a trailing "e" so "resources"
// and "resource" land on the same stem. Word FAMILIES have to collapse too —
// "enjoyable" to "enjoy", "working" to "work" — or a rewrite of a library
// question shares no tokens with it and the check finds nothing.
const stem = (w) => w
  .replace(/ies$/, "y")
  .replace(/(es|s)$/, "")
  .replace(/(ations|ation|ment|ness|able|ible|ivity|ity|ive|ful|ing|ed|ly)$/, "")
  .replace(/e$/, "");

// Two stems match when one is a prefix of the other, which catches the pairs
// suffix stripping can't ("manag" / "manager").
const alike = (a, b) =>
  a === b || (a.length >= 4 && b.startsWith(a)) || (b.length >= 4 && a.startsWith(b));

function tokenize(text) {
  const out = new Set();
  (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).forEach((w) => {
    if (w.length > 2 && !STOP.has(w)) out.add(stem(w));
  });
  return out;
}

// Top matches from `pool` for the draft `text`, scored with the Dice
// coefficient (both lengths count, so a long question can't match a two-word
// draft by accident). Benchmarked questions get a small nudge so, at equal
// similarity, the comparable one leads.
//
// `always` is the prototype's testing switch: it returns the nearest questions
// even when nothing clears the bar, so the pick-a-question step is reachable
// from any draft.
export function similarQuestions(text, pool = [], { limit = 3, excludeId, always = false } = {}) {
  const toks = [...tokenize(text)];
  if (toks.length < 2 && !always) return [];
  // Words the library uses everywhere ("work", "team", "make") say almost
  // nothing about similarity; the rare ones ("hybrid", "enjoy", "tools") say
  // nearly everything. Weighting by that keeps two generic words in common
  // from flagging two unrelated questions.
  const df = new Map();
  pool.forEach((q) => tokenize(q.text).forEach(t => df.set(t, (df.get(t) || 0) + 1)));
  const weight = (t) => Math.log((pool.length + 1) / (1 + (df.get(t) || 0)));
  const total = toks.reduce((n, t) => n + weight(t), 0) || 1;

  const scored = [];
  const near = [];
  for (const q of pool) {
    if (!q.text || q.id === excludeId) continue;
    const qt = [...tokenize(q.text)];
    if (!qt.length) continue;
    let inter = 0;
    let hit = 0;
    toks.forEach((t) => { if (qt.some(u => alike(t, u))) { inter += 1; hit += weight(t); } });
    // How much of what makes the draft distinctive is already in this question.
    const cover = hit / total;
    const score = cover + (q.bench ? 0.05 : 0);
    if (inter >= 2 && cover >= 0.4) scored.push({ q, score });
    else near.push({ q, score });
  }
  const top = (list) => list.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.q);
  if (scored.length || !always) return top(scored);
  return top(near);
}
