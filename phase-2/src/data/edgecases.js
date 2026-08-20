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
    key: "required",
    label: "Org-required questions",
    desc: "Some questions are set as required and can't be removed. Not every account has them.",
    on: true,
  },
];

export const defaultEdges = () => EDGE_CASES.reduce((a, e) => ({ ...a, [e.key]: e.on }), {});
