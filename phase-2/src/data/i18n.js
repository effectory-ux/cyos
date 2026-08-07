// i18n.js — survey languages + a small fake "machine translation" for the
// prototype. Only USER-AUTHORED text is ever translated here (topic renames,
// descriptions, custom questions, custom answer options): standard library
// content ships pre-translated by Effectory and never appears in this flow.
//
// The fake translator does a word-level dictionary pass so results read as
// plausibly machine-translated (which is exactly the story the UI tells) —
// untranslated words pass through unchanged.

export const LANGUAGES = [
  { code: "en", label: "English", primary: true },
  { code: "nl", label: "Dutch" },
  { code: "de", label: "German" },
];

const DICT = {
  nl: {
    the: "de", a: "een", an: "een", and: "en", or: "of", of: "van", in: "in",
    to: "om te", for: "voor", with: "met", my: "mijn", our: "onze", your: "je",
    i: "ik", we: "wij", is: "is", are: "zijn", at: "op", on: "op", how: "hoe",
    what: "wat", team: "team", teams: "teams", work: "werk", working: "werken",
    job: "baan", role: "rol", manager: "manager", questions: "vragen",
    question: "vraag", growth: "groei", development: "ontwikkeling",
    learning: "leren", people: "mensen", culture: "cultuur", goals: "doelen",
    feedback: "feedback", support: "steun", tools: "middelen", office: "kantoor",
    remote: "op afstand", satisfaction: "tevredenheid", wellbeing: "welzijn",
    workload: "werkdruk", company: "bedrijf", organisation: "organisatie",
    organization: "organisatie", about: "over", this: "dit", here: "hier",
    do: "doe", you: "je", feel: "voel", get: "krijg", have: "heb", good: "goed",
    well: "goed", new: "nieuw", more: "meer", enough: "genoeg", time: "tijd",
    day: "dag", week: "week", year: "jaar", yes: "ja", no: "nee", never: "nooit",
    often: "vaak", sometimes: "soms", always: "altijd", other: "anders",
    department: "afdeling", location: "locatie", projects: "projecten",
    project: "project", topics: "onderwerpen", topic: "onderwerp",
  },
  de: {
    the: "die", a: "ein", an: "ein", and: "und", or: "oder", of: "von", in: "in",
    to: "zu", for: "für", with: "mit", my: "mein", our: "unser", your: "dein",
    i: "ich", we: "wir", is: "ist", are: "sind", at: "bei", on: "auf", how: "wie",
    what: "was", team: "Team", teams: "Teams", work: "Arbeit", working: "arbeiten",
    job: "Job", role: "Rolle", manager: "Führungskraft", questions: "Fragen",
    question: "Frage", growth: "Wachstum", development: "Entwicklung",
    learning: "Lernen", people: "Menschen", culture: "Kultur", goals: "Ziele",
    feedback: "Feedback", support: "Unterstützung", tools: "Werkzeuge",
    office: "Büro", remote: "remote", satisfaction: "Zufriedenheit",
    wellbeing: "Wohlbefinden", workload: "Arbeitsbelastung", company: "Firma",
    organisation: "Organisation", organization: "Organisation", about: "über",
    this: "dies", here: "hier", do: "mache", you: "du", feel: "fühle",
    get: "bekomme", have: "habe", good: "gut", well: "gut", new: "neu",
    more: "mehr", enough: "genug", time: "Zeit", day: "Tag", week: "Woche",
    year: "Jahr", yes: "ja", no: "nein", never: "nie", often: "oft",
    sometimes: "manchmal", always: "immer", other: "sonstiges",
    department: "Abteilung", location: "Standort", projects: "Projekte",
    project: "Projekt", topics: "Themen", topic: "Thema",
  },
};

// Word-level pass keeping punctuation and capitalisation of sentence starts.
export function fakeTranslate(text, lang) {
  const dict = DICT[lang];
  if (!dict || !text) return text || "";
  const out = text.split(/(\s+)/).map(tok => {
    if (/^\s+$/.test(tok)) return tok;
    const m = tok.match(/^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/);
    if (!m) return tok;
    const [, pre, word, post] = m;
    const hit = dict[word.toLowerCase()];
    if (!hit) return tok;
    const cased = word[0] === word[0].toUpperCase()
      ? hit[0].toUpperCase() + hit.slice(1) : hit;
    return pre + cased + post;
  }).join("");
  return out;
}

// The machine translation shown when the user hasn't reviewed a string yet.
export function autoTranslation(source, lang) {
  return fakeTranslate(source, lang);
}
