// suggestions.js — the guidance shown in the Suggestions panel.
//
// Two rules keep this useful rather than noisy:
//   1. Only surface what is CLOSE ENOUGH TO ACT ON. A theme that needs one more
//      question is worth a row; one that needs six is not — it trains people to
//      ignore the badge.
//   2. Rank by results gained per click, so the cheapest real improvement is
//      always first.
// Nothing here ever blocks: validation belongs on the action itself.

const NEARLY_DONE = 2; // a theme this close to complete is worth mentioning

export function buildSuggestions({ themeGroups = [], pool = [], selectedIds = [], minutes = 0 }) {
  const sel = new Set(selectedIds);
  const out = [];

  // 1. Themes one or two questions from a composite score — the biggest gain
  //    for the smallest action, so they lead.
  themeGroups
    .filter(t => t.kept > 0 && t.kept < t.total && t.total - t.kept <= NEARLY_DONE)
    .sort((a, b) => (a.total - a.kept) - (b.total - b.kept))
    .forEach(t => {
      const missing = t.total - t.kept;
      out.push({
        id: "theme:" + t.name,
        kind: "theme",
        theme: t.name,
        title: `${t.name} is ${missing} ${missing === 1 ? "question" : "questions"} from a theme score`,
        why: "A theme only gets a score in the results when all of its questions are in",
        action: missing === 1 ? "Add the question" : "Add the questions",
      });
    });

  // 2. Custom questions carry no benchmark. Not a problem, but worth knowing
  //    before the results come back.
  const customCount = pool.filter(q => q.custom && sel.has(q.id)).length;
  if (customCount > 0) {
    out.push({
      id: "custom",
      kind: "custom",
      title: `${customCount} custom ${customCount === 1 ? "question has" : "questions have"} no benchmark`,
      why: "Their results can't be compared with other organizations.",
      action: "View them",
    });
  }

  // 3. Length. Information only — there is no single question to fix.
  if (minutes >= 15) {
    out.push({
      id: "length",
      kind: "length",
      title: `${minutes} minutes may be long for one survey`,
      why: "Shorter surveys usually get a better response rate.",
    });
  }

  return out;
}
