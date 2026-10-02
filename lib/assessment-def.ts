/** The Organizational Wellness Assessment: domains, statements, scoring. Safe to use in the browser. */

export interface Domain {
  id: string;
  name: string;
  blurb: string;
  items: string[];
  /** What tends to help when this area scores low. Service ids from Admin > Services, and Wellness Library collections. */
  helps: { services: string[]; wellness: string };
}

export const DOMAINS: Domain[] = [
  {
    id: "workload", name: "Workload & Capacity", blurb: "Whether the amount of work fits the people and hours available.",
    items: [
      "My workload is manageable within my scheduled hours.",
      "I can finish my work without regularly skipping breaks or staying late.",
      "Assignments and caseloads are shared fairly across the team.",
      "When demands go up, we adjust priorities instead of just adding more.",
    ],
    helps: { services: ["strategy", "operations"], wellness: "reading" },
  },
  {
    id: "recovery", name: "Recovery & Scheduling", blurb: "Whether schedules leave room to recover from demanding work.",
    items: [
      "My schedule includes time to recover between demanding tasks.",
      "I can take time off without falling far behind.",
      "I rarely feel pressure to respond to work outside my working hours.",
      "Our scheduling considers how emotionally demanding the work is.",
    ],
    helps: { services: ["masterclass", "operations"], wellness: "soundscape" },
  },
  {
    id: "support", name: "Support & Supervision", blurb: "Whether people get consistent support, especially after hard days.",
    items: [
      "I have regular, useful supervision or check-ins.",
      "After a difficult day or situation, there is a clear way to get support.",
      "I know where to go when I'm struggling at work.",
      "My supervisor responds well when I raise concerns.",
    ],
    helps: { services: ["masterclass", "workshops"], wellness: "tool" },
  },
  {
    id: "clarity", name: "Role Clarity & Workflows", blurb: "Whether roles, processes, and tools make the work easier.",
    items: [
      "I clearly understand what is expected of me.",
      "Our processes and workflows are written down and easy to follow.",
      "I spend little time on unnecessary admin or duplicated work.",
      "I have the tools and systems I need to do my job well.",
    ],
    helps: { services: ["operations", "strategy"], wellness: "" },
  },
  {
    id: "safety", name: "Psychological Safety & Belonging", blurb: "Whether people can speak up and be fully themselves.",
    items: [
      "I can speak up about problems or mistakes without fear.",
      "I feel respected for who I am, including my identity and culture.",
      "Different perspectives are welcomed on our team.",
      "I can be myself at work without shrinking or code-switching to fit in.",
    ],
    helps: { services: ["masterclass", "workshops"], wellness: "team" },
  },
  {
    id: "leadership", name: "Leadership & Communication", blurb: "Whether decisions and changes are shared clearly and fairly.",
    items: [
      "I understand the reasons behind major decisions.",
      "Leadership shares changes early and clearly.",
      "My input is asked for and used in decisions that affect my work.",
      "Leadership models healthy boundaries and well-being.",
    ],
    helps: { services: ["strategy", "workshops"], wellness: "team" },
  },
  {
    id: "purpose", name: "Purpose & Growth", blurb: "Whether the work feels meaningful and there's room to grow.",
    items: [
      "My work feels meaningful to me.",
      "I see a path to grow here.",
      "My contributions are recognized.",
      "I can picture myself working here a year from now and feeling well.",
    ],
    helps: { services: ["workshops", "strategy"], wellness: "journal" },
  },
];

export const SCALE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
export const ITEM_COUNT = DOMAINS.reduce((n, d) => n + d.items.length, 0);
export const itemKey = (d: string, i: number) => `${d}.${i}`;

export const ROLE_GROUPS = ["Direct service or client-facing", "Administrative or operations", "Supervisor or manager", "Intern, trainee, or volunteer", "Prefer not to say"];

export const POLICIES = [
  "Written protocol for hard days or critical incidents",
  "Regular clinical or reflective supervision",
  "Caseload or workload limits",
  "Paid time off that people actually use",
  "Flexible or adjustable scheduling",
  "Employee assistance program (EAP) or counseling benefit",
  "Written onboarding and role descriptions",
  "Documented workflows for core processes",
  "Regular team check-ins or huddles",
  "Wellness stipend or professional development budget",
];

export const OPEN_QUESTIONS = [
  "What is one change that would make your work more sustainable?",
  "What should leadership keep doing because it's working?",
];

/** Average 1 to 5 answers into a 0 to 100 score */
export function toScore(values: number[]) {
  const v = values.filter((x) => x >= 1 && x <= 5);
  if (!v.length) return null;
  const avg = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.round(((avg - 1) / 4) * 100);
}

export function domainScores(answerSets: Record<string, number>[]) {
  return DOMAINS.map((d) => {
    const vals: number[] = [];
    for (const a of answerSets) d.items.forEach((_, i) => { const x = a[itemKey(d.id, i)]; if (x) vals.push(x); });
    return { id: d.id, name: d.name, score: toScore(vals), n: vals.length };
  });
}

export function band(score: number | null) {
  if (score === null) return { label: "No data yet", cls: "" };
  if (score >= 70) return { label: "Strength", cls: "green" };
  if (score >= 50) return { label: "Mixed", cls: "gold" };
  return { label: "Needs attention", cls: "rust" };
}

/** Role-group breakdowns only show with at least this many answers, to protect anonymity */
export const MIN_GROUP = 3;

/** Operations snapshot: the facts behind the scores. The leader fills these in. */
export const OPS_FIELDS = [
  { key: "opsWorkload", label: "Workload by role", hint: "caseload, clients, or projects a full-time person in each role carries, and what you consider full" },
  { key: "opsHours", label: "Typical hours", hint: "scheduled hours per week by role, plus the evening, weekend, or unpaid time the work really takes (notes, admin, on-call)" },
  { key: "opsScheduling", label: "How scheduling works", hint: "who builds the schedule, how far ahead, how back-to-back the days run, and where breaks and admin time fit" },
  { key: "opsCoverage", label: "Time off and coverage", hint: "what happens to the work when someone is out, sick, or leaves" },
  { key: "opsWorkflows", label: "Workflows that cause the most friction", hint: "name up to three, for example intake, documentation, billing, referrals, handoffs. Say where each one gets stuck" },
  { key: "opsTools", label: "Tools you run on", hint: "scheduling, records, communication, and task tools, and anything people work around" },
] as const;
export type OpsKey = (typeof OPS_FIELDS)[number]["key"];

export const PRIORITIES = [
  { id: "now", label: "Now", hint: "next 30 days" },
  { id: "next", label: "Next", hint: "30 to 90 days" },
  { id: "later", label: "Later", hint: "after 90 days" },
] as const;
export type Priority = (typeof PRIORITIES)[number]["id"];
export const priorityRank = (p: string) => Math.max(0, PRIORITIES.findIndex((x) => x.id === p));
