// qlib.js — per-template preview content + shared library.
// Content is the REALISTIC, IP-SAFE Effectory library (reworded questions,
// renamed topics/themes; standard constructs like Engagement/eNPS kept) from the
// realistic-content skill (data.safe.json) — safe for the public demo. Generated
// via scratchpad/gen_realistic.py; a question's `theme` is the primary theme and
// `themes` (when present) lists every theme it belongs to (multi-theme questions).
// Shape: { [templateId]: [{ topic, questions: [{ text, type, theme, themes?, options? }] }] }

export const TEMPLATE_PREVIEWS = {
  sos: [
    { topic: "Job satisfaction", questions: [
      { text: "Day to day, I find my work enjoyable", type: "scale5", theme: "Engagement" },
    ]},
    { topic: "Tools & resources", questions: [
      { text: "I'm kitted out with the tools and systems my job calls for", type: "scale5", theme: "Systems & structure" },
      { text: "The information I rely on is easy to track down", type: "scale5", theme: "Systems & structure" },
    ]},
    { topic: "Role & contribution", questions: [
      { text: "What I'm asked to do plays to what I'm good at", type: "scale5", theme: "Employee enablement" },
      { text: "It's clear to me what I'm meant to deliver", type: "scale5", theme: "Employee enablement" },
    ]},
    { topic: "Workload & wellbeing", questions: [
      { text: "My job and personal life sit in healthy balance", type: "scale5", theme: null },
      { text: "My work leaves me energised", type: "scale5", theme: "Engagement" },
    ]},
    { topic: "Team effectiveness", questions: [
      { text: "My team knows how it can help the wider organisation succeed", type: "scale5", theme: "Adaptive leadership" },
      { text: "Teamwork within my group works well", type: "scale5", theme: "Systems & structure" },
      { text: "My team is a regular source of good improvement ideas", type: "scale5", theme: "Adaptive leadership" },
    ]},
    { topic: "Manager support", questions: [
      { text: "I trust my manager's judgement", type: "scale5", theme: "Adaptive leadership" },
      { text: "Helpful feedback on my performance comes my way often", type: "scale5", theme: "Employee enablement" },
      { text: "My manager steers us through change capably", type: "scale5", theme: "Adaptive leadership" },
    ]},
    { topic: "Strategy & goals", questions: [
      { text: "I'm behind where the organisation is heading", type: "scale5", theme: "Direction setting" },
      { text: "Where the organisation says it's going inspires me", type: "scale5", theme: "Employer quality" },
    ]},
    { topic: "Senior leadership", questions: [
      { text: "I have faith in the people running the organisation", type: "scale5", theme: "Adaptive leadership" },
    ]},
    { topic: "Cross-team communication", questions: [
      { text: "Across the organisation, work is structured in a well-organised way", type: "scale5", theme: "Systems & structure" },
    ]},
    { topic: "Company culture", questions: [
      { text: "As an employer, this place suits me well", type: "scale5", theme: "Employer quality" },
      { text: "Being part of this organisation makes me proud", type: "scale5", theme: "Engagement" },
      { text: "This place feels like somewhere I belong", type: "scale5", theme: "Engagement" },
      { text: "The organisation makes me feel my work matters", type: "scale5", theme: "Employer quality" },
      { text: "The way things are done here is a good fit for me", type: "scale5", theme: "Adaptive leadership" },
      { text: "Staff here are dealt with in an even-handed way", type: "scale5", theme: "Direction setting" },
      { text: "Strong results tend to pay off here", type: "scale5", theme: "Systems & structure" },
      { text: "Good work of mine gets noticed", type: "scale5", theme: "Employee enablement" },
    ]},
    { topic: "Acting on feedback", questions: [
      { text: "Staff ideas actually feed improvements here", type: "scale5", theme: "Employer quality" },
    ]},
    { topic: "Learning & growth", questions: [
      { text: "There are plenty of ways to grow on offer here", type: "scale5", theme: "Systems & structure" },
      { text: "Over the last quarter I've acted on finding a new job, or intend to shortly", type: "multiple", theme: null, options: ["No", "Yes, internally", "Yes, externally"] },
      { text: "Staying on here for another year or two appeals to me", type: "scale5", theme: null },
    ]},
    { topic: "eNPS", questions: [
      { text: "Would you point a friend towards us as a place to work?", type: "scale5", theme: "eNPS" },
    ]},
    { topic: "Pride & highlights", questions: [
      { text: "What about the organisation gives you the most pride?", type: "scale5", theme: null },
      { text: "What's behind that pride? A short description will do", type: "text", theme: null },
    ]},
    { topic: "Improvement areas", questions: [
      { text: "Where do you think the organisation has room to do better?", type: "scale5", theme: null },
      { text: "Where could the organisation step up? Add a short note and one practical suggestion", type: "text", theme: null },
    ]},
  ],
  tds: [
    { topic: "My work experience", questions: [
      { text: "How would you rate your own energy level?", type: "scale5", theme: null },
      { text: "Day to day, I find my work enjoyable", type: "scale5", theme: "Positive team experience" },
      { text: "The work on my plate suits me", type: "scale5", theme: "Positive team experience" },
      { text: "I feel at ease within my team", type: "scale5", theme: "Positive team experience" },
      { text: "I can see plenty of room to keep growing", type: "scale5", theme: "Positive team experience" },
    ]},
    { topic: "Clear roles & goals", questions: [
      { text: "Everyone knows what the team is aiming for", type: "scale5", theme: "Role ownership" },
      { text: "Who's responsible for what is clear", type: "scale5", theme: "Role ownership" },
    ]},
    { topic: "Work coordination", questions: [
      { text: "We're clear on our team's priorities", type: "scale5", theme: "Operational alignment" },
      { text: "Key information gets passed around well between us", type: "scale5", theme: "Operational alignment" },
      { text: "We're good at reaching decisions together", type: "scale5", theme: "Operational alignment" },
      { text: "We adapt well to shifts, whether they come from inside or outside", type: "scale5", theme: "Operational alignment" },
      { text: "We follow through on what we promise each other", type: "scale5", theme: "Operational alignment" },
    ]},
    { topic: "Team climate", questions: [
      { text: "People's ideas and suggestions get a proper hearing", type: "scale5", theme: "Respectful conduct" },
      { text: "We talk to each other openly and straight", type: "scale5", theme: "Respectful conduct" },
      { text: "Trust runs through our team", type: "scale5", theme: "Respectful conduct" },
      { text: "In team meetings, everyone gets a fair turn to speak", type: "scale5", theme: "Respectful conduct" },
      { text: "Our team has an easy-going atmosphere", type: "scale5", theme: "Respectful conduct" },
      { text: "We take a real interest in each other as people", type: "scale5", theme: "Respectful conduct" },
    ]},
    { topic: "Mutual growth", questions: [
      { text: "How would you rate your team's energy level?", type: "scale5", theme: null },
      { text: "We give each other feedback that actually helps", type: "scale5", theme: "Developing each other" },
      { text: "We tell each other when something's appreciated", type: "scale5", theme: "Developing each other" },
      { text: "We draw well on each other's strengths", type: "scale5", theme: "Developing each other" },
      { text: "We've got the right people in place to do well", type: "scale5", theme: "Developing each other" },
    ]},
    { topic: "Team output", questions: [
      { text: "As a team, we put in a strong performance", type: "scale5", theme: "Team performance" },
      { text: "As a team, we add real value to the wider organisation", type: "scale5", theme: "Team performance" },
    ]},
    { topic: "Team pride & highlights", questions: [
      { text: "Which areas make you proudest?", type: "scale5", theme: null },
      { text: "What makes you proud of this?", type: "text", theme: null },
    ]},
    { topic: "Team improvement areas", questions: [
      { text: "Which areas have the most room to improve?", type: "scale5", theme: null },
      { text: "What's your suggestion for improving this?", type: "text", theme: null },
    ]},
    { topic: "Team progress", questions: [
      { text: "Which way is our team heading?", type: "multiple", theme: null, options: ["Moving forward", "Staying steady", "Falling back", "Not sure, we've only just started"] },
    ]},
  ],
  sfm: [
    { topic: "Performance drivers", questions: [
      { text: "Where the organisation says it's going inspires me", type: "scale5", theme: "Direction setting", themes: ["Direction setting", "High-performance climate"] },
      { text: "I'm behind where the organisation is heading", type: "scale5", theme: "Direction setting", themes: ["Direction setting", "High-performance climate"] },
      { text: "Staff here are dealt with in an even-handed way", type: "scale5", theme: "Direction setting", themes: ["Direction setting", "High-performance climate"] },
      { text: "My team knows how it can help the wider organisation succeed", type: "scale5", theme: "Adaptive leadership", themes: ["Adaptive leadership", "High-performance climate"] },
      { text: "My team is a constant source of good improvement ideas", type: "scale5", theme: "Adaptive leadership", themes: ["Adaptive leadership", "High-performance climate"] },
      { text: "My manager steers us through change capably", type: "scale5", theme: "Adaptive leadership", themes: ["Adaptive leadership", "High-performance climate"] },
      { text: "I trust my manager's judgement", type: "scale5", theme: "Adaptive leadership", themes: ["Adaptive leadership", "High-performance climate"] },
      { text: "The way things are done here is a good fit for me", type: "scale5", theme: "Adaptive leadership", themes: ["Adaptive leadership", "High-performance climate"] },
      { text: "It's clear to me what I'm meant to deliver", type: "scale5", theme: "Employee enablement", themes: ["Employee enablement", "High-performance climate"] },
      { text: "What I'm asked to do plays to what I'm good at", type: "scale5", theme: "Employee enablement", themes: ["Employee enablement", "High-performance climate"] },
      { text: "Helpful feedback on my performance comes my way often", type: "scale5", theme: "Employee enablement", themes: ["Employee enablement", "High-performance climate"] },
      { text: "Good work of mine gets noticed", type: "scale5", theme: "Employee enablement", themes: ["Employee enablement", "High-performance climate"] },
      { text: "Strong results tend to pay off here", type: "scale5", theme: "Systems & structure", themes: ["Systems & structure", "High-performance climate"] },
      { text: "Across the organisation, work is structured in a well-organised way", type: "scale5", theme: "Systems & structure", themes: ["Systems & structure", "High-performance climate"] },
      { text: "I'm kitted out with the tools and systems my job calls for", type: "scale5", theme: "Systems & structure", themes: ["Systems & structure", "High-performance climate"] },
      { text: "Teamwork within my group works well", type: "scale5", theme: "Systems & structure", themes: ["Systems & structure", "High-performance climate"] },
      { text: "There are plenty of ways to grow on offer here", type: "scale5", theme: "Systems & structure", themes: ["Systems & structure", "High-performance climate"] },
      { text: "The information I rely on is easy to track down", type: "scale5", theme: "Systems & structure", themes: ["Systems & structure", "High-performance climate"] },
      { text: "Day to day, I find my work enjoyable", type: "scale5", theme: "Engagement" },
      { text: "My work leaves me energised", type: "scale5", theme: "Engagement" },
      { text: "This place feels like somewhere I belong", type: "scale5", theme: "Engagement" },
      { text: "Being part of this organisation makes me proud", type: "scale5", theme: "Engagement" },
    ]},
  ],
  wcwp: [
    { topic: "Job satisfaction", questions: [
      { text: "Day to day, I find my work enjoyable", type: "scale5", theme: "Engagement" },
      { text: "My role lets me play to my strengths", type: "scale5", theme: "Job resources" },
      { text: "My work leaves me energised", type: "scale5", theme: "Engagement" },
      { text: "How would you rate the amount on your plate?", type: "scale5", theme: null },
    ]},
    { topic: "Working conditions", questions: [
      { text: "Across the organisation, work is structured in a well-organised way", type: "scale5", theme: "Job resources" },
      { text: "I'm kitted out with the tools and systems my job calls for", type: "scale5", theme: "Job resources" },
    ]},
    { topic: "Company culture", questions: [
      { text: "As an employer, this place suits me well", type: "scale5", theme: "Employer quality" },
      { text: "Being part of this organisation makes me proud", type: "scale5", theme: "Engagement" },
      { text: "This place feels like somewhere I belong", type: "scale5", theme: "Engagement" },
      { text: "The organisation makes me feel my work matters", type: "scale5", theme: "Employer quality" },
      { text: "Staff ideas actually feed improvements here", type: "scale5", theme: "Employer quality" },
      { text: "Where the organisation says it's going inspires me", type: "scale5", theme: "Employer quality" },
    ]},
    { topic: "eNPS", questions: [
      { text: "Would you point a friend towards us as a place to work?", type: "scale5", theme: null },
    ]},
    { topic: "Improvement areas", questions: [
      { text: "Where do you think the organisation has room to do better?", type: "text", theme: null },
      { text: "Where could the organisation step up? Add a short note and one practical suggestion", type: "text", theme: null },
    ]},
  ],
  dei: [
    { topic: "Psychological safety", questions: [
      { text: "Owning up to a slip-up feels safe here", type: "scale5", theme: "Practice" },
      { text: "I can speak my mind here without worrying about repercussions", type: "scale5", theme: "Practice" },
      { text: "I'm comfortable raising behaviour issues directly with teammates", type: "scale5", theme: null },
      { text: "I'm comfortable challenging my manager on how they act", type: "scale5", theme: null },
      { text: "I know how to report unwanted behaviour here", type: "multiple", theme: null, options: ["Yes", "No"] },
      { text: "Over the past year, colleagues have behaved towards me in unwanted ways (e.g. verbal aggression, physical abuse, sexual harassment, bullying, discrimination)", type: "multiple", theme: null, options: ["Never", "Sometimes", "Often"] },
      { text: "What kind of unwanted behaviour did you run into?", type: "scale5", theme: null },
      { text: "Who was the unwanted behaviour coming from?", type: "scale5", theme: null },
      { text: "Did you flag this behaviour to a manager, confidential adviser or HR?", type: "multiple", theme: null, options: ["Yes", "No"] },
      { text: "What stopped you reporting this to a manager, confidential adviser or HR?", type: "text", theme: null },
      { text: "The support I got after reporting this was satisfactory", type: "multiple", theme: null, options: ["Yes", "No"] },
      { text: "What would have made it better?", type: "text", theme: null },
    ]},
    { topic: "Trust", questions: [
      { text: "Staff and management keep the lines of communication open here", type: "scale5", theme: "Practice" },
      { text: "Leadership here is open and straight with us about big developments", type: "scale5", theme: "Policy" },
      { text: "I know what our DEI goals and approach are", type: "scale5", theme: null },
      { text: "Leadership is genuinely committed to advancing DEI here", type: "scale5", theme: null },
      { text: "We're kept posted on how the DEI strategy and goals are progressing", type: "scale5", theme: null },
    ]},
    { topic: "Belonging", questions: [
      { text: "I can be genuine with everyone I work alongside", type: "scale5", theme: "Practice" },
      { text: "The people right around me take me as I am", type: "scale5", theme: "Practice" },
      { text: "My teammates make my contribution feel it counts", type: "scale5", theme: null },
      { text: "I sense my manager appreciates what I bring", type: "scale5", theme: null },
      { text: "Do you feel you have to keep parts of who you are under wraps at work?", type: "multiple", theme: null, options: ["Yes", "No"] },
      { text: "Which parts of your identity have you had to downplay or conceal?", type: "scale5", theme: null },
    ]},
    { topic: "Valuing differences", questions: [
      { text: "My manager makes room for differing views in the team", type: "scale5", theme: "Practice" },
      { text: "I'm treated respectfully by my manager", type: "scale5", theme: null },
      { text: "Differing views are genuinely respected here", type: "scale5", theme: "Policy" },
      { text: "Staff ideas actually feed improvements here", type: "scale5", theme: null },
    ]},
    { topic: "Inclusive decision-making", questions: [
      { text: "Ideas and suggestions get a fair look in my team", type: "scale5", theme: "Practice" },
      { text: "I get enough chances to weigh in on the things that matter here", type: "scale5", theme: "Policy" },
      { text: "Teammates pass on everything I need to do my job properly", type: "scale5", theme: null },
      { text: "My manager keeps me posted on what matters", type: "scale5", theme: null },
    ]},
    { topic: "Fairness", questions: [
      { text: "Around me, people get equal respect whatever their background or personal characteristics", type: "scale5", theme: "Practice" },
      { text: "Doing well here earns recognition and reward", type: "scale5", theme: "Policy" },
      { text: "I get a fair deal here", type: "scale5", theme: null },
      { text: "It's clear how hiring decisions are made here", type: "scale5", theme: null },
      { text: "It's clear how pay and rewards are decided here", type: "scale5", theme: null },
      { text: "It's clear how promotions are decided here", type: "scale5", theme: null },
      { text: "I'm given fair chances to grow, both professionally and personally", type: "scale5", theme: null },
      { text: "My manager actively pushes me to grow", type: "scale5", theme: null },
    ]},
    { topic: "Diversity", questions: [
      { text: "Our managers are as diverse a group as the rest of the workforce", type: "scale5", theme: "People" },
      { text: "My manager plays an active role in building and promoting diversity within my team", type: "scale5", theme: "People" },
      { text: "Diversity is something this organisation actively celebrates", type: "scale5", theme: null },
    ]},
    { topic: "Closing", questions: [
      { text: "Which DEI topics should our HR policy prioritise? (pick the two that matter most to you)", type: "scale5", theme: null },
      { text: "Anything else you'd like to say on this?", type: "text", theme: null },
    ]},
  ],
  onb: [
    { topic: "My induction", questions: [
      { text: "My first few weeks are something I look back on fondly", type: "scale5", theme: "Early experience" },
      { text: "Everything I needed was ready to go (workspace, email access, keys)", type: "scale5", theme: null },
      { text: "I had the things that matter for my work explained well enough (processes, procedures, the in-house lingo)", type: "scale5", theme: null },
      { text: "The induction was worthwhile", type: "scale5", theme: null },
      { text: "Going through the induction was genuinely enjoyable", type: "scale5", theme: null },
      { text: "How did the amount of information you got feel?", type: "scale5", theme: null },
      { text: "Any suggestion for improving the induction?", type: "text", theme: null },
    ]},
    { topic: "My role", questions: [
      { text: "I'm clear on which tasks are mine to own", type: "scale5", theme: null },
      { text: "I'm up to speed enough to find my own feet here", type: "scale5", theme: "Onboarding readiness" },
    ]},
    { topic: "Team & colleagues", questions: [
      { text: "My team went out of its way to make me feel welcome", type: "scale5", theme: null },
      { text: "I got a proper introduction to the colleagues I'd be working with", type: "scale5", theme: null },
      { text: "I can go to colleagues with questions without hesitation", type: "scale5", theme: null },
      { text: "I get enough steer while I'm working", type: "scale5", theme: null },
    ]},
    { topic: "The organisation", questions: [
      { text: "I'm clear on what the organisation is about (its vision, mission and aims)", type: "scale5", theme: null },
      { text: "I understand how the organisation is put together (its parts and teams)", type: "scale5", theme: null },
      { text: "I've got a clear sense of the culture here (how people treat each other)", type: "scale5", theme: null },
    ]},
    { topic: "First impressions", questions: [
      { text: "We'd love your first impression of: the organisation, your tasks and responsibilities, your manager, your colleagues, and the atmosphere", type: "scale5", theme: null },
      { text: "What would you have wanted done differently here?", type: "scale5", theme: null },
    ]},
    { topic: "Closing", questions: [
      { text: "Would you point a friend towards us as a place to work?", type: "scale5", theme: null },
      { text: "Taking this job feels like the right call", type: "scale5", theme: "Job fit" },
    ]},
  ],
};

// Counts/minutes derived from the actual content above.
export const TEMPLATE_META = Object.fromEntries(Object.entries(TEMPLATE_PREVIEWS).map(([k, gs]) => {
  const count = gs.reduce((a, g) => a + g.questions.length, 0);
  return [k, { count, minutes: Math.max(3, Math.round(count * 0.5)) }];
}));

// A single template's own question set as pool-shaped objects. Ids follow the
// same scheme as surveyFromTemplate (`${templateId}-${groupIndex}-${qIndex}`),
// so a Templates-tab card and a survey built from that template share ids — a
// template reads as "active" when all of these ids are selected.
export function templatePoolQuestions(templateId) {
  const groups = TEMPLATE_PREVIEWS[templateId] || [];
  const out = [];
  groups.forEach((g, gi) => g.questions.forEach((q, qi) => {
    out.push({ id: `${templateId}-${gi}-${qi}`, topic: g.topic, theme: q.theme || null, themes: q.themes || null,
      type: q.type, bench: true, custom: false, tmplId: templateId, text: q.text, options: q.options });
  }));
  return out;
}

// The base library (Essential Insights) — the shared question bank behind every
// survey (added unselected, deduped against the template). Realistic, IP-safe
// wording from the realistic-content skill.
const EXTRA_LIBRARY = [
  { topic: "Job satisfaction", questions: [
    { text: "Day to day, I find my work enjoyable", type: "scale5", theme: "Engagement" },
  ]},
  { topic: "Tools & resources", questions: [
    { text: "I'm kitted out with the tools and systems my job calls for", type: "scale5", theme: "Job resources" },
    { text: "The information I rely on is easy to track down", type: "scale5", theme: null },
  ]},
  { topic: "Role & contribution", questions: [
    { text: "My role lets me play to my strengths", type: "scale5", theme: "Job resources" },
    { text: "I can see how my work feeds the bigger strategy", type: "scale5", theme: "Strategic alignment" },
    { text: "What I'm asked to do plays to what I'm good at", type: "scale5", theme: "Future fit" },
    { text: "How I get my work done is largely up to me", type: "scale5", theme: "Autonomy" },
    { text: "It's clear to me what I'm meant to deliver", type: "scale5", theme: "Role clarity" },
    { text: "What my role is meant to cover is clear to me", type: "scale5", theme: "Role clarity" },
  ]},
  { topic: "Workload & wellbeing", questions: [
    { text: "My job and personal life sit in healthy balance", type: "scale5", theme: null },
    { text: "My work leaves me energised", type: "scale5", theme: "Engagement" },
    { text: "How would you rate the amount on your plate?", type: "scale5", theme: null },
    { text: "The amount I'm asked to handle sits at a reasonable level", type: "scale5", theme: null },
    { text: "I manage to switch between effort and recovery well", type: "scale5", theme: null },
    { text: "Over the past year, colleagues have subjected me to unwanted behaviour (e.g. verbal abuse, physical aggression, unwanted advances, bullying, discrimination)", type: "multiple", theme: null, options: ["Never", "Sometimes", "Often"] },
  ]},
  { topic: "Working conditions", questions: [
    { text: "My physical workspace meets my needs", type: "scale5", theme: "Future fit" },
  ]},
  { topic: "Team relationships", questions: [
    { text: "In our team, we openly call out behaviour that isn't okay", type: "scale5", theme: "Team collaboration" },
    { text: "I'm comfortable raising behaviour issues directly with teammates", type: "scale5", theme: "Psychological safety" },
    { text: "Owning up to a slip-up feels safe here", type: "scale5", theme: "Psychological safety" },
  ]},
  { topic: "Team effectiveness", questions: [
    { text: "What my team is aiming for is clearly defined", type: "scale5", theme: "Role clarity" },
    { text: "My team knows how it can help the wider organisation succeed", type: "scale5", theme: null },
    { text: "Teamwork within my group works well", type: "scale5", theme: "Team collaboration" },
    { text: "My teammates spend their effort on what actually matters", type: "scale5", theme: "Team productivity" },
    { text: "People in my team own their tasks and projects", type: "scale5", theme: "Ownership" },
    { text: "My team is a regular source of good improvement ideas", type: "scale5", theme: null },
  ]},
  { topic: "Manager support", questions: [
    { text: "I trust my manager's judgement", type: "scale5", theme: null },
    { text: "Helpful feedback on my performance comes my way often", type: "scale5", theme: null },
    { text: "My manager brings out my drive at work", type: "scale5", theme: "Team leadership" },
    { text: "My manager actively pushes me to grow", type: "scale5", theme: "Team leadership" },
    { text: "My manager leads by example in our team", type: "scale5", theme: "Team leadership" },
    { text: "My manager steers us through change capably", type: "scale5", theme: null },
    { text: "My manager has my back as I work towards my goals", type: "scale5", theme: "Team leadership" },
    { text: "I'm comfortable challenging my manager on how they act", type: "scale5", theme: null },
  ]},
  { topic: "Strategy & goals", questions: [
    { text: "I'm clear on the shared goals we're chasing as an organisation", type: "scale5", theme: "Strategic alignment" },
    { text: "I'm behind where the organisation is heading", type: "scale5", theme: "Strategic alignment" },
    { text: "Where the organisation says it's going inspires me", type: "scale5", theme: "Employer quality" },
  ]},
  { topic: "Senior leadership", questions: [
    { text: "I have faith in the people running the organisation", type: "scale5", theme: null },
  ]},
  { topic: "Cross-team communication", questions: [
    { text: "Working across team boundaries tends to go smoothly here", type: "scale5", theme: null },
    { text: "Across the organisation, work is structured in a well-organised way", type: "scale5", theme: "Job resources" },
  ]},
  { topic: "Company culture", questions: [
    { text: "As an employer, this place suits me well", type: "scale5", theme: "Employer quality" },
    { text: "Being part of this organisation makes me proud", type: "scale5", theme: "Engagement" },
    { text: "This place feels like somewhere I belong", type: "scale5", theme: "Engagement" },
    { text: "The organisation makes me feel my work matters", type: "scale5", theme: "Employer quality" },
    { text: "The way things are done here is a good fit for me", type: "scale5", theme: null },
    { text: "Staff here are dealt with in an even-handed way", type: "scale5", theme: null },
    { text: "Strong results tend to pay off here", type: "scale5", theme: null },
    { text: "Good work of mine gets noticed", type: "scale5", theme: null },
  ]},
  { topic: "Belonging & fairness", questions: [
    { text: "I can show up as my real self here", type: "scale5", theme: "Inclusion" },
    { text: "People here take me as I am", type: "scale5", theme: "Inclusion" },
    { text: "Around me, people get equal respect whatever their background or personal characteristics", type: "scale5", theme: "Inclusion" },
  ]},
  { topic: "Change & transformation", questions: [
    { text: "I'm clear on how the changes here affect my role", type: "scale5", theme: "Change management" },
    { text: "When change hits, the organisation shares what's relevant promptly", type: "scale5", theme: "Change management" },
    { text: "I get the backing I need when things change", type: "scale5", theme: "Change management" },
  ]},
  { topic: "Acting on feedback", questions: [
    { text: "Staff ideas actually feed improvements here", type: "scale5", theme: "Employer quality" },
    { text: "Off the back of our feedback results, my team has actively made changes", type: "scale5", theme: null },
    { text: "Speaking up here visibly leads to things getting better", type: "scale5", theme: null },
  ]},
  { topic: "Learning & growth", questions: [
    { text: "There are plenty of ways to grow on offer here", type: "scale5", theme: null },
    { text: "Staying on here for another year or two appeals to me", type: "scale5", theme: null },
    { text: "Over the last quarter I've acted on finding a new job, or intend to shortly", type: "multiple", theme: null, options: ["No", "Yes, internally", "Yes, externally"] },
  ]},
  { topic: "eNPS", questions: [
    { text: "Would you point a friend towards us as a place to work?", type: "scale5", theme: null },
  ]},
  { topic: "Pride & highlights", questions: [
    { text: "What about the organisation gives you the most pride?", type: "scale5", theme: null },
    { text: "What's behind that pride? A short description will do", type: "text", theme: null },
  ]},
  { topic: "Improvement areas", questions: [
    { text: "Where do you think the organisation has room to do better?", type: "scale5", theme: null },
    { text: "Where could the organisation step up? Add a short note and one practical suggestion", type: "text", theme: null },
  ]},
];

// Org-required questions: a small set configured elsewhere (not in the builder)
// that must be in every survey and are auto-selected. Ids follow libraryPool's
// `lib-{gi}-{qi}` scheme; kept theme-less so they read as plain required rows.
export const REQUIRED_LIB_IDS = new Set(["lib-1-0", "lib-1-1"]);

// The shared bank as ready-to-use pool question objects (stable ids).
export function libraryPool() {
  const out = [];
  EXTRA_LIBRARY.forEach((g, gi) => g.questions.forEach((q, qi) => {
    const id = `lib-${gi}-${qi}`;
    out.push({ id, topic: g.topic, theme: q.theme || null, themes: q.themes || null, required: REQUIRED_LIB_IDS.has(id),
      type: q.type, bench: true, custom: false, text: q.text, options: q.options });
  }));
  return out;
}
