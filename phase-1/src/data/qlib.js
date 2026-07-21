// qlib.js — per-template preview content.
// IMPORTANT: these are ORIGINAL, illustrative sample questions written for this
// prototype. They are intentionally generic and are NOT Effectory's proprietary
// validated question wording — do not paste real library items in here.
// Shape: { [templateId]: [{ topic, questions: [{ text, type, theme }] }] }

const Q = (text, type = "scale5", theme = null, options) => ({ text, type, theme, ...(options ? { options } : {}) });

export const TEMPLATE_PREVIEWS = {
  sos: [
    { topic: "Job satisfaction", questions: [
      Q("Overall, I enjoy the work I do day to day.", "scale5", "Engagement"),
      Q("My work gives me a sense of purpose.", "scale5", "Engagement"),
      Q("I would describe myself as happy in my current role."),
      Q("The work I do makes good use of my strengths."),
      Q("I rarely find myself thinking about leaving."),
      Q("How would you rate your overall job satisfaction?"),
    ]},
    { topic: "Role & enablement", questions: [
      Q("It is clear to me what is expected in my role.", "scale5", "Role clarity"),
      Q("I understand how my work supports our wider goals.", "scale5", "Role clarity"),
      Q("I have the tools and resources to do my job well."),
      Q("I'm able to make decisions within my area of work."),
      Q("Our day-to-day processes help rather than hinder me."),
    ]},
    { topic: "My manager", questions: [
      Q("My manager treats me with respect.", "scale5", "Leadership"),
      Q("I receive helpful feedback from my manager.", "scale5", "Leadership"),
      Q("My manager supports my growth and development.", "scale5", "Leadership"),
      Q("I can raise concerns with my manager openly."),
      Q("My manager notices and recognises good work."),
    ]},
    { topic: "Collaboration", questions: [
      Q("People in my team help each other out."),
      Q("Information is shared openly across teams."),
      Q("We handle disagreements in a constructive way."),
      Q("Other departments are easy to work with."),
      Q("How often do you collaborate with other teams?", "multiple", null, ["Rarely", "A few times a month", "Weekly", "Most days", "Constantly"]),
    ]},
    { topic: "Wellbeing & workload", questions: [
      Q("I can keep a healthy balance between work and personal life.", "scale5", "Wellbeing"),
      Q("My workload is manageable most weeks.", "scale5", "Wellbeing"),
      Q("I feel energised by my work more often than drained.", "scale5", "Wellbeing"),
      Q("I feel comfortable taking time off when I need it."),
      Q("Stress at work stays at a level I can handle."),
    ]},
    { topic: "Commitment", questions: [
      Q("I'm proud to tell people where I work.", "scale5", "Engagement"),
      Q("I would recommend this organisation as a place to work.", "scale5", "Engagement"),
      Q("I can see myself still working here in two years."),
      Q("I'm willing to put in extra effort when it's needed."),
    ]},
  ],

  tds: [
    { topic: "Team goals", questions: [
      Q("Our team has clear, shared goals.", "scale5", "Team effectiveness"),
      Q("Everyone understands what we're working towards."),
      Q("We regularly review our progress as a team."),
      Q("Priorities in our team are clear to me."),
      Q("We adjust our plans well when circumstances change."),
    ]},
    { topic: "Communication", questions: [
      Q("Communication within our team is open and honest."),
      Q("I get the information I need from teammates in time."),
      Q("Our meetings are a good use of time."),
      Q("We give each other timely feedback."),
      Q("It's easy to ask teammates for help."),
    ]},
    { topic: "Collaboration", questions: [
      Q("We trust each other to deliver on commitments.", "scale5", "Team collaboration"),
      Q("Workload is shared fairly across the team.", "scale5", "Team collaboration"),
      Q("We make decisions together when it matters.", "scale5", "Team collaboration"),
      Q("Different perspectives are welcomed in our team."),
      Q("We celebrate our successes together."),
    ]},
    { topic: "Ways of working", questions: [
      Q("Our processes help us work efficiently."),
      Q("Roles and responsibilities are clear within the team."),
      Q("We learn from mistakes rather than assign blame."),
      Q("We keep looking for ways to improve."),
      Q("What gets in the way of our team performing at its best?", "text"),
    ]},
    { topic: "Effectiveness", questions: [
      Q("Our team consistently delivers quality work.", "scale5", "Team effectiveness"),
      Q("We meet the goals we set for ourselves.", "scale5", "Team effectiveness"),
      Q("Our team adapts well to new challenges."),
      Q("I'm proud of what our team achieves."),
    ]},
  ],

  sfm: [
    { topic: "Direction & strategy", questions: [
      Q("I understand the direction the organisation is heading.", "scale5", "Strategic alignment"),
      Q("Our strategy is communicated clearly.", "scale5", "Strategic alignment"),
      Q("I can see how my work connects to the bigger picture.", "scale5", "Strategic alignment"),
      Q("Leaders make decisions that fit our long-term goals."),
      Q("Changes are explained in a way that makes sense."),
    ]},
    { topic: "Ability to perform", questions: [
      Q("I have what I need to perform well in my role."),
      Q("Obstacles to doing good work get dealt with quickly."),
      Q("I have enough autonomy to do my job effectively."),
      Q("Skills and talents are used well across the organisation."),
      Q("We have the right capabilities to reach our goals."),
      Q("Decisions are made at the right level."),
    ]},
    { topic: "Motivation", questions: [
      Q("I feel motivated to give my best at work.", "scale5", "Engagement"),
      Q("I care about the future of this organisation.", "scale5", "Engagement"),
      Q("My work gives me energy.", "scale5", "Engagement"),
      Q("I feel valued for the contribution I make."),
      Q("I feel a strong sense of ownership over my work."),
    ]},
    { topic: "Agility", questions: [
      Q("We respond quickly to changes around us."),
      Q("New ideas are encouraged and tried out."),
      Q("We're willing to change how we work when needed."),
      Q("The organisation learns from what doesn't work."),
      Q("Bureaucracy rarely slows us down."),
    ]},
  ],

  wcwp: [
    { topic: "Employership", questions: [
      Q("This is a great place to work.", "scale5", "Employership"),
      Q("I would happily refer a friend to work here.", "scale5", "Employership"),
      Q("The organisation lives up to the promises it makes to staff.", "scale5", "Employership"),
      Q("I feel genuinely supported by the organisation."),
      Q("I trust the organisation to treat people fairly."),
    ]},
    { topic: "Pride & advocacy", questions: [
      Q("I'm proud to be part of this organisation.", "scale5", "Engagement"),
      Q("I speak positively about my employer to others.", "scale5", "Engagement"),
      Q("I feel a strong connection to what we do here."),
      Q("My values align well with the organisation's values."),
    ]},
    { topic: "Trust in leadership", questions: [
      Q("I trust the decisions made by senior leadership.", "scale5", "Leadership"),
      Q("Leadership communicates openly about important matters.", "scale5", "Leadership"),
      Q("Leaders act in line with our stated values.", "scale5", "Leadership"),
      Q("I have confidence in the direction leadership has set."),
      Q("Senior leaders are visible and approachable."),
    ]},
    { topic: "Growth", questions: [
      Q("I have good opportunities to grow here."),
      Q("I'm encouraged to develop new skills."),
      Q("There is a clear path for my development."),
      Q("I get the training I need to do my job well."),
    ]},
  ],

  dei: [
    { topic: "Belonging", questions: [
      Q("I feel I belong at this organisation.", "scale5", "Inclusion"),
      Q("I can be myself at work.", "scale5", "Inclusion"),
      Q("I feel accepted by the people I work with.", "scale5", "Inclusion"),
      Q("People here are valued for who they are."),
      Q("I feel included in team decisions and activities."),
    ]},
    { topic: "Fair treatment", questions: [
      Q("Everyone has a fair chance to progress here."),
      Q("Pay and rewards are decided fairly."),
      Q("People are treated equally regardless of background."),
      Q("Opportunities are given based on merit."),
      Q("Our policies support fair treatment for all."),
    ]},
    { topic: "Voice & safety", questions: [
      Q("I feel safe to speak up with my opinions.", "scale5", "Psychological safety"),
      Q("I can raise concerns without fear of negative consequences.", "scale5", "Psychological safety"),
      Q("Mistakes are treated as a chance to learn.", "scale5", "Psychological safety"),
      Q("My ideas are taken seriously."),
      Q("Different viewpoints are respected here."),
    ]},
    { topic: "Representation", questions: [
      Q("Leadership reflects the diversity of our people."),
      Q("I see people like me represented at senior levels."),
      Q("The organisation is genuinely committed to inclusion."),
      Q("We talk openly about inclusion at work."),
      Q("How included do you feel day to day?", "multiple", null, ["Not at all", "Slightly", "Moderately", "Mostly", "Fully"]),
    ]},
  ],

  onb: [
    { topic: "First impressions", questions: [
      Q("I felt welcome when I first joined.", "scale5", "Onboarding"),
      Q("I quickly felt like part of the team.", "scale5", "Onboarding"),
      Q("My first days were well organised.", "scale5", "Onboarding"),
      Q("I knew who to turn to with questions when I started."),
      Q("The role matched what I was told during hiring."),
    ]},
    { topic: "Role clarity", questions: [
      Q("I understood what was expected of me early on.", "scale5", "Role clarity"),
      Q("My responsibilities were explained clearly.", "scale5", "Role clarity"),
      Q("I knew how my success would be measured."),
      Q("I understood how my role fits into the team."),
      Q("Goals for my first months were clear."),
    ]},
    { topic: "Tools & access", questions: [
      Q("I had the equipment I needed from day one."),
      Q("I got access to the systems I needed quickly."),
      Q("I had a suitable place to do my work."),
      Q("Getting set up was a smooth experience."),
      Q("I had the information I needed to get started."),
    ]},
    { topic: "Learning & growth", questions: [
      Q("I received enough training to start contributing."),
      Q("I was given time to learn in my first weeks."),
      Q("I understood the development opportunities available."),
      Q("I felt encouraged to ask questions while learning."),
      Q("I knew where to find resources to learn on my own."),
    ]},
    { topic: "Manager support", questions: [
      Q("My manager checked in with me regularly at first.", "scale5", "Leadership"),
      Q("My manager set me up for success.", "scale5", "Leadership"),
      Q("I received useful feedback early in my role."),
      Q("I felt supported by my manager during onboarding."),
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
    out.push({ id: `${templateId}-${gi}-${qi}`, topic: g.topic, theme: q.theme || null,
      type: q.type, bench: true, custom: false, tmplId: templateId, text: q.text, options: q.options });
  }));
  return out;
}

// A broad shared question bank — the rest of the "library" beyond any single
// template. Added (unselected) to every survey's pool so there's a realistic
// amount to choose from in Add questions. Original, generic wording only.
const EXTRA_LIBRARY = [
  { topic: "Engagement & motivation", questions: [
    Q("I feel motivated to do my best work.", "scale5", "Engagement"),
    Q("I look forward to coming to work most days.", "scale5", "Engagement"),
    Q("I find my work genuinely interesting."),
    Q("I feel a strong personal commitment to my work."),
    Q("Time tends to fly when I'm working."),
    Q("I feel inspired by the goals we're working towards."),
  ]},
  { topic: "Leadership & management", questions: [
    Q("My manager is someone I can rely on.", "scale5", "Leadership"),
    Q("Leaders here listen to what employees have to say.", "scale5", "Leadership"),
    Q("My manager helps remove obstacles in my way."),
    Q("I trust my manager to act in the team's interest."),
    Q("Leadership sets a good example through their actions."),
    Q("Decisions from leadership are communicated in good time."),
  ]},
  { topic: "Collaboration & teamwork", questions: [
    Q("My team works well together.", "scale5", "Collaboration"),
    Q("People here are willing to share knowledge.", "scale5", "Collaboration"),
    Q("We can count on each other to follow through."),
    Q("Cross-team cooperation works smoothly."),
    Q("Conflicts get resolved in a healthy way."),
    Q("I feel comfortable asking colleagues for help."),
  ]},
  { topic: "Communication", questions: [
    Q("Important information reaches me in good time."),
    Q("I understand the reasons behind major decisions."),
    Q("Communication flows well between teams."),
    Q("I know where to find the information I need."),
    Q("Feedback flows in both directions here."),
  ]},
  { topic: "Wellbeing & balance", questions: [
    Q("I can switch off from work in my free time.", "scale5", "Wellbeing"),
    Q("My job allows for a reasonable work-life balance.", "scale5", "Wellbeing"),
    Q("I feel my wellbeing matters to the organisation.", "scale5", "Wellbeing"),
    Q("I can take breaks when I need them."),
    Q("I rarely feel overwhelmed by my work."),
    Q("Support is available if I'm struggling."),
  ]},
  { topic: "Workload & resources", questions: [
    Q("The amount of work I'm given is reasonable."),
    Q("I have enough time to do my work properly."),
    Q("Deadlines here are realistic."),
    Q("I have the equipment I need to work effectively."),
    Q("Staffing levels in my team are about right."),
  ]},
  { topic: "Growth & development", questions: [
    Q("I have opportunities to learn and grow here.", "scale5", "Development"),
    Q("I can develop the skills that matter for my career.", "scale5", "Development"),
    Q("My development is taken seriously."),
    Q("I receive useful coaching or mentoring."),
    Q("There are clear opportunities to advance."),
    Q("I'm encouraged to take on new challenges."),
  ]},
  { topic: "Recognition & reward", questions: [
    Q("Good work is recognised here."),
    Q("I feel appreciated for my contributions."),
    Q("Recognition is given fairly."),
    Q("My pay is fair for the work I do."),
    Q("The benefits on offer meet my needs."),
  ]},
  { topic: "Autonomy & empowerment", questions: [
    Q("I have freedom in how I do my work."),
    Q("I'm trusted to make decisions in my role."),
    Q("I'm encouraged to use my own judgement."),
    Q("I can influence things that affect my work."),
    Q("Micromanagement is rare here."),
  ]},
  { topic: "Strategy & direction", questions: [
    Q("I understand the organisation's priorities.", "scale5", "Strategic alignment"),
    Q("Our goals are clear and well communicated.", "scale5", "Strategic alignment"),
    Q("I believe in the direction we're taking."),
    Q("My day-to-day work aligns with our strategy."),
    Q("I'm confident about the organisation's future."),
  ]},
  { topic: "Inclusion & belonging", questions: [
    Q("I feel respected for who I am.", "scale5", "Inclusion"),
    Q("Everyone here has a voice.", "scale5", "Inclusion"),
    Q("Differences are valued in my team."),
    Q("I feel a sense of belonging at work."),
    Q("People are treated fairly regardless of background."),
  ]},
  { topic: "Customer & quality focus", questions: [
    Q("We keep the customer in mind in what we do."),
    Q("Quality is a priority in my team."),
    Q("We act on the feedback we receive."),
    Q("I'm empowered to do what's right for the customer."),
    Q("We take pride in the quality of our work."),
  ]},
  { topic: "Change & innovation", questions: [
    Q("New ideas are welcomed here."),
    Q("We adapt well to change."),
    Q("I feel comfortable suggesting improvements."),
    Q("We're willing to try new ways of working."),
    Q("Change is managed well in my team."),
  ]},
  { topic: "Trust & integrity", questions: [
    Q("People here act with integrity."),
    Q("I can trust what I'm told by the organisation."),
    Q("Promises made to employees are kept."),
    Q("There's a high level of trust in my team."),
    Q("Ethical concerns are taken seriously."),
  ]},
];

// The shared bank as ready-to-use pool question objects (stable ids).
export function libraryPool() {
  const out = [];
  EXTRA_LIBRARY.forEach((g, gi) => g.questions.forEach((q, qi) => {
    out.push({ id: `lib-${gi}-${qi}`, topic: g.topic, theme: q.theme || null,
      type: q.type, bench: true, custom: false, text: q.text, options: q.options });
  }));
  return out;
}
