// edgecases.js — the prototype's edge-case switches.
//
// Real accounts differ: not every survey has org-required questions, not every
// standard question has approved alternative wordings, and the theme soft-lock
// is a behaviour we're still deciding on. Rather than hard-coding one variant,
// the prototype toolbar can flip each of these so a use case can be shown both
// ways in a review.
//
// Defaults match the "normal" account the rest of the prototype assumes.
export const EDGE_CASES = [
  {
    key: "required",
    label: "Org-required questions",
    desc: "Some questions are set as required and can't be removed. Not every account has them.",
    on: true,
  },
  {
    key: "variants",
    label: "Alternative wordings",
    desc: "Standard questions offer Effectory-approved alternatives. Off = wording is fully locked.",
    on: true,
  },
  {
    key: "softlock",
    label: "Theme soft-lock",
    desc: "Removing the last question of a complete theme asks first, to keep its score intact.",
    on: true,
  },
];

export const defaultEdges = () => EDGE_CASES.reduce((a, e) => ({ ...a, [e.key]: e.on }), {});
