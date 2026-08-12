// i18n.js — survey languages + a small fake "machine translation" for the
// prototype. Only USER-AUTHORED text is ever translated here (topic renames,
// descriptions, custom questions, custom answer options): standard library
// content ships pre-translated by Effectory and never appears in this flow.
//
// The fake translator does a word-level dictionary pass so results read as
// plausibly machine-translated (which is exactly the story the UI tells) —
// untranslated words pass through unchanged.

// `country` + `flag` feed the custom-question dialog's language list; the flag
// files are the DS country marks exported from the design library.
export const LANGUAGES = [
  { code: "en", label: "English", country: "United Kingdom", flag: "gb.svg", primary: true },
  { code: "nl", label: "Dutch", country: "The Netherlands", flag: "nl.svg" },
  { code: "de", label: "German", country: "Germany", flag: "de.svg" },
];

export const PRIMARY_LANGUAGE = LANGUAGES.find(l => l.primary);
export const OTHER_LANGUAGES = LANGUAGES.filter(l => !l.primary);
export const flagSrc = (flag) => `assets/flags/${flag}`;

// ---- answer scale ----------------------------------------------------------
// The labels respondents actually see. Unlike user-authored text these are
// FIXED product strings, so they're real translations — never machine ones.
const EN_SCALE = {
  points: ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"],
  dontKnow: "I don’t know",
  open: "Share your thoughts…",
};
export const ANSWER_SCALE = {
  en: EN_SCALE,
  nl: {
    points: ["Helemaal oneens", "Oneens", "Niet eens, niet oneens", "Eens", "Helemaal eens"],
    dontKnow: "Weet ik niet", open: "Deel hier je gedachten…",
  },
  de: {
    points: ["Stimme überhaupt nicht zu", "Stimme nicht zu", "Weder noch", "Stimme zu", "Stimme voll und ganz zu"],
    dontKnow: "Weiß ich nicht", open: "Teilen Sie Ihre Gedanken…",
  },
};
export const scaleFor = (code) => ANSWER_SCALE[code] || EN_SCALE;

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

// Everyday words the topic-flavoured tables above don't carry. Merged UNDER
// DICT, so the survey-specific wording keeps precedence; this just stops
// ordinary sentences coming back half in English.
const COMMON = {
  nl: { me: "mij", us: "ons", them: "hen", can: "kan", could: "kon", will: "zal", would: "zou", should: "zou moeten", must: "moet", may: "mag", am: "ben", was: "was", were: "waren", be: "zijn", been: "geweest", has: "heeft", had: "had", does: "doet", did: "deed", know: "weet", need: "nodig", needed: "nodig", want: "wil", give: "geeft", make: "maakt", take: "neemt", use: "gebruikt", see: "ziet", find: "vindt", think: "denkt", say: "zegt", tell: "vertelt", listen: "luistert", trust: "vertrouwt", treat: "behandelt", share: "deelt", learn: "leert", provide: "biedt", allow: "staat toe", expect: "verwacht", understand: "begrijpt", respect: "respecteert", help: "hulp", colleagues: "collega's", colleague: "collega", everyone: "iedereen", everything: "alles", someone: "iemand", nobody: "niemand", clear: "duidelijk", easy: "makkelijk", hard: "moeilijk", fair: "eerlijk", safe: "veilig", happy: "tevreden", proud: "trots", because: "omdat", but: "maar", not: "niet", very: "heel", when: "wanneer", where: "waar", why: "waarom", their: "hun", there: "er", that: "dat", it: "het", information: "informatie", resources: "middelen", training: "training", meeting: "overleg", meetings: "overleggen", change: "verandering", changes: "veranderingen", result: "resultaat", results: "resultaten" },
  de: { me: "mich", us: "uns", them: "sie", can: "kann", could: "konnte", will: "wird", would: "würde", should: "sollte", must: "muss", may: "darf", am: "bin", was: "war", were: "waren", be: "sein", been: "gewesen", has: "hat", had: "hatte", does: "macht", did: "machte", know: "weiß", need: "brauche", needed: "benötigt", want: "will", give: "gibt", make: "macht", take: "nimmt", use: "nutzt", see: "sieht", find: "findet", think: "denkt", say: "sagt", tell: "erzählt", listen: "hört zu", trust: "vertraut", treat: "behandelt", share: "teilt", learn: "lernt", provide: "bietet", allow: "erlaubt", expect: "erwartet", understand: "versteht", respect: "respektiert", help: "Hilfe", colleagues: "Kollegen", colleague: "Kollege", everyone: "alle", everything: "alles", someone: "jemand", nobody: "niemand", clear: "klar", easy: "einfach", hard: "schwierig", fair: "fair", safe: "sicher", happy: "zufrieden", proud: "stolz", because: "weil", but: "aber", not: "nicht", very: "sehr", when: "wenn", where: "wo", why: "warum", their: "ihre", there: "dort", that: "dass", it: "es", information: "Informationen", resources: "Ressourcen", training: "Schulung", meeting: "Besprechung", meetings: "Besprechungen", change: "Veränderung", changes: "Veränderungen", result: "Ergebnis", results: "Ergebnisse" },
};
Object.keys(COMMON).forEach(code => { DICT[code] = { ...COMMON[code], ...DICT[code] }; });

// Whole statements we can translate properly, so the common demo phrases don't
// come back as word salad. Matched on a normalised form of the source.
const PHRASES = {
  "i have the tools i need to do my job well": {
    nl: "Ik heb de middelen die ik nodig heb om mijn werk goed te doen",
    de: "Ich habe die Mittel, die ich brauche, um meine Arbeit gut zu machen",
  },
  "i know what is expected of me at work": {
    nl: "Ik weet wat er op mijn werk van mij wordt verwacht",
    de: "Ich weiß, was bei der Arbeit von mir erwartet wird",
  },
  "i feel supported by my manager": {
    nl: "Ik voel me gesteund door mijn leidinggevende",
    de: "Ich fühle mich von meiner Führungskraft unterstützt",
  },
};
const norm = (s) => s.toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ").trim();

// Word-level pass keeping punctuation and capitalisation of sentence starts.
export function fakeTranslate(text, lang) {
  const dict = DICT[lang];
  if (!dict || !text) return text || "";
  const seeded = PHRASES[norm(text)];
  if (seeded && seeded[lang]) return seeded[lang];
  const out = text.split(/(\s+)/).map(tok => {
    if (/^\s+$/.test(tok)) return tok;
    const m = tok.match(/^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/);
    if (!m) return tok;
    const [, pre, word, post] = m;
    const lower = word.toLowerCase();
    // Exact match first, then the "-s" stem so plurals and third-person verbs hit.
    const hit = dict[lower] ?? (lower.endsWith("s") ? dict[lower.slice(0, -1)] : undefined);
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
