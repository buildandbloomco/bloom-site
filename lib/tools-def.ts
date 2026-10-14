/** Books & Tools: interactive tools saved in each client's portal. Shared by the browser and the server. */

export type ToolGroup = "Check-ins" | "Strategy" | "Money" | "Operations" | "People" | "Practitioners";

export interface ToolDef {
  id: string;
  name: string;
  group: ToolGroup;
  blurb: string;
  minutes: string;
  /** Starts private (only the client sees it) */
  privateByDefault?: boolean;
  /** Also available free on the public website */
  publicFree?: boolean;
}

export const TOOLS: ToolDef[] = [
  { id: "bloom-check", name: "The Bloom Check", group: "Check-ins", blurb: "Rate five areas of your business, find your growing edge, and watch it change over time.", minutes: "2 minutes", publicFree: true },
  { id: "capacity-check", name: "Capacity Check", group: "Check-ins", blurb: "A private monthly check on your body, boundaries, recovery, support, meaning, and life.", minutes: "5 minutes", privateByDefault: true },
  { id: "ninety-day", name: "90-Day Priority Planner", group: "Strategy", blurb: "One goal, three priorities, and the milestones that get you there.", minutes: "20 minutes" },
  { id: "right-yes", name: "The Right Yes Decision Filter", group: "Strategy", blurb: "Run any opportunity through six questions before you say yes.", minutes: "5 minutes" },
  { id: "ceo-review", name: "Weekly CEO Review", group: "Strategy", blurb: "A 15-minute Friday look at money, clients, team, and next week.", minutes: "15 minutes" },
  { id: "pricing", name: "Pricing & Pay Calculator", group: "Money", blurb: "See what you need to charge to pay yourself, cover costs, and set aside taxes and profit.", minutes: "10 minutes", publicFree: true },
  { id: "sop", name: "SOP Builder", group: "Operations", blurb: "Write down how a task gets done, step by step, so it can leave your head.", minutes: "15 minutes each" },
  { id: "onboarding", name: "Client Onboarding Checklist", group: "Operations", blurb: "Your steps from \"yes\" to first session, and a checklist to run for each new client.", minutes: "10 minutes" },
  { id: "roles", name: "Role Clarity Cards", group: "People", blurb: "What each person owns, decides, and hands off, so nothing falls between the cracks.", minutes: "10 minutes per role" },
  { id: "agreements", name: "Team Agreements", group: "People", blurb: "How your team communicates, meets, decides, and handles conflict, in writing.", minutes: "30 minutes" },
  { id: "conversation", name: "Conversation Planner", group: "People", blurb: "Plan a hard conversation, or build clear, kind feedback in four parts.", minutes: "10 minutes" },
  { id: "caseload", name: "Caseload & Calendar Planner", group: "Practitioners", blurb: "Set your session limits, buffers, and admin time, and see if your week really fits.", minutes: "10 minutes" },
];
export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
export const TOOL_GROUPS: ToolGroup[] = ["Check-ins", "Strategy", "Money", "Operations", "People", "Practitioners"];

/** Areas for the two check-in trackers */
export const CHECK_AREAS: Record<string, { id: string; area: string; statement: string; step: string }[]> = {
  "bloom-check": [
    { id: "money", area: "Money", statement: "I know where my money goes, and I pay myself on purpose.", step: "This week, open one separate account for taxes and move 15% of every deposit into it." },
    { id: "systems", area: "Systems", statement: "My business runs without me holding every detail in my head.", step: "Write down the one task only you know how to do. That is your first SOP." },
    { id: "people", area: "People", statement: "My team, clients, and partners know what to expect from me, and I from them.", step: "Name the conversation you have been putting off, and plan it in the Conversation Planner." },
    { id: "capacity", area: "Capacity", statement: "I end most weeks with energy left, not running on empty.", step: "Protect one 90-minute block this week that nobody can book." },
    { id: "direction", area: "Direction", statement: "I know my one priority for the next 90 days.", step: "Open the 90-Day Priority Planner and finish this sentence: \"By the end of 90 days, I will have...\"" },
  ],
  "capacity-check": [
    { id: "body", area: "Body", statement: "I sleep, eat, and move in ways that support me most days.", step: "Pick one: an earlier bedtime, a real lunch, or a 10-minute walk, every workday this week." },
    { id: "boundaries", area: "Boundaries", statement: "My work hours and caseload have clear limits that I keep.", step: "Decide your daily limit and put your last appointment time on your calendar." },
    { id: "recovery", area: "Recovery", statement: "I have time to reset between sessions and after hard days.", step: "Add 10 minutes between every session this week, and use the 4-6 breath in each one." },
    { id: "support", area: "Support", statement: "I have supervision, consultation, or peers I can talk to honestly.", step: "Reach out to one colleague or book your own appointment this week." },
    { id: "meaning", area: "Meaning", statement: "I still feel connected to why I do this work.", step: "Write down one moment from this month that reminded you why you do this." },
    { id: "life", area: "Life", statement: "I have relationships and joy outside of my work.", step: "Put one plan with someone you love on the calendar this week." },
  ],
};

/** Pricing & Pay: what revenue and rate cover pay, costs, taxes, and profit */
export interface PricingIn { pay: number; expenses: number; taxPct: number; profitPct: number; hoursPerWeek: number; weeksOff: number; billablePct: number }
export function pricingMath(p: PricingIn) {
  const set = Math.min(90, Math.max(0, (p.taxPct || 0) + (p.profitPct || 0)));
  const yearlyCosts = (p.pay || 0) + (p.expenses || 0) * 12;
  const revenue = set < 100 ? yearlyCosts / (1 - set / 100) : 0;
  const hours = Math.max(0, (p.hoursPerWeek || 0) * Math.max(0, 52 - (p.weeksOff || 0)) * ((p.billablePct || 0) / 100));
  const rate = hours ? revenue / hours : 0;
  return { revenue, monthly: revenue / 12, weekly: revenue / Math.max(1, 52 - (p.weeksOff || 0)), hours, rate, tax: revenue * (p.taxPct || 0) / 100, profit: revenue * (p.profitPct || 0) / 100 };
}

/** Caseload & Calendar: does the week fit */
export interface CaseloadIn { days: number; startHour: number; endHour: number; sessionsPerDay: number; sessionMin: number; bufferMin: number; adminHours: number; lunchMin: number; fee: number }
export function caseloadMath(c: CaseloadIn) {
  const dayMin = Math.max(0, ((c.endHour || 0) - (c.startHour || 0)) * 60);
  const sessionDay = (c.sessionsPerDay || 0) * ((c.sessionMin || 0) + (c.bufferMin || 0)) + (c.lunchMin || 0);
  const needDay = sessionDay + ((c.adminHours || 0) * 60) / Math.max(1, c.days || 1);
  const weekSessions = (c.sessionsPerDay || 0) * (c.days || 0);
  return { dayMin, needDay, spare: dayMin - needDay, fits: needDay <= dayMin, weekSessions, weekIncome: weekSessions * (c.fee || 0), adminPerSession: weekSessions ? ((c.adminHours || 0) * 60) / weekSessions : 0 };
}

export const RIGHT_YES_QS: { id: string; q: string }[] = [
  { id: "values", q: "Does this line up with my values and the work I want to be known for?" },
  { id: "priority", q: "Does it move my 90-day priority forward?" },
  { id: "capacity", q: "Do I have the time and energy for it without dropping something important?" },
  { id: "money", q: "Is the money worth it, covering my costs and my pay?" },
  { id: "tomorrow", q: "Would I still say yes if it started tomorrow?" },
  { id: "desire", q: "Am I saying yes from desire, not guilt, fear, or people-pleasing?" },
];
export function rightYesVerdict(a: Record<string, string>) {
  const vals = RIGHT_YES_QS.map((q) => a[q.id]).filter(Boolean);
  if (vals.length < RIGHT_YES_QS.length) return null;
  const score = vals.reduce((n, v) => n + (v === "yes" ? 2 : v === "some" ? 1 : 0), 0);
  if (a.desire === "no" || a.values === "no") return { label: "A right no", note: "When values or desire say no, the rest rarely makes up for it. Decline with care, and protect the space for something that fits." };
  if (score >= 10) return { label: "A right yes", note: "This fits. Say yes, and decide now what you will let go of to make room." };
  if (score >= 7) return { label: "Not yet", note: "There is something here, but not as it stands. Ask for what would make it a yes: more time, more money, or a smaller scope." };
  return { label: "A right no", note: "This is not the right yes for this season. A clear, kind no is a gift to both of you." };
}

export const ONBOARDING_DEFAULT = [
  "Send a welcome message within one business day",
  "Send the agreement and invoice",
  "Confirm the agreement is signed and the first payment received",
  "Send the intake questionnaire",
  "Schedule the first session",
  "Share the portal or shared folder",
  "Review their intake before the first session",
  "Send a reminder the day before",
  "Hold the first session and share notes",
  "Check in after two weeks: how is it going?",
];

export const AGREEMENT_PROMPTS: { id: string; title: string; prompt: string; example: string }[] = [
  { id: "communication", title: "How we communicate", prompt: "Which channel for what? What counts as urgent?", example: "Email for anything that needs a record. Text only for same-day changes. If it's urgent, call." },
  { id: "response", title: "Response times", prompt: "How quickly do we answer each other, and when are we offline?", example: "We reply within one business day. No messages expected after 6 PM or on weekends." },
  { id: "meetings", title: "Meetings", prompt: "When do we meet, and how do we make them worth it?", example: "Weekly 30-minute team meeting on Mondays. Every meeting has an agenda and ends with who does what by when." },
  { id: "decisions", title: "How decisions are made", prompt: "Who decides what? When do we decide together?", example: "Each person decides within their role card. Anything that changes pay, hours, or clients is decided with the owner." },
  { id: "conflict", title: "When we disagree", prompt: "How do we raise a concern, and how do we repair?", example: "We bring it to the person first, within a week, in private. If we're stuck, we ask a third person to help us talk." },
  { id: "wellbeing", title: "Taking care of each other", prompt: "How do we protect capacity and recover after hard days?", example: "We take our breaks. After a crisis call, anyone can ask for a 15-minute debrief. Time off is planned and covered." },
  { id: "growth", title: "Growing together", prompt: "How do we give feedback and learn?", example: "Quarterly one-on-ones about goals. Feedback is specific, kind, and shared soon after the moment." },
];

export const usd0 = (n: number) => `$${Math.round(n || 0).toLocaleString("en-US")}`;
