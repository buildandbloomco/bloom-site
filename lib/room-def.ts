/** The live strategy room: what is in it and how its pieces are named. Shared by the server and the browser. */
export type Role = "us" | "client";

/** One saved value: a text field, or an item on a board */
export interface Entry<T = unknown> { v: T; by: Role; at: number }

export type ItemKind = "win" | "idea" | "node" | "note" | "metric" | "decision" | "park";
export interface RoomItem {
  id: string;
  kind: ItemKind;
  text: string;
  by: Role;
  /** Order within its list (when it was added) */
  o: number;
  /** note: which box of which canvas, like "swot.s" */
  box?: string;
  /** idea: where it stands */
  stage?: IdeaStage;
  impact?: number;
  effort?: number;
  votes?: Partial<Record<Role, number>>;
  /** node: parent node id, "" for a main branch */
  parent?: string;
  /** metric: this session's value and last session's */
  value?: string;
  prev?: string;
  deleted?: boolean;
}

export const IDEA_STAGES = [
  { id: "new", label: "New idea" },
  { id: "existing", label: "Existing idea" },
  { id: "exploring", label: "Exploring" },
  { id: "chosen", label: "Chosen" },
  { id: "parked", label: "Parked" },
] as const;
export type IdeaStage = (typeof IDEA_STAGES)[number]["id"];

export const DEFAULT_METRICS = ["Revenue this month", "Active clients", "Leads in conversation", "Months of cash on hand", "Hours worked per week", "Energy, 1 to 10"];

export const IDEA_PROMPTS = [
  "What are clients already asking for that you don't offer?",
  "What would you do with twice the team, or twice the time?",
  "What would you stop tomorrow if you could?",
  "Where is money being left on the table?",
  "What is working that you could do more of?",
  "What would make this business easier to run, not just bigger?",
];

export interface Canvas { id: string; name: string; blurb: string; boxes: { id: string; label: string; hint: string }[] }
export const CANVASES: Canvas[] = [
  { id: "model", name: "Business model snapshot", blurb: "The whole business on one page. Fill it in fast, then look for the box that is thin.", boxes: [
    { id: "who", label: "Who we serve", hint: "Best-fit clients, and who we should stop serving" },
    { id: "offer", label: "What we offer", hint: "Offers and the result each one gets" },
    { id: "money", label: "How money comes in", hint: "Revenue streams, price points, what is most profitable" },
    { id: "reach", label: "How people find us", hint: "Referrals, content, partners, outreach" },
    { id: "deliver", label: "How we deliver", hint: "People, systems, and tools the work depends on" },
    { id: "cost", label: "What it costs", hint: "Biggest costs in money, time, and energy" },
  ] },
  { id: "swot", name: "Strengths, weaknesses, opportunities, threats", blurb: "Inside the business on top, outside it on the bottom. Be specific enough to act on.", boxes: [
    { id: "s", label: "Strengths", hint: "What we do better than most" },
    { id: "w", label: "Weaknesses", hint: "Where we are thin or exposed" },
    { id: "o", label: "Opportunities", hint: "What is opening up around us" },
    { id: "t", label: "Threats", hint: "What could hurt us from outside" },
  ] },
  { id: "levers", name: "Growth levers", blurb: "There are only a few ways to grow. Brainstorm each, then pick the one with the most room.", boxes: [
    { id: "more", label: "More clients", hint: "New audiences, channels, partners" },
    { id: "price", label: "Higher value per client", hint: "Pricing, packaging, premium tiers" },
    { id: "often", label: "Clients stay longer or buy again", hint: "Retainers, renewals, next offers" },
    { id: "lean", label: "Lower cost to deliver", hint: "Systems, delegation, templates" },
  ] },
  { id: "ssc", name: "Stop, start, continue", blurb: "The fastest way to free capacity. Stopping is as strategic as starting.", boxes: [
    { id: "stop", label: "Stop", hint: "What drains more than it returns" },
    { id: "start", label: "Start", hint: "What we keep saying we should do" },
    { id: "cont", label: "Continue", hint: "What is working and must be protected" },
  ] },
  { id: "sustain", name: "Sustain: risks and safeguards", blurb: "Growth that breaks the owner or the team is not growth. Name what could break first.", boxes: [
    { id: "break", label: "What breaks first if we grow", hint: "People, cash, quality, the owner's capacity" },
    { id: "signs", label: "Early warning signs", hint: "How we would know before it breaks" },
    { id: "guard", label: "Safeguards", hint: "What we put in place now" },
  ] },
  { id: "roots", name: "Root causes", blurb: "Slow down before solving. Get the facts, then ask why until you reach something you can change.", boxes: [
    { id: "facts", label: "What is happening", hint: "Facts only: what, how often, since when, who it affects" },
    { id: "why", label: "Why it keeps happening", hint: "Ask why, then why again, until you hit a cause you can act on" },
    { id: "tried", label: "What we have already tried", hint: "And what happened" },
    { id: "control", label: "What is in our control", hint: "Separate what we can change from what we have to work around" },
  ] },
  { id: "road", name: "90-day roadmap", blurb: "Turn the chosen ideas into a sequence. Fewer things, finished.", boxes: [
    { id: "d30", label: "Next 30 days", hint: "What must happen first" },
    { id: "d60", label: "Days 31 to 60", hint: "What builds on it" },
    { id: "d90", label: "Days 61 to 90", hint: "What it makes possible" },
  ] },
];

export const KEY_RE = /^(f|i|p):[A-Za-z0-9_.-]{1,48}$/;
export const ideaScore = (i: Pick<RoomItem, "impact" | "effort">) => (i.impact && i.effort ? Math.round((i.impact / i.effort) * 10) / 10 : null);

/* ---------- Session types: each kind of session gets its own steps and questions ---------- */
export type TabId = "since" | "checkin" | "focus" | "roots" | "ideas" | "map" | "evaluate" | "canvas" | "plan" | "decide" | "recap";
export type SessionType = "kickoff" | "checkin" | "deepdive" | "plan90";
export interface TypeDef {
  id: SessionType;
  name: string;
  short: string;
  blurb: string;
  steps: { id: TabId; label: string; title?: string; ask?: string }[];
  /** Which canvases show on the Canvases step */
  canvases: string[];
}

export const SESSION_TYPES: TypeDef[] = [
  {
    id: "kickoff", name: "Kickoff and discovery", short: "Kickoff",
    blurb: "Get to know the business as it really is, and agree on what success looks like.",
    canvases: ["model", "swot"],
    steps: [
      { id: "since", label: "Starting point", title: "Starting point: what we already know" },
      { id: "focus", label: "What you want", title: "What you want from this work", ask: "A year from now, what would make you say this was worth it? What would be different for you, day to day?" },
      { id: "canvas", label: "Snapshot", title: "The business today" },
      { id: "checkin", label: "Scorecard", title: "Scorecard: the numbers we will watch", ask: "Which few numbers tell us, every time we meet, whether the business is getting healthier? Fill in where they stand today." },
      { id: "map", label: "Mind map" },
      { id: "decide", label: "Decisions" },
      { id: "plan", label: "First steps", title: "First steps", ask: "What is one thing each of us does before we meet again?" },
      { id: "recap", label: "Recap" },
    ],
  },
  {
    id: "checkin", name: "Progress check-in", short: "Check-in",
    blurb: "Look at what moved, clear what is stuck, and adjust the plan.",
    canvases: ["ssc", "sustain"],
    steps: [
      { id: "since", label: "Since last time" },
      { id: "checkin", label: "Wins and numbers", ask: "What moved since we last met? What is heavier than it should be right now?" },
      { id: "focus", label: "Today's focus", title: "Today's focus: what needs us most", ask: "Of everything on the Since last time screen, what would make the biggest difference if we cleared it today?" },
      { id: "plan", label: "Adjust the plan", title: "Adjust the plan and actions", ask: "What do we keep, change, or drop? What is the next step, and whose is it?" },
      { id: "decide", label: "Decisions" },
      { id: "recap", label: "Recap" },
    ],
  },
  {
    id: "deepdive", name: "Deep dive on one problem", short: "Deep dive",
    blurb: "One question, all session: find the real cause, weigh the options, and decide.",
    canvases: [],
    steps: [
      { id: "since", label: "Since last time" },
      { id: "focus", label: "The problem", title: "The problem, in one sentence", ask: "What exactly is the problem? Say it in one sentence, and say what it is costing you in money, time, or energy." },
      { id: "roots", label: "Root causes" },
      { id: "ideas", label: "Options", title: "Options: every way we could solve it", ask: "" },
      { id: "evaluate", label: "Weigh options", title: "Weigh the options" },
      { id: "decide", label: "Decision", title: "The decision", ask: "What are we doing about it? Say it in one sentence, so nobody leaves with a different version." },
      { id: "plan", label: "Actions", title: "Actions", ask: "What is the very first step, and whose is it? When will we know if it is working?" },
      { id: "recap", label: "Recap" },
    ],
  },
  {
    id: "plan90", name: "90-day planning or reset", short: "90-day plan",
    blurb: "Step back, choose what matters most for the next 90 days, and build the roadmap.",
    canvases: ["levers", "ssc", "sustain"],
    steps: [
      { id: "since", label: "Since last time" },
      { id: "checkin", label: "Where we stand" },
      { id: "ideas", label: "Brainstorm" },
      { id: "map", label: "Mind map" },
      { id: "evaluate", label: "Evaluate" },
      { id: "canvas", label: "Canvases" },
      { id: "plan", label: "Roadmap" },
      { id: "decide", label: "Decisions" },
      { id: "recap", label: "Recap" },
    ],
  },
];
/** Old sessions from before session types: every step, so nothing written there is hidden */
export const FULL_STEPS: TypeDef["steps"] = [
  { id: "checkin", label: "Check-in" }, { id: "focus", label: "Focus" }, { id: "ideas", label: "Brainstorm" }, { id: "map", label: "Mind map" },
  { id: "evaluate", label: "Evaluate" }, { id: "canvas", label: "Canvases" }, { id: "plan", label: "Roadmap" }, { id: "decide", label: "Decisions" }, { id: "recap", label: "Recap" },
];
export const typeDef = (id: string) => SESSION_TYPES.find((t) => t.id === id);

/** What the room shows on "Since last time": built fresh from the client's history for each session */
export interface Brief {
  prev: { title: string; date: string; type: string } | null;
  done: string[];
  open: { title: string; owner: Role; due: string; overdue: boolean }[];
  decisions: string[];
  parked: string[];
  nextFocus: string;
  moves: { name: string; from: string; to: string; dir: "up" | "down" | "same" }[];
  bloom: { date: string; lowest: string; step: string; avg: number; prevAvg: number | null } | null;
  backlog: { text: string; stage: string }[];
  suggestions: string[];
  daysSince: number | null;
}
