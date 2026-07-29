// data.js — survey templates, question pool, topics & themes
// TOPIC = how questions are organised in the question library (neutral grouping).
// THEME = research-based construct with a COMPOSITE SCORE. Only ~30–50% of
//         questions belong to a theme. A theme's score appears in results only
//         if ALL of its questions are kept — breaking it is a deliberate problem.
import { libraryPool, templatePoolQuestions } from "./qlib.js";

export const QTYPES = {
  scale5:   { label: "5-point scale",   icon: "point-scale",  bg: "var(--bg-accent-turquoise-subtle)", fg: "var(--content-accent-turquoise-base)", creatable: true },
  multiple: { label: "Multiple choice", icon: "check-square",  bg: "var(--bg-highlight-subtle)",        fg: "var(--content-highlight-base)",        creatable: true },
  text:     { label: "Text answer",     icon: "text-entry",    bg: "var(--bg-accent-purple-subtle)",    fg: "var(--border-accent-purple-base)",     creatable: true },
};

// Topics = library order (sections in the default view)
export const TOPICS = [
  "Welcome & Integration",
  "Clarity & Enablement",
  "Leadership & Trust",
  "Wellbeing & Workload",
  "Engagement & Commitment",
];

// Themes carry a composite score + an explanation shown in the Theme view.
// Only ~30% of library questions belong to a theme.
export const THEMES = {
  "Onboarding experience": {
    desc: "How well new joiners are welcomed and set up to succeed in their first weeks.",
    about: "Onboarding experience looks at how confident and connected new joiners feel in their first weeks — whether they were made welcome, got up to speed quickly, and had what they needed to do their job. It's an early signal of how well people will settle in and stay. Keep all its questions together to read it as one score.",
    score: 8.1, benchmark: 7.6 },
  "Leadership": {
    desc: "Trust in — and support from — direct managers and senior leadership.",
    about: "Leadership measures how much people trust and feel supported by their managers and senior leaders — from everyday feedback and development to confidence in the decisions being made. It's one of the clearest drivers of how engaged people are and whether they stay. Keep all its questions together to read it as one score.",
    score: 7.7, benchmark: 7.3 },
  "Engagement": {
    desc: "How inspired, energized and committed people feel about their work.",
    about: "Engagement captures how much energy and commitment people bring to their work, and how connected they feel to where the organization is going. It's one of the strongest signals of motivation and whether people intend to stay. Keep all its questions together to read it as one score.",
    score: 7.9, benchmark: 7.5 },
  "Collaboration": {
    desc: "How well people and teams work together and share what they know.",
    about: "Collaboration looks at how smoothly people work across teams — sharing information, handling disagreements well, and helping each other get things done. Strong collaboration shows up in faster decisions and less friction. Keep all its questions together to read it as one score.",
    score: 7.4, benchmark: 7.2 },
  "Wellbeing": {
    desc: "Whether people can sustain their energy, workload and balance over time.",
    about: "Wellbeing looks at whether workload and pace are sustainable and whether people can balance work with the rest of life. It's an early warning sign for burnout and drop-off in performance. Keep all its questions together to read it as one score.",
    score: 7.1, benchmark: 6.9 },
  "Development": {
    desc: "Whether people can grow, learn and progress in their role.",
    about: "Development measures whether people see room to learn, grow and move forward in their work. It's closely tied to motivation and to whether people picture a future with the organization. Keep all its questions together to read it as one score.",
    score: 7.3, benchmark: 7.0 },
  "Strategic alignment": {
    desc: "How clearly people understand the direction and how their work fits in.",
    about: "Strategic alignment looks at whether people understand where the organization is heading and can see how their own work contributes. When it's strong, effort points in the same direction. Keep all its questions together to read it as one score.",
    score: 7.2, benchmark: 7.1 },
  "Inclusion": {
    desc: "Whether people feel respected, heard and able to be themselves at work.",
    about: "Inclusion looks at whether people feel respected, safe to speak up, and able to be themselves at work. It underpins trust, collaboration and engagement across every group. Keep all its questions together to read it as one score.",
    score: 7.6, benchmark: 7.3 },
  // A cross-cutting theme that shares questions with Role clarity — used to show
  // how removing one question can break several themes at once.
  "Goal alignment": {
    desc: "How clearly people connect their day-to-day role to the organisation's wider goals. It's a strong signal of focus and direction.",
    about: "Goal alignment looks at whether people understand what's expected of them and see how their work ladders up to the bigger picture. When it's strong, effort points the same way. Keep all its questions together to read it as one score.",
    score: 7.8, benchmark: 7.4 },
};
export const CUSTOM_GROUP = "Your custom questions";

// Every library question has an industry benchmark (bench:true). Only custom
// questions, added by the user, have no benchmark.
// `tmpl` = part of the Smart Organization Scan template (pre-selected = 12).
// NOTE: original, illustrative wording — generic engagement items written for
// this prototype, not Effectory's proprietary validated questions.
export const POOL = [
  // Welcome & Integration
  { id: "q1",  topic: "Welcome & Integration", theme: "Onboarding experience", type: "scale5",   bench: true, tmpl: true,  text: "I felt genuinely welcomed during my first days here." },
  { id: "q2",  topic: "Welcome & Integration", theme: "Onboarding experience", type: "scale5",   bench: true, tmpl: true,  text: "It didn't take long to feel part of the team." },
  { id: "q3",  topic: "Welcome & Integration", theme: "Onboarding experience", type: "scale5",   bench: true, tmpl: true,  text: "From the start I had what I needed to do my job." },
  { id: "q4",  topic: "Welcome & Integration", theme: null,                    type: "multiple", bench: true, tmpl: false, text: "How did you first come across this employer?",
    options: ["Referral from an employee", "Job board or website", "Social media", "Recruitment agency", "Other"] },

  // Clarity & Enablement
  { id: "q5",  topic: "Clarity & Enablement", theme: null, type: "scale5", bench: true, tmpl: true,  text: "It's clear to me what's expected in my role." },
  { id: "q6",  topic: "Clarity & Enablement", theme: null, type: "scale5", bench: true, tmpl: true,  text: "I can see how my work contributes to our goals." },
  { id: "q7",  topic: "Clarity & Enablement", theme: null, type: "scale5", bench: true, tmpl: false, text: "I can get hold of the resources I need to do good work." },
  { id: "q8",  topic: "Clarity & Enablement", theme: null, type: "scale5", bench: true, tmpl: false, text: "Decisions are made at the right level here." },

  // Leadership & Trust
  { id: "q9",  topic: "Leadership & Trust", theme: "Leadership", type: "scale5", bench: true, tmpl: true,  text: "My manager actively supports my development." },
  { id: "q10", topic: "Leadership & Trust", theme: "Leadership", type: "scale5", bench: true, tmpl: true,  text: "The feedback I get from my manager is useful." },
  { id: "q11", topic: "Leadership & Trust", theme: "Leadership", type: "scale5", bench: true, tmpl: true,  text: "I have confidence in senior leadership's decisions." },
  { id: "q12", topic: "Leadership & Trust", theme: null,         type: "scale5", bench: true, tmpl: false, text: "Leadership is open about where the organisation is heading." },

  // Wellbeing & Workload
  { id: "q13", topic: "Wellbeing & Workload", theme: null, type: "scale5",   bench: true, tmpl: true,  text: "I'm able to balance work with my personal life." },
  { id: "q14", topic: "Wellbeing & Workload", theme: null, type: "scale5",   bench: true, tmpl: true,  text: "My workload feels manageable." },
  { id: "q15", topic: "Wellbeing & Workload", theme: null, type: "scale5",   bench: true, tmpl: false, text: "Most workdays leave me with energy rather than drained." },
  { id: "q16", topic: "Wellbeing & Workload", theme: null, type: "multiple", bench: true, tmpl: false, text: "How does your current workload feel?",
    options: ["Far too little", "A little too little", "About right", "A little too much", "Far too much"] },

  // Engagement & Commitment
  { id: "q17", topic: "Engagement & Commitment", theme: null, type: "scale5", bench: true, tmpl: true,  text: "I'd recommend this organisation to others as a place to work." },
  { id: "q18", topic: "Engagement & Commitment", theme: null, type: "scale5", bench: true, tmpl: true,  text: "I feel proud to work here." },
  { id: "q19", topic: "Engagement & Commitment", theme: null, type: "scale5", bench: true, tmpl: false, text: "I expect to still be working here in two years." },
  { id: "q20", topic: "Engagement & Commitment", theme: null, type: "scale5", bench: true, tmpl: false, text: "I'm happy to go the extra mile when it counts." },
];

// templates for the modal
export const TEMPLATES = [
  { id: "sos",  name: "Smart Organization Scan", scope: "Effectory template", count: 12, badge: "teal",
    desc: "A broad pulse across onboarding, clarity, leadership, wellbeing and engagement — Effectory's all-round scan of organisational health.", recommended: true,
    why: "You gather a broad, benchmarked read on organisational health in one go — onboarding, clarity, leadership, wellbeing and engagement.",
    why2: "It's the fastest way to see where to focus before drilling deeper with follow-up surveys." },
  { id: "tds",  name: "Team development scan", scope: "in company-wide surveys", count: 18, badge: "blue",
    desc: "Helps teams evaluate collaboration, communication and effectiveness. Based on Effectory's team development model, designed for use at team level.",
    why: "Teams get a clear picture of how they collaborate, communicate and perform together.",
    why2: "Results are built to be discussed in the team, turning feedback into concrete ways of working." },
  { id: "sfm",  name: "Strategic Fitness model", scope: "in company-wide surveys", count: 22, badge: "violet",
    desc: "The SF Model template is based on Effectory's Strategic Fitness Model, which measures the key drivers of organisational success: employee engagement and the performance environment. It provides a holistic view of how well your organisation enables employees to perform and stay motivated.",
    why: "By using this template, you gather actionable data on the factors that influence both willingness to work and ability to perform.",
    why2: "This helps you identify areas that need improvement to boost engagement and organisational effectiveness." },
  { id: "wcwp", name: "World-Class Workplace", scope: "in company-wide surveys", count: 16, badge: "amber",
    desc: "Measures how your organisation compares to top employers worldwide using Effectory's benchmark. Eligible for the World-Class Workplace label.",
    why: "You see how your organisation compares to top employers worldwide on Effectory's benchmark.",
    why2: "Strong results make you eligible for the World-Class Workplace label." },
  { id: "dei",  name: "Diversity, Equity & Inclusion", scope: "Available in 3 projects", count: 20, badge: "green",
    desc: "Assess your current state of diversity, equity and inclusion. A clear starting point for understanding where your DEI efforts stand.",
    why: "You get an honest baseline of how included and fairly treated people feel across groups.",
    why2: "It pinpoints where your DEI efforts are working and where to invest next." },
  { id: "onb",  name: "Onboarding", scope: "in Onboarding", count: 12, badge: "mint",
    desc: "Measures how new employees experience their integration and whether they feel supported during their first weeks or months.",
    why: "You learn how new joiners experience their first weeks and whether they feel set up to succeed.",
    why2: "Early signals let you fix onboarding gaps before they affect retention." },
];

export const BADGE_COLORS = {
  teal:   { bg: "var(--bg-accent-turquoise-subtle)", fg: "var(--content-accent-turquoise-base)", icon: "box" },
  blue:   { bg: "var(--bg-info-subtle)", fg: "var(--content-info-base)", icon: "users" },
  violet: { bg: "var(--bg-accent-purple-subtle)", fg: "var(--border-accent-purple-base)", icon: "shapes" },
  amber:  { bg: "var(--bg-highlight-subtle)", fg: "var(--content-highlight-base)", icon: "star" },
  green:  { bg: "var(--bg-positive-subtle)", fg: "var(--content-positive-base)", icon: "group" },
  mint:   { bg: "var(--bg-accent-turquoise-subtle)", fg: "var(--content-accent-turquoise-base)", icon: "home" },
};

export const DEFAULT_MC = ["", ""];
export const SCALE_LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

// Build a real questionnaire (pool + all-selected) from a template's own
// question set in the library export — so each template loads its own questions.
// `preselectPerTopic` controls how many questions per topic start selected — the
// rest stay in the library, unselected, so there are plenty more to add.
export function surveyFromTemplate(templateId, id, name, preselectPerTopic = Infinity) {
  const tqs = templatePoolQuestions(templateId);
  const pool = [...tqs], selectedIds = [];
  // Pre-select the first N questions of each topic; the rest start unselected.
  const perTopic = {};
  tqs.forEach(q => {
    const n = perTopic[q.topic] || 0;
    if (n < preselectPerTopic) selectedIds.push(q.id);
    perTopic[q.topic] = n + 1;
  });
  // Add the rest of the shared library (unselected) so there's plenty more to
  // choose from in "Add questions" beyond the template's own picks — but the
  // org-required questions are always in + selected.
  const lib = libraryPool();
  lib.forEach(q => { pool.push(q); if (q.required) selectedIds.push(q.id); });
  const t = TEMPLATES.find(x => x.id === templateId);
  return { id, name, templateName: t ? t.name : templateId, isTemplate: true, selectedIds, pool };
}

// Seed rows for the Surveys landing page. Drafts created in the flow are
// prepended to this list; any Draft (seed or created) can be deleted. The
// editable rows (Draft/Planned) carry their template's own questionnaire.
export const SEED_SURVEYS = [
  { id: "s1", name: "Employee Engagement 2025", proj: "Central Employee Listening", status: "Live", resp: "72%", date: "Closes 14 Jun", mine: true },
  { id: "s2", name: "Onboarding pulse — Q2", proj: "Employee lifecycle", status: "Planned", resp: "—", date: "Starts 9 Jun", mine: true,
    survey: surveyFromTemplate("onb", "s2", "Onboarding pulse — Q2") },
  { id: "s3", name: "Smart Organization Scan", proj: "Central Employee Listening", status: "Draft", resp: "—", date: "Edited 3 min ago", mine: true,
    survey: surveyFromTemplate("sos", "s3", "Smart Organization Scan") },
  { id: "s4", name: "DEI baseline", proj: "Central Employee Listening", status: "Closed", resp: "81%", date: "Closed 2 May", mine: false },
  { id: "s5", name: "Onboarding experience 2026", proj: "Employee lifecycle", status: "Closed", resp: "92%", date: "Closed 14 Mar", mine: true },
  { id: "s6", name: "Customer Support team check-in", proj: "Team pulses", status: "Live", resp: "79%", date: "Closes 7 Jul", mine: false },
  { id: "s7", name: "Exit interviews 2026", proj: "Employee lifecycle", status: "Live", resp: "41%", date: "Closes 30 Sep", mine: true },
  { id: "s8", name: "Leadership 360 pilot", proj: "Example projects", status: "Planned", resp: "—", date: "Starts 3 Aug", mine: false },
  { id: "s9", name: "Wellbeing check-in Q1", proj: "Team pulses", status: "Closed", resp: "68%", date: "Closed 5 Feb", mine: false },
  { id: "s10", name: "UX research screener", proj: "Example projects", status: "Draft", resp: "—", date: "Edited 2 days ago", mine: true },
];
