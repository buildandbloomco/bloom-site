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
  { id: "road", name: "90-day roadmap", blurb: "Turn the chosen ideas into a sequence. Fewer things, finished.", boxes: [
    { id: "d30", label: "Next 30 days", hint: "What must happen first" },
    { id: "d60", label: "Days 31 to 60", hint: "What builds on it" },
    { id: "d90", label: "Days 61 to 90", hint: "What it makes possible" },
  ] },
];

export const KEY_RE = /^(f|i|p):[A-Za-z0-9_.-]{1,48}$/;
export const ideaScore = (i: Pick<RoomItem, "impact" | "effort">) => (i.impact && i.effort ? Math.round((i.impact / i.effort) * 10) / 10 : null);
