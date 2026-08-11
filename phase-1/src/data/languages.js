// languages.js — survey languages for the custom-question dialog.
//
// The flag images are the exact assets exported from the DS Figma library
// (assets/flags/*), so the list renders the same marks the design uses.
//
// Translation here is SIMULATED. A prototype has no translation service, so
// `machineTranslate` fakes one: it matches a few seeded statements outright and
// otherwise swaps the most common survey words. The result is deliberately
// rough — it exists to show the auto-translate FLOW (working → done), not to be
// a real translation. Every language always succeeds: a failed translation
// would only strand people in a state they can't edit their way out of.

export const PRIMARY_LANGUAGE =
  { code: "en-GB", name: "English", country: "United Kingdom", flag: "gb.svg" };

// Every other language the survey is offered in. The "Other languages (N)"
// counter reads N straight off this list, so the two can never drift apart.
export const OTHER_LANGUAGES = [
  { code: "nl-NL", name: "Dutch",      country: "The Netherlands",   flag: "nl.svg" },
  { code: "de-DE", name: "German",     country: "Germany",           flag: "de.svg" },
  { code: "it-IT", name: "Italian",    country: "Italy",             flag: "it.svg" },
  { code: "pt-PT", name: "Portuguese", country: "Portugal",          flag: "pt.png" },
  { code: "fr-FR", name: "French",     country: "France",            flag: "fr.svg" },
  { code: "es-ES", name: "Spanish",    country: "Spain",             flag: "es.png" },
  { code: "pl-PL", name: "Polish",     country: "Poland",            flag: "pl.svg" },
  { code: "en-US", name: "English",    country: "The United States", flag: "us.png" },
  { code: "da-DK", name: "Danish",     country: "Denmark",           flag: "dk.svg" },
];

export const ALL_LANGUAGES = [PRIMARY_LANGUAGE, ...OTHER_LANGUAGES];

export const flagSrc = (flag) => `assets/flags/${flag}`;

// ---- answer scale ----------------------------------------------------------
// The 5-point Likert labels respondents actually see, per language. These are
// FIXED product strings (unlike question text), so they're real translations,
// not the simulated ones below. `points` runs strongly-disagree → strongly-agree.
const EN = {
  points: ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"],
  dontKnow: "I don’t know",
  open: "Share your thoughts…",
};
export const ANSWER_SCALE = {
  "en-GB": EN,
  "en-US": EN,
  "nl-NL": {
    points: ["Helemaal oneens", "Oneens", "Niet eens, niet oneens", "Eens", "Helemaal eens"],
    dontKnow: "Weet ik niet", open: "Deel hier je gedachten…",
  },
  "de-DE": {
    points: ["Stimme überhaupt nicht zu", "Stimme nicht zu", "Weder noch", "Stimme zu", "Stimme voll und ganz zu"],
    dontKnow: "Weiß ich nicht", open: "Teilen Sie Ihre Gedanken…",
  },
  "it-IT": {
    points: ["Del tutto in disaccordo", "In disaccordo", "Né d’accordo né in disaccordo", "D’accordo", "Del tutto d’accordo"],
    dontKnow: "Non so", open: "Condividi la tua opinione…",
  },
  "pt-PT": {
    points: ["Discordo totalmente", "Discordo", "Não concordo nem discordo", "Concordo", "Concordo totalmente"],
    dontKnow: "Não sei", open: "Partilhe a sua opinião…",
  },
  "fr-FR": {
    points: ["Pas du tout d’accord", "Pas d’accord", "Ni d’accord ni en désaccord", "D’accord", "Tout à fait d’accord"],
    dontKnow: "Je ne sais pas", open: "Partagez votre avis…",
  },
  "es-ES": {
    points: ["Totalmente en desacuerdo", "En desacuerdo", "Ni de acuerdo ni en desacuerdo", "De acuerdo", "Totalmente de acuerdo"],
    dontKnow: "No lo sé", open: "Comparte tu opinión…",
  },
  "pl-PL": {
    points: ["Zdecydowanie się nie zgadzam", "Nie zgadzam się", "Ani się zgadzam, ani nie zgadzam", "Zgadzam się", "Zdecydowanie się zgadzam"],
    dontKnow: "Nie wiem", open: "Podziel się swoją opinią…",
  },
  "da-DK": {
    points: ["Meget uenig", "Uenig", "Hverken enig eller uenig", "Enig", "Meget enig"],
    dontKnow: "Ved ikke", open: "Del dine tanker…",
  },
};

export const scaleFor = (code) => ANSWER_SCALE[code] || EN;

// ---- seeded statements: full, correct translations for the likely demo text --
const PHRASES = {
  "i have the tools i need to do my job well": {
    "nl-NL": "Ik heb de middelen die ik nodig heb om mijn werk goed te doen",
    "de-DE": "Ich habe die Mittel, die ich brauche, um meine Arbeit gut zu machen",
    "it-IT": "Ho gli strumenti necessari per svolgere bene il mio lavoro",
    "pt-PT": "Tenho as ferramentas de que preciso para fazer bem o meu trabalho",
    "fr-FR": "J'ai les outils dont j'ai besoin pour bien faire mon travail",
    "es-ES": "Tengo las herramientas que necesito para hacer bien mi trabajo",
    "pl-PL": "Mam narzędzia, których potrzebuję, aby dobrze wykonywać swoją pracę",
    "da-DK": "Jeg har de værktøjer, jeg har brug for til at udføre mit arbejde godt",
  },
  "i know what is expected of me at work": {
    "nl-NL": "Ik weet wat er op mijn werk van mij wordt verwacht",
    "de-DE": "Ich weiß, was bei der Arbeit von mir erwartet wird",
    "it-IT": "So che cosa ci si aspetta da me al lavoro",
    "pt-PT": "Sei o que se espera de mim no trabalho",
    "fr-FR": "Je sais ce que l'on attend de moi au travail",
    "es-ES": "Sé lo que se espera de mí en el trabajo",
    "pl-PL": "Wiem, czego się ode mnie oczekuje w pracy",
    "da-DK": "Jeg ved, hvad der forventes af mig på arbejdet",
  },
  "i feel supported by my manager": {
    "nl-NL": "Ik voel me gesteund door mijn leidinggevende",
    "de-DE": "Ich fühle mich von meiner Führungskraft unterstützt",
    "it-IT": "Mi sento supportato dal mio responsabile",
    "pt-PT": "Sinto-me apoiado pelo meu gestor",
    "fr-FR": "Je me sens soutenu par mon responsable",
    "es-ES": "Me siento apoyado por mi responsable",
    "pl-PL": "Czuję wsparcie ze strony swojego przełożonego",
    "da-DK": "Jeg føler mig støttet af min leder",
  },
};

// ---- word-level fallback for anything typed freehand ------------------------
const WORDS = {
  "nl-NL": { i: "ik", my: "mijn", me: "mij", we: "we", our: "ons", us: "ons", you: "je", your: "je", the: "de", a: "een", an: "een", and: "en", or: "of", to: "om", of: "van", in: "in", on: "op", at: "op", for: "voor", with: "met", from: "van", is: "is", are: "zijn", am: "ben", be: "zijn", have: "heb", has: "heeft", can: "kan", do: "doe", does: "doet", get: "krijg", feel: "voel", know: "weet", work: "werk", job: "werk", team: "team", manager: "leidinggevende", colleagues: "collega's", company: "bedrijf", organization: "organisatie", people: "mensen", time: "tijd", help: "hulp", support: "steun", clear: "duidelijk", good: "goed", well: "goed", enough: "genoeg", here: "hier", this: "dit", that: "dat", it: "het", need: "nodig", needed: "nodig", tools: "middelen", information: "informatie", resources: "middelen", everything: "alles" },
  "de-DE": { i: "ich", my: "meine", me: "mich", we: "wir", our: "unser", us: "uns", you: "Sie", your: "Ihre", the: "die", a: "ein", an: "ein", and: "und", or: "oder", to: "zu", of: "von", in: "in", on: "auf", at: "bei", for: "für", with: "mit", from: "von", is: "ist", are: "sind", am: "bin", be: "sein", have: "habe", has: "hat", can: "kann", do: "mache", does: "macht", get: "bekomme", feel: "fühle", know: "weiß", work: "Arbeit", job: "Arbeit", team: "Team", manager: "Führungskraft", colleagues: "Kollegen", company: "Unternehmen", organization: "Organisation", people: "Menschen", time: "Zeit", help: "Hilfe", support: "Unterstützung", clear: "klar", good: "gut", well: "gut", enough: "genug", here: "hier", this: "dies", that: "dass", it: "es", need: "brauche", needed: "benötigt", tools: "Werkzeuge", information: "Informationen", resources: "Ressourcen", everything: "alles" },
  "it-IT": { i: "io", my: "mio", me: "me", we: "noi", our: "nostro", us: "noi", you: "tu", your: "tuo", the: "il", a: "un", an: "un", and: "e", or: "o", to: "per", of: "di", in: "in", on: "su", at: "al", for: "per", with: "con", from: "da", is: "è", are: "sono", am: "sono", be: "essere", have: "ho", has: "ha", can: "posso", do: "faccio", does: "fa", get: "ottengo", feel: "sento", know: "so", work: "lavoro", job: "lavoro", team: "team", manager: "responsabile", colleagues: "colleghi", company: "azienda", organization: "organizzazione", people: "persone", time: "tempo", help: "aiuto", support: "supporto", clear: "chiaro", good: "buono", well: "bene", enough: "abbastanza", here: "qui", this: "questo", that: "che", it: "esso", need: "bisogno", needed: "necessario", tools: "strumenti", information: "informazioni", resources: "risorse", everything: "tutto" },
  "pt-PT": { i: "eu", my: "meu", me: "mim", we: "nós", our: "nosso", us: "nós", you: "você", your: "seu", the: "o", a: "um", an: "um", and: "e", or: "ou", to: "para", of: "de", in: "em", on: "em", at: "no", for: "para", with: "com", from: "de", is: "é", are: "são", am: "sou", be: "ser", have: "tenho", has: "tem", can: "posso", do: "faço", does: "faz", get: "obtenho", feel: "sinto", know: "sei", work: "trabalho", job: "trabalho", team: "equipa", manager: "gestor", colleagues: "colegas", company: "empresa", organization: "organização", people: "pessoas", time: "tempo", help: "ajuda", support: "apoio", clear: "claro", good: "bom", well: "bem", enough: "suficiente", here: "aqui", this: "este", that: "que", it: "isso", need: "preciso", needed: "necessário", tools: "ferramentas", information: "informação", resources: "recursos", everything: "tudo" },
  "fr-FR": { i: "je", my: "mon", me: "moi", we: "nous", our: "notre", us: "nous", you: "vous", your: "votre", the: "le", a: "un", an: "un", and: "et", or: "ou", to: "pour", of: "de", in: "dans", on: "sur", at: "au", for: "pour", with: "avec", from: "de", is: "est", are: "sont", am: "suis", be: "être", have: "ai", has: "a", can: "peux", do: "fais", does: "fait", get: "obtiens", feel: "sens", know: "sais", work: "travail", job: "travail", team: "équipe", manager: "responsable", colleagues: "collègues", company: "entreprise", organization: "organisation", people: "personnes", time: "temps", help: "aide", support: "soutien", clear: "clair", good: "bon", well: "bien", enough: "assez", here: "ici", this: "ce", that: "que", it: "cela", need: "besoin", needed: "nécessaire", tools: "outils", information: "informations", resources: "ressources", everything: "tout" },
  "es-ES": { i: "yo", my: "mi", me: "mí", we: "nosotros", our: "nuestro", us: "nosotros", you: "usted", your: "su", the: "el", a: "un", an: "un", and: "y", or: "o", to: "para", of: "de", in: "en", on: "en", at: "en", for: "para", with: "con", from: "de", is: "es", are: "son", am: "soy", be: "ser", have: "tengo", has: "tiene", can: "puedo", do: "hago", does: "hace", get: "obtengo", feel: "siento", know: "sé", work: "trabajo", job: "trabajo", team: "equipo", manager: "responsable", colleagues: "compañeros", company: "empresa", organization: "organización", people: "personas", time: "tiempo", help: "ayuda", support: "apoyo", clear: "claro", good: "bueno", well: "bien", enough: "suficiente", here: "aquí", this: "este", that: "que", it: "ello", need: "necesito", needed: "necesario", tools: "herramientas", information: "información", resources: "recursos", everything: "todo" },
  "pl-PL": { i: "ja", my: "mój", me: "mnie", we: "my", our: "nasz", us: "nas", you: "ty", your: "twój", the: "", a: "", an: "", and: "i", or: "lub", to: "aby", of: "z", in: "w", on: "na", at: "w", for: "dla", with: "z", from: "od", is: "jest", are: "są", am: "jestem", be: "być", have: "mam", has: "ma", can: "mogę", do: "robię", does: "robi", get: "otrzymuję", feel: "czuję", know: "wiem", work: "praca", job: "praca", team: "zespół", manager: "przełożony", colleagues: "współpracownicy", company: "firma", organization: "organizacja", people: "ludzie", time: "czas", help: "pomoc", support: "wsparcie", clear: "jasne", good: "dobry", well: "dobrze", enough: "wystarczająco", here: "tutaj", this: "to", that: "że", it: "to", need: "potrzebuję", needed: "potrzebny", tools: "narzędzia", information: "informacje", resources: "zasoby", everything: "wszystko" },
  "da-DK": { i: "jeg", my: "min", me: "mig", we: "vi", our: "vores", us: "os", you: "du", your: "din", the: "den", a: "en", an: "en", and: "og", or: "eller", to: "at", of: "af", in: "i", on: "på", at: "på", for: "for", with: "med", from: "fra", is: "er", are: "er", am: "er", be: "være", have: "har", has: "har", can: "kan", do: "gør", does: "gør", get: "får", feel: "føler", know: "ved", work: "arbejde", job: "arbejde", team: "team", manager: "leder", colleagues: "kolleger", company: "virksomhed", organization: "organisation", people: "mennesker", time: "tid", help: "hjælp", support: "støtte", clear: "klart", good: "god", well: "godt", enough: "nok", here: "her", this: "dette", that: "at", it: "det", need: "har brug for", needed: "nødvendig", tools: "værktøjer", information: "information", resources: "ressourcer", everything: "alt" },
};

// Frequent verbs and connectives, split out only to keep the tables readable.
// Verbs are listed in the infinitive; `lookUp` also tries the "-s" stem, so
// "gives" resolves through "give" without a second entry.
const MORE = {
  "nl-NL": { give: "geeft", make: "maakt", take: "neemt", want: "wil", use: "gebruikt", see: "ziet", find: "vindt", think: "denkt", say: "zegt", tell: "vertelt", listen: "luistert", trust: "vertrouwt", treat: "behandelt", share: "deelt", learn: "leert", provide: "biedt", allow: "staat toe", expect: "verwacht", understand: "begrijpt", respect: "respecteert", everyone: "iedereen", always: "altijd", often: "vaak", never: "nooit", very: "heel", when: "wanneer", what: "wat", how: "hoe", why: "waarom", about: "over", because: "omdat", but: "maar", not: "niet", more: "meer", their: "hun", there: "er" },
  "de-DE": { give: "gibt", make: "macht", take: "nimmt", want: "will", use: "nutzt", see: "sieht", find: "findet", think: "denkt", say: "sagt", tell: "erzählt", listen: "hört zu", trust: "vertraut", treat: "behandelt", share: "teilt", learn: "lernt", provide: "bietet", allow: "erlaubt", expect: "erwartet", understand: "versteht", respect: "respektiert", everyone: "alle", always: "immer", often: "oft", never: "nie", very: "sehr", when: "wenn", what: "was", how: "wie", why: "warum", about: "über", because: "weil", but: "aber", not: "nicht", more: "mehr", their: "ihre", there: "dort" },
  "it-IT": { give: "dà", make: "fa", take: "prende", want: "vuole", use: "usa", see: "vede", find: "trova", think: "pensa", say: "dice", tell: "racconta", listen: "ascolta", trust: "si fida", treat: "tratta", share: "condivide", learn: "impara", provide: "fornisce", allow: "permette", expect: "si aspetta", understand: "capisce", respect: "rispetta", everyone: "tutti", always: "sempre", often: "spesso", never: "mai", very: "molto", when: "quando", what: "cosa", how: "come", why: "perché", about: "su", because: "perché", but: "ma", not: "non", more: "più", their: "loro", there: "lì" },
  "pt-PT": { give: "dá", make: "faz", take: "leva", want: "quer", use: "usa", see: "vê", find: "encontra", think: "pensa", say: "diz", tell: "conta", listen: "ouve", trust: "confia", treat: "trata", share: "partilha", learn: "aprende", provide: "fornece", allow: "permite", expect: "espera", understand: "compreende", respect: "respeita", everyone: "todos", always: "sempre", often: "frequentemente", never: "nunca", very: "muito", when: "quando", what: "o que", how: "como", why: "porquê", about: "sobre", because: "porque", but: "mas", not: "não", more: "mais", their: "seu", there: "ali" },
  "fr-FR": { give: "donne", make: "fait", take: "prend", want: "veut", use: "utilise", see: "voit", find: "trouve", think: "pense", say: "dit", tell: "raconte", listen: "écoute", trust: "fait confiance", treat: "traite", share: "partage", learn: "apprend", provide: "fournit", allow: "permet", expect: "attend", understand: "comprend", respect: "respecte", everyone: "tout le monde", always: "toujours", often: "souvent", never: "jamais", very: "très", when: "quand", what: "quoi", how: "comment", why: "pourquoi", about: "sur", because: "parce que", but: "mais", not: "ne pas", more: "plus", their: "leur", there: "là" },
  "es-ES": { give: "da", make: "hace", take: "toma", want: "quiere", use: "usa", see: "ve", find: "encuentra", think: "piensa", say: "dice", tell: "cuenta", listen: "escucha", trust: "confía", treat: "trata", share: "comparte", learn: "aprende", provide: "proporciona", allow: "permite", expect: "espera", understand: "entiende", respect: "respeta", everyone: "todos", always: "siempre", often: "a menudo", never: "nunca", very: "muy", when: "cuando", what: "qué", how: "cómo", why: "por qué", about: "sobre", because: "porque", but: "pero", not: "no", more: "más", their: "su", there: "allí" },
  "pl-PL": { give: "daje", make: "robi", take: "bierze", want: "chce", use: "używa", see: "widzi", find: "znajduje", think: "myśli", say: "mówi", tell: "opowiada", listen: "słucha", trust: "ufa", treat: "traktuje", share: "dzieli się", learn: "uczy się", provide: "zapewnia", allow: "pozwala", expect: "oczekuje", understand: "rozumie", respect: "szanuje", everyone: "wszyscy", always: "zawsze", often: "często", never: "nigdy", very: "bardzo", when: "kiedy", what: "co", how: "jak", why: "dlaczego", about: "o", because: "ponieważ", but: "ale", not: "nie", more: "więcej", their: "ich", there: "tam" },
  "da-DK": { give: "giver", make: "laver", take: "tager", want: "vil", use: "bruger", see: "ser", find: "finder", think: "tænker", say: "siger", tell: "fortæller", listen: "lytter", trust: "stoler på", treat: "behandler", share: "deler", learn: "lærer", provide: "giver", allow: "tillader", expect: "forventer", understand: "forstår", respect: "respekterer", everyone: "alle", always: "altid", often: "ofte", never: "aldrig", very: "meget", when: "når", what: "hvad", how: "hvordan", why: "hvorfor", about: "om", because: "fordi", but: "men", not: "ikke", more: "mere", their: "deres", there: "der" },
};
Object.keys(WORDS).forEach(code => Object.assign(WORDS[code], MORE[code]));

// Exact match first, then the "-s" stem so plurals and third-person verbs hit.
const lookUp = (dict, word) => {
  const w = word.toLowerCase();
  if (dict[w] !== undefined) return dict[w];
  if (w.endsWith("s") && dict[w.slice(0, -1)] !== undefined) return dict[w.slice(0, -1)];
  return undefined;
};

const norm = (s) => s.toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ").trim();
const matchCase = (src, out) =>
  src[0] === src[0].toUpperCase() && out ? out[0].toUpperCase() + out.slice(1) : out;

/** Fake a machine translation of `text` into `code`. Returns "" for empty input. */
export function machineTranslate(text, code) {
  const src = (text || "").trim();
  if (!src) return "";
  // US English shares the source language — nothing to translate.
  if (code === "en-US") return src;

  const seeded = PHRASES[norm(src)];
  if (seeded && seeded[code]) return seeded[code];

  const dict = WORDS[code];
  if (!dict) return src;
  return src
    .split(/(\s+)/)
    .map((tok) => {
      if (!tok.trim()) return tok;
      const m = tok.match(/^([^\p{L}]*)(\p{L}[\p{L}'’-]*)([^\p{L}]*)$/u);
      if (!m) return tok;
      const [, lead, word, tail] = m;
      const hit = lookUp(dict, word);
      if (hit === undefined) return tok;
      if (hit === "") return lead + tail; // article that the language drops
      return lead + matchCase(word, hit) + tail;
    })
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}
