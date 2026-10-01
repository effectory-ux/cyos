// variants.js — Effectory-approved ALTERNATIVE WORDINGS for standard questions.
// Picking one keeps the benchmark valid: the construct measured stays the same,
// only the phrasing changes (all variants are curated and pre-translated by
// Effectory — they never create translation work for the user).
//
// Keyed by the question's canonical (library) text. Questions without an entry
// simply don't offer "Change question" in their settings pane.

export const VARIANTS = {
  "Day to day, I find my work enjoyable": [
    "I enjoy the work I do most days",
    "My day-to-day work is something I enjoy",
    "Overall, I find pleasure in my daily work",
  ],
  "I'm kitted out with the tools and systems my job calls for": [
    "I have the tools and systems I need to do my job",
    "The equipment and systems I work with fit my job's needs",
  ],
  "The information I rely on is easy to track down": [
    "I can easily find the information I need for my work",
    "The information my job depends on is easy to access",
  ],
  "What I'm asked to do plays to what I'm good at": [
    "My tasks make good use of my strengths",
    "The work I'm given fits my skills well",
  ],
  "It's clear to me what I'm meant to deliver": [
    "I know exactly what results are expected of me",
    "What I need to deliver in my role is clear",
  ],
  "My job and personal life sit in healthy balance": [
    "I have a healthy balance between work and personal life",
    "My work leaves enough room for my personal life",
  ],
  "My work leaves me energised": [
    "I get energy from the work I do",
    "After a day's work I still feel energised",
  ],
  "I trust my manager's judgement": [
    "I have confidence in the decisions my manager makes",
    "My manager's judgement is something I can rely on",
  ],
  "Being part of this organisation makes me proud": [
    "I'm proud to be part of this organisation",
    "I feel proud when I tell others where I work",
  ],
  "Would you point a friend towards us as a place to work?": [
    "How likely are you to recommend us to a friend as a place to work?",
    "Would you recommend working here to people you know?",
  ],
};

// A library's alternative wordings are curated per question, so how MANY
// questions have them differs per library. `all` adds plausible rewrites to
// EVERY question, so the flow can be tested anywhere: it fills the gap on
// questions with no curated list and extends the ones that have it — a switch
// that only changed the empty cases would look dead on the questions a tester
// opens first, which all happen to be curated.
export function variantsOf(text, all = false, type = "scale5") {
  const curated = VARIANTS[text] || [];
  if (!all || !text) return curated;
  const t = text.replace(/\.$/, "");
  const lower = t.charAt(0).toLowerCase() + t.slice(1);
  // An agree-scale frame only makes sense on a statement; an open or
  // multiple-choice question needs a frame that doesn't imply a scale.
  const made = type === "scale5"
    ? [`To what extent do you agree: ${lower}`, `In my experience, ${lower}`]
    : [`In your view, ${lower}`, `From your experience, ${lower}`];
  return [...curated, ...made.filter(v => !curated.includes(v))];
}

// Effectory-approved DESCRIPTION alternatives, same mechanics as question
// variants: for now a description is chosen from a curated list (free editing
// may come later). Questions without a curated list fall back to the generic
// clarifications below.
export const DESC_VARIANTS = {
  "Day to day, I find my work enjoyable": [
    "Reflect on the parts of your job that bring you satisfaction or joy.",
    "Think about your work in general, not one exceptional day.",
  ],
  "I'm kitted out with the tools and systems my job calls for": [
    "Think of the equipment, software, and systems you use in your daily work.",
    "Consider whether missing tools slow you down in a normal week.",
  ],
  "My job and personal life sit in healthy balance": [
    "Consider the past few months, including busy periods.",
    "Think about how often work spills into your personal time.",
  ],
  "Would you point a friend towards us as a place to work?": [
    "Imagine a friend with skills similar to yours is looking for a job.",
    "Think about whether you would speak positively about working here.",
  ],
};

const GENERIC_DESCS = [
  "Think about your experience over the past few months.",
  "Consider your day-to-day situation, not one specific moment.",
];

export function descVariantsOf(text) {
  return DESC_VARIANTS[text] || GENERIC_DESCS;
}
