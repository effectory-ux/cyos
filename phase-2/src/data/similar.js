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

const stem = (w) => w.replace(/(ing|ed|s)$/, "");

function tokenize(text) {
  const out = new Set();
  (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).forEach((w) => {
    if (w.length > 2 && !STOP.has(w)) out.add(stem(w));
  });
  return out;
}

// Top matches from `pool` for the draft `text`. Benchmarked questions get a
// small nudge so, at equal similarity, the comparable one leads.
export function similarQuestions(text, pool = [], { limit = 3, excludeId } = {}) {
  const toks = tokenize(text);
  if (toks.size < 2) return [];
  const scored = [];
  for (const q of pool) {
    if (!q.text || q.id === excludeId) continue;
    const qt = tokenize(q.text);
    if (!qt.size) continue;
    let inter = 0;
    toks.forEach((t) => { if (qt.has(t)) inter += 1; });
    const overlap = inter / Math.min(toks.size, qt.size);
    if (inter >= 2 && overlap >= 0.5) scored.push({ q, score: overlap + (q.bench ? 0.05 : 0) });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.q);
}
