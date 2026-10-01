// semantic.js — "is this question already in the library?", by meaning.
// A small English sentence-embedding model (all-MiniLM-L6-v2, ~23 MB, fetched
// once from the Hugging Face CDN and cached by the browser) runs in the page
// through Transformers.js: every question becomes a vector, and the draft is
// compared to the library by cosine similarity. No backend, no key.
//
// The word-overlap check in similar.js stays as the fallback (while the model
// loads, or offline) and as a small nudge: a question it also finds ranks a
// little higher (+0.05) — enough for a literal overlap ("place to work"), not
// enough to lift a question that merely shares a word ("team").
//
// The model reads topic, not direction: "I hate my job" sits close to "I like
// my work". A negative wording and a positive one are never offered as the
// same question.
import { isNegative } from "./questionCheck.js";

let extractorP = null;
const vecs = new Map(); // question text -> embedding

// Start loading the model early (the dialog calls this when it opens), so the
// first check doesn't wait on the download.
export function warmUpSemantic() {
  if (!extractorP) {
    extractorP = import("@huggingface/transformers")
      .then(({ pipeline, env }) => { env.allowLocalModels = false; return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2"); })
      .catch((e) => { extractorP = null; throw e; });
  }
  return extractorP;
}

async function embed(texts) {
  const ex = await warmUpSemantic();
  const out = await ex(texts, { pooling: "mean", normalize: true });
  return out.tolist();
}

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

// Similar questions by meaning. Thresholds were set against the library: real
// rewordings score 0.70+ ("My manager gives me the support I need" ~ "I get
// the support I need from my manager": 0.91), questions that only share a
// subject 0.55–0.62 — so 0.65 is the line. Staying within 0.1 of the best
// keeps a strong match from dragging weak ones along. Open questions are
// only offered for an open draft — they rank high on topic, not on wording.
export async function semanticSimilar(text, pool, { limit = 3, always = false, draftType, boost = [] } = {}) {
  const seen = new Set();
  const neg = isNegative(text);
  const cands = pool.filter(q => {
    if (!q.text || q.dupOf || isNegative(q.text) !== neg) return false;
    const k = q.text.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return draftType === "text" || q.type !== "text";
  });
  const missing = cands.filter(q => !vecs.has(q.text));
  if (missing.length) {
    const V = await embed(missing.map(q => q.text));
    missing.forEach((q, i) => vecs.set(q.text, V[i]));
  }
  const [e] = await embed([text]);
  const boosted = new Set(boost.map(q => q.text.trim().toLowerCase()));
  const scored = cands
    .map(q => ({ q, s: dot(vecs.get(q.text), e) + (boosted.has(q.text.trim().toLowerCase()) ? 0.05 : 0) }))
    .sort((a, b) => b.s - a.s);
  if (always) return scored.slice(0, limit).map(x => x.q);
  const best = scored.length ? scored[0].s : 0;
  return scored.filter(x => x.s >= 0.65 && x.s >= best - 0.1).slice(0, limit).map(x => x.q);
}
