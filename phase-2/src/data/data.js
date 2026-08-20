// data.js — survey templates, question pool, topics & themes
// TOPIC = how questions are organised in the question library (neutral grouping).
// THEME = research-based construct with a COMPOSITE SCORE. Only ~30–50% of
//         questions belong to a theme. A theme's score appears in results only
//         if ALL of its questions are kept — breaking it is a deliberate problem.
import { libraryPool, templatePoolQuestions } from "./qlib.js";

export const QTYPES = {
  scale5:   { label: "5-point scale",   icon: "point-scale",  bg: "var(--bg-accent-turquoise-subtle)", fg: "var(--content-accent-turquoise)", creatable: true },
  multiple: { label: "Multiple choice", icon: "check-square",  bg: "var(--bg-highlight-subtle)",        fg: "var(--content-highlight)",        creatable: true },
  text:     { label: "Text answer",     icon: "text-entry",    bg: "var(--bg-accent-purple-subtle)",    fg: "var(--border-accent-purple-base)",     creatable: true },
};

// Topics = library order (sections in the default view)
export const TOPICS = [
  "Job satisfaction",
  "Tools & resources",
  "Role & contribution",
  "Workload & wellbeing",
  "Working conditions",
  "Team relationships",
  "Team effectiveness",
  "Manager support",
];

// Themes carry a composite score + an explanation shown in the Theme view.
// Realistic (IP-safe) Effectory theme names + definitions — see the
// realistic-content skill. Scores/benchmarks are illustrative.
export const THEMES = {
  "Adaptive leadership": { desc: "Adaptive leadership is about making clear what needs to change, why and how, and winning people's backing for it.", about: "Adaptive leadership is about making clear what needs to change, why and how, and winning people's backing for it. It relies on managers involving their teams so they understand and trust the change — which matters most in the unsettled moments that come with it.", score: 7.6, benchmark: 7.0 },
  "Autonomy": { desc: "Autonomy is about the sense of choice and freedom people feel in how they do their job.", about: "Autonomy is about the sense of choice and freedom people feel in how they do their job. The score reflects how willing the organisation is to give that independence. With more autonomy, people tend to be more intrinsically motivated in their work.", score: 7.9, benchmark: 7.3 },
  "Change management": { desc: "Change management combines how well the organisation prepares for change and how readily people adapt to it, covering how it prepares, informs and enables people ahead of change.", about: "Change management combines how well the organisation prepares for change and how readily people adapt to it, covering how it prepares, informs and enables people ahead of change. A strong score means people grasp the purpose of change and keep performing through it.", score: 7.1, benchmark: 6.9 },
  "Developing each other": { desc: "This is about teams drawing on each member's unique strengths to bring out the best in one another.", about: "This is about teams drawing on each member's unique strengths to bring out the best in one another. It looks at whether the current team set-up feels encouraging and inspiring enough to drive shared success.", score: 7.6, benchmark: 7.4 },
  "Direction setting": { desc: "Direction setting is about making people enthusiastic about the vision, familiar with and convinced by the strategy, and confident they are treated fairly.", about: "Direction setting is about making people enthusiastic about the vision, familiar with and convinced by the strategy, and confident they are treated fairly. When that is in place, people are more willing to get behind the changes the strategy requires.", score: 7.7, benchmark: 7.4 },
  "Early experience": { desc: "This reflects the sense of wellbeing people get from their job — being satisfied when the work and the organisation match what they want and value.", about: "This reflects the sense of wellbeing people get from their job — being satisfied when the work and the organisation match what they want and value.", score: 8.0, benchmark: 7.4 },
  "Employee enablement": { desc: "Employee enablement is about making sure people know what is expected and can bring their knowledge and skills to bear.", about: "Employee enablement is about making sure people know what is expected and can bring their knowledge and skills to bear. It includes constructive feedback and recognition, so good work is seen and rewarded.", score: 7.4, benchmark: 7.1 },
  "Employer quality": { desc: "Employer quality reflects how well the organisation creates a place where people feel at home, accepted and cared for.", about: "Employer quality reflects how well the organisation creates a place where people feel at home, accepted and cared for. Where it is strong, people feel part of a community, valued and inspired — and tend to perform better and stay longer because their motivation comes from within.", score: 7.6, benchmark: 7.3 },
  "Engagement": { desc: "Engagement captures how inspired and energised people feel by their work and how connected they are to the organisation.", about: "Engagement captures how inspired and energised people feel by their work and how connected they are to the organisation. Engaged people find their work meaningful, take pride in it, feel they belong and go the extra mile. The score reflects how enthusiastic and connected the workforce is.", score: 6.9, benchmark: 6.3 },
  "Future fit": { desc: "Future fit is about whether people can do their job well and keep performing over time, now and later in their careers.", about: "Future fit is about whether people can do their job well and keep performing over time, now and later in their careers. It rests on healthy working conditions, a good match between skills and role, room to develop, and commitment to the organisation's future. A strong score means conditions support people to keep performing for the long haul.", score: 7.0, benchmark: 6.5 },
  "High-performance climate": { desc: "A high-performance climate is the set of conditions that let people work efficiently and effectively — the right circumstances for people and managers to make the most of their potential, individually and as teams.", about: "A high-performance climate is the set of conditions that let people work efficiently and effectively — the right circumstances for people and managers to make the most of their potential, individually and as teams.", score: 7.0, benchmark: 6.4 },
  "Inclusion": { desc: "Inclusion is about people feeling accepted by their group and free to be their authentic selves.", about: "Inclusion is about people feeling accepted by their group and free to be their authentic selves. A strong score points to a real sense of belonging between people, their team and the organisation — a climate that supports safety, satisfaction and lower absence.", score: 8.4, benchmark: 7.8 },
  "Job fit": { desc: "This reflects how connected people feel to the organisation — whether they feel they fit, back its goals, and want to keep working there.", about: "This reflects how connected people feel to the organisation — whether they feel they fit, back its goals, and want to keep working there.", score: 8.4, benchmark: 8.2 },
  "Job resources": { desc: "Job resources is about how well the organisation equips people to work efficiently, productively and with enjoyment.", about: "Job resources is about how well the organisation equips people to work efficiently, productively and with enjoyment. A strong score means the right tools, systems, software, training and processes are in place for people to do their tasks as well as they can.", score: 8.0, benchmark: 7.4 },
  "Onboarding readiness": { desc: "This covers what the organisation does to introduce new joiners to its rules and ways of working.", about: "This covers what the organisation does to introduce new joiners to its rules and ways of working. Done well, people feel more socially integrated, clearer on their role and safer — and so more enthusiastic and engaged.", score: 8.4, benchmark: 8.2 },
  "Operational alignment": { desc: "This is about making sure people work on tasks that genuinely feed the team's goals, cutting wasted time and effort.", about: "This is about making sure people work on tasks that genuinely feed the team's goals, cutting wasted time and effort. It hinges on sharing the right information, making informed decisions, honouring agreements and staying flexible.", score: 8.3, benchmark: 8.0 },
  "Ownership": { desc: "Ownership is about how far people feel able to act with authority in decisions, and how responsible they feel for the results.", about: "Ownership is about how far people feel able to act with authority in decisions, and how responsible they feel for the results. A strong score means people are willing to be accountable for their own performance and their team's.", score: 7.9, benchmark: 7.7 },
  "People": { desc: "The People lens looks at how the organisation champions diversity by actively seeking out varied perspectives and backgrounds.", about: "The People lens looks at how the organisation champions diversity by actively seeking out varied perspectives and backgrounds.", score: 7.6, benchmark: 7.3 },
  "Policy": { desc: "The Policy lens looks at how deliberately the organisation builds a fair, unbiased environment with opportunity for everyone — recognising that policy matters but is not the whole answer on its own.", about: "The Policy lens looks at how deliberately the organisation builds a fair, unbiased environment with opportunity for everyone — recognising that policy matters but is not the whole answer on its own.", score: 7.4, benchmark: 7.0 },
  "Positive team experience": { desc: "This looks at how team members experience their work — whether it is enjoyable, satisfying and offers room to grow.", about: "This looks at how team members experience their work — whether it is enjoyable, satisfying and offers room to grow. In short, it reflects their attitude towards their role in the team and their future in the organisation.", score: 7.1, benchmark: 6.6 },
  "Practice": { desc: "The Practice lens looks at how the organisation actively creates settings where everyone feels valued and can take full part.", about: "The Practice lens looks at how the organisation actively creates settings where everyone feels valued and can take full part.", score: 7.3, benchmark: 7.1 },
  "Psychological safety": { desc: "Psychological safety is about how safe people feel within a group.", about: "Psychological safety is about how safe people feel within a group. Where it is high, people are comfortable giving feedback on each other's work and behaviour and openly discussing mistakes. The score reflects how at ease people are sharing opinions and how welcome feedback is.", score: 7.0, benchmark: 6.6 },
  "Respectful conduct": { desc: "This is about the team dynamics that build genuine cooperation, trust and respect — open communication, trust, making sure every voice is heard, and a positive atmosphere.", about: "This is about the team dynamics that build genuine cooperation, trust and respect — open communication, trust, making sure every voice is heard, and a positive atmosphere.", score: 7.9, benchmark: 7.5 },
  "Role clarity": { desc: "Role clarity is about how clear people and teams are on their responsibilities, priorities and what is expected of them, including how they work and how they contribute.", about: "Role clarity is about how clear people and teams are on their responsibilities, priorities and what is expected of them, including how they work and how they contribute. A strong score means people know what to do, when, and what they are aiming for.", score: 8.0, benchmark: 7.8 },
  "Role ownership": { desc: "This is about everyone in the team being clear on their roles and objectives.", about: "This is about everyone in the team being clear on their roles and objectives. When people share an understanding of their goals and responsibilities, it is easier to coordinate and pull towards a common aim.", score: 8.3, benchmark: 7.9 },
  "Strategic alignment": { desc: "Strategic alignment is a shared understanding of the organisation's goals across teams, so effort and involvement pull in the same strategic direction.", about: "Strategic alignment is a shared understanding of the organisation's goals across teams, so effort and involvement pull in the same strategic direction. The score reflects how aware people are of the vision and objectives and how far they feel able to contribute to them.", score: 6.9, benchmark: 6.7 },
  "Systems & structure": { desc: "Systems & structure is about well-run systems that give people the conditions to perform — good tools, effective processes, collaboration across levels, and room to develop.", about: "Systems & structure is about well-run systems that give people the conditions to perform — good tools, effective processes, collaboration across levels, and room to develop.", score: 7.8, benchmark: 7.6 },
  "Team collaboration": { desc: "Team collaboration is about a team working towards shared goals, helping and supporting one another.", about: "Team collaboration is about a team working towards shared goals, helping and supporting one another. A strong score reflects collegiality, cooperation and cohesion, and such teams tend to enjoy working together and outperform less collaborative ones.", score: 7.0, benchmark: 6.7 },
  "Team leadership": { desc: "Team leadership is about a manager giving clear direction and vision while motivating the team and setting a good example.", about: "Team leadership is about a manager giving clear direction and vision while motivating the team and setting a good example. Strong leaders support growth, spark creativity and enable performance. A high score means team members are satisfied with, and benefit from, their manager's guidance.", score: 6.9, benchmark: 6.7 },
  "Team performance": { desc: "This looks at how team members rate their team's performance and its contribution to the organisation's wider success — a read on how effective the team is at meeting its goals.", about: "This looks at how team members rate their team's performance and its contribution to the organisation's wider success — a read on how effective the team is at meeting its goals.", score: 6.8, benchmark: 6.4 },
  "Team productivity": { desc: "Team productivity is about how much a team gets out of its effort through efficient, effective ways of working.", about: "Team productivity is about how much a team gets out of its effort through efficient, effective ways of working. A strong score means people help each other set goals, hit objectives and grow through feedback — and such teams perform well consistently.", score: 7.4, benchmark: 7.0 },
  "eNPS": { desc: "The employee Net Promoter Score shows how many people would recommend the organisation as a good employer, calculated as the share of promoters minus the share of detractors.", about: "The employee Net Promoter Score shows how many people would recommend the organisation as a good employer, calculated as the share of promoters minus the share of detractors. It reflects how likely people are to act as ambassadors.", score: 7.2, benchmark: 6.9 },
};
// Every project on the account — the list the "Let's get started" dialog offers
// when a survey is created from All surveys (it has no project yet).
export const PROJECTS = [
  "Central Employee Listening",
  "Employee lifecycle",
  "Team pulses",
  "Example projects",
];

export const CUSTOM_GROUP = "Your custom questions";

// Small legacy question set (realistic, IP-safe wording from the base library)
// used only as the default for `themeStatus` — survey pools are built from
// templatePoolQuestions + libraryPool. `bench:true` = has an industry benchmark.
export const POOL = [
  { id: "q1", topic: "Job satisfaction", theme: "Engagement", type: "scale5", bench: true, tmpl: true, text: "Day to day, I find my work enjoyable" },
  { id: "q2", topic: "Tools & resources", theme: "Job resources", type: "scale5", bench: true, tmpl: true, text: "I'm kitted out with the tools and systems my job calls for" },
  { id: "q3", topic: "Tools & resources", theme: null, type: "scale5", bench: true, tmpl: true, text: "The information I rely on is easy to track down" },
  { id: "q4", topic: "Role & contribution", theme: "Job resources", type: "scale5", bench: true, tmpl: true, text: "My role lets me play to my strengths" },
  { id: "q5", topic: "Role & contribution", theme: "Strategic alignment", type: "scale5", bench: true, tmpl: true, text: "I can see how my work feeds the bigger strategy" },
  { id: "q6", topic: "Role & contribution", theme: "Future fit", type: "scale5", bench: true, tmpl: true, text: "What I'm asked to do plays to what I'm good at" },
  { id: "q7", topic: "Role & contribution", theme: "Autonomy", type: "scale5", bench: true, tmpl: true, text: "How I get my work done is largely up to me" },
  { id: "q8", topic: "Role & contribution", theme: "Role clarity", type: "scale5", bench: true, tmpl: true, text: "It's clear to me what I'm meant to deliver" },
  { id: "q9", topic: "Role & contribution", theme: "Role clarity", type: "scale5", bench: true, tmpl: true, text: "What my role is meant to cover is clear to me" },
  { id: "q10", topic: "Workload & wellbeing", theme: null, type: "scale5", bench: true, tmpl: true, text: "My job and personal life sit in healthy balance" },
  { id: "q11", topic: "Workload & wellbeing", theme: "Engagement", type: "scale5", bench: true, tmpl: true, text: "My work leaves me energised" },
  { id: "q12", topic: "Workload & wellbeing", theme: null, type: "scale5", bench: true, tmpl: true, text: "How would you rate the amount on your plate?" },
  { id: "q13", topic: "Workload & wellbeing", theme: null, type: "scale5", bench: true, tmpl: false, text: "The amount I'm asked to handle sits at a reasonable level" },
  { id: "q14", topic: "Workload & wellbeing", theme: null, type: "scale5", bench: true, tmpl: false, text: "I manage to switch between effort and recovery well" },
  { id: "q15", topic: "Workload & wellbeing", theme: null, type: "multiple", bench: true, tmpl: false, text: "Over the past year, colleagues have subjected me to unwanted behaviour (e.g. verbal abuse, physical aggression, unwanted advances, bullying, discrimination)", options: ["Never", "Sometimes", "Often"] },
  { id: "q16", topic: "Working conditions", theme: "Future fit", type: "scale5", bench: true, tmpl: false, text: "My physical workspace meets my needs" },
  { id: "q17", topic: "Team relationships", theme: "Team collaboration", type: "scale5", bench: true, tmpl: false, text: "In our team, we openly call out behaviour that isn't okay" },
  { id: "q18", topic: "Team relationships", theme: "Psychological safety", type: "scale5", bench: true, tmpl: false, text: "I'm comfortable raising behaviour issues directly with teammates" },
];

// Templates for the create-survey dialog. `illus` is the DS illustration
// (public/assets/illustrations/**) used on the template card and the preview
// hero — the design-system reference prototype uses a 64px illustration, not an
// icon badge. NOTE: the DS has no templates/ illustration for Team Development
// or Onboarding yet, so those fall back to the projects/ asset (flag upstream).
export const TEMPLATES = [
  { id: "sos", illus: "templates/sos-template.svg", name: "Smart Organisation Scan", scope: "Effectory module", count: 34, badge: "teal", desc: "Broad organisational scan built on the Strategic Fitness thinking; a full-length engagement survey template.", recommended: true, why: "Broad organisational scan built on the Strategic Fitness thinking; a full-length engagement survey template." },
  { id: "tds", illus: "projects/team-development-scan.svg", name: "Team Development", scope: "in company-wide surveys", count: 30, badge: "blue", desc: "Team-level diagnostic for collaboration, alignment and performance.", why: "Team-level diagnostic for collaboration, alignment and performance." },
  { id: "sfm", illus: "templates/sf-template.svg", name: "Strategic Fitness", scope: "in company-wide surveys", count: 22, badge: "violet", desc: "Diagnostic of the organisation's capacity to execute its strategy.", why: "Diagnostic of the organisation's capacity to execute its strategy." },
  { id: "wcwp", illus: "templates/wcwp-template.svg", name: "World-class Workplace", scope: "in company-wide surveys", count: 15, badge: "amber", desc: "Benchmarked employer-quality template based on employership and eNPS.", why: "Benchmarked employer-quality template based on employership and eNPS." },
  { id: "dei", illus: "templates/dei-template.svg", name: "Diversity, Equality & Inclusion", scope: "Available in 3 projects", count: 44, badge: "green", desc: "Deep-dive on psychological safety, belonging, fairness and diversity.", why: "Deep-dive on psychological safety, belonging, fairness and diversity." },
  { id: "onb", illus: "projects/onboarding.svg", name: "Onboarding", scope: "in Onboarding", count: 20, badge: "mint", desc: "New-joiner experience across the first weeks, from induction to job fit.", why: "New-joiner experience across the first weeks, from induction to job fit." },
];

export const BADGE_COLORS = {
  teal:   { bg: "var(--bg-accent-turquoise-subtle)", fg: "var(--content-accent-turquoise)", icon: "box" },
  blue:   { bg: "var(--bg-info-subtle)", fg: "var(--content-info)", icon: "users" },
  violet: { bg: "var(--bg-accent-purple-subtle)", fg: "var(--border-accent-purple-base)", icon: "shapes" },
  amber:  { bg: "var(--bg-highlight-subtle)", fg: "var(--content-highlight)", icon: "star" },
  green:  { bg: "var(--bg-positive-subtle)", fg: "var(--content-positive)", icon: "group" },
  mint:   { bg: "var(--bg-accent-turquoise-subtle)", fg: "var(--content-accent-turquoise)", icon: "home" },
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
  const byKey = new Map(tqs.map(q => [q.topic + "||" + q.text, q])); // to dedup the library
  // Pre-select the first N questions of each topic; the rest start unselected.
  const perTopic = {};
  tqs.forEach(q => {
    const n = perTopic[q.topic] || 0;
    if (n < preselectPerTopic) selectedIds.push(q.id);
    perTopic[q.topic] = n + 1;
  });
  // Add the rest of the shared library (unselected) so there's plenty more to
  // add. Templates reuse base-library questions, so DEDUPE by topic+text: a
  // library question already in the template isn't added twice; if it's
  // org-required, the template's copy inherits the required flag. Required
  // questions with no template match are added (and selected).
  libraryPool().forEach(q => {
    const dup = byKey.get(q.topic + "||" + q.text);
    if (dup) { if (q.required) { dup.required = true; if (!selectedIds.includes(dup.id)) selectedIds.push(dup.id); } return; }
    pool.push(q);
    if (q.required) selectedIds.push(q.id);
  });
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
