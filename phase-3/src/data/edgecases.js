// edgecases.js — the prototype's edge-case switches.
//
// Real accounts differ. This is only for genuine ACCOUNT differences — things
// that are simply absent for some customers — not for product behaviour we've
// decided on. Approved alternative wordings and the theme soft-lock are real,
// necessary behaviour and deliberately NOT switchable here.
//
// Defaults match the "normal" account the rest of the prototype assumes.
export const EDGE_CASES = [
  {
    key: "altWordings",
    label: "Alternative wordings for every question",
    desc: "How many library questions carry approved alternative wordings differs per library. Turn this on to get alternatives on every question.",
    on: false,
  },
  {
    key: "similarAlways",
    label: "Similar questions on every check",
    desc: "Whether a new custom question looks like anything in the library depends on the draft. Turn this on to always reach the pick-a-question step.",
    on: false,
  },
  {
    key: "orgCustoms",
    label: "Custom questions elsewhere in the org",
    desc: "Colleagues have written custom questions in other surveys, ready to reuse. A first survey in a fresh account has none.",
    on: true,
  },
  {
    key: "required",
    label: "Org-required questions",
    desc: "Some questions are set as required and can't be removed. Not every account has them.",
    on: true,
  },
];

export const defaultEdges = () => EDGE_CASES.reduce((a, e) => ({ ...a, [e.key]: e.on }), {});
