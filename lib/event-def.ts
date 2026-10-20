/** Private, code-gated offer pages for live events (a mastermind, a conference, a workshop room).
 *  Shared by the browser and the server. Edited in admin under Event offers; these are the starting values.
 *  The room code lives only on the server (lib/events.ts). */

export interface EventTier {
  id: string;
  name: string;
  /** One line under the name */
  tagline: string;
  price: number;
  /** A lower "decide today" price that ends at a set moment (ISO), then the regular event price applies */
  early?: { price: number; until: string };
  /** Your usual price, shown crossed out. Leave out when there is no usual price. */
  was?: number;
  includes: string[];
  /** Catalog services this becomes in their portal and agreement */
  serviceIds: string[];
  /** Optional smaller first payment that holds the event price */
  deposit?: number;
  depositNote?: string;
  /** Highlight this one */
  featured?: boolean;
  /** Needs a signed agreement (sessions and packages do; a digital kit does not) */
  agreement: boolean;
  /** What happens right after they pay, shown on the welcome page */
  next: string[];
  /** false = hidden from guests */
  active?: boolean;
  /** Limited spots. Offers that share a pool name share the same spots, even across events. */
  spots?: number;
  pool?: string;
  /** Guests can only reserve with the deposit (the full price is settled later, in their portal) */
  depositOnly?: boolean;
  /** Show the price as "From $X" */
  fromPrice?: boolean;
  /** Turn on the build workspace in their portal, for this kind of build */
  build?: "systems-landing" | "systems-portal" | "systems-hub";
}

export interface EventOffer {
  slug: string;
  /** Shown to guests, e.g. "the Mastermind" */
  name: string;
  /** The offer closes at this moment (ISO with offset) */
  endsAt: string;
  intro: string;
  tiers: EventTier[];
  /** false = the page shows as closed */
  active?: boolean;
  /** Open to the public: no room code, listed on the Workshops page */
  open?: boolean;
  /** Big headline on the page (default: "Leave empowered, with a next step.") */
  headline?: string;
  /** When and where, e.g. "Saturday, Nov 14 · 11 AM to 12:30 PM ET · Live on Zoom" */
  details?: string;
}

const PORTAL = "Your own private Build & Bloom portal with Money: budget, income buckets you drag and drop, team pay, and tax dates";
const BOOKS = "Every Build & Bloom guidebook, including the new Pour From Wholeness practitioner wellness guide";
const TOOLSLINE = "Books & Tools: 12 interactive tools, from a Pricing & Pay Calculator to a 90-Day Priority Planner";


const SYSTEMS = (endsNote: string): EventTier => ({
  id: "systems",
  active: false,
  name: "The Bloom Systems Build",
  tagline: "Your portal, operations, and SOPs, built for you.",
  price: 4997,
  was: 6400,
  fromPrice: true,
  includes: [
    "Portal + SOPs, $4,997 (usually $6,400): your own proposal and payment portal, plus SOP & Systems Documentation",
    "Full Operations Hub + SOPs, $7,997 (usually $11,975): the complete hub, SOP & Systems Documentation, and 3 months of the Systems Care Plan",
    "We choose the right build together in your consult",
    "Your $1,500 deposit holds your spot and this price, and counts toward your build",
    "You own everything, on accounts in your name. Running costs are about $40 a month, paid directly to Vercel and Claude",
  ],
  serviceIds: ["systems-portal", "addon-sops"],
  deposit: 1500,
  depositOnly: true,
  depositNote: `Reserves your build spot and ${endsNote} price. We confirm Portal or Full Hub at your consult, and the balance is paid in your portal.`,
  spots: 5,
  pool: "systems-builds-2026",
  build: "systems-portal",
  agreement: true,
  next: ["Sign your service agreement at the top of your portal.", "Book your build consult from your portal. We'll confirm Portal or Full Hub together.", "Start your build questionnaire under \"Your build\". It saves as you go."],
});

const VIP_SYSTEMS = (endsNote: string): EventTier => ({
  id: "vip-systems",
  name: "VIP + Systems Bundle",
  tagline: "The VIP Bloom Plan and your Systems Build together, plus a bonus session.",
  price: 5497,
  was: 8800,
  fromPrice: true,
  featured: true,
  includes: [
    "Everything in the VIP Bloom Plan: three strategy sessions, a 90-day plan, a Money Setup Session, and VIP scheduling",
    "The Bloom Systems Build: Portal + SOPs at $5,497 for the bundle, or Full Operations Hub + SOPs at $8,497",
    "Bonus: a fourth strategy session to launch your new system with your team (a $350 value)",
    "Less than buying them separately, even at today's VIP price",
    "Your $1,500 deposit holds your spot and this price, and counts toward your bundle",
  ],
  serviceIds: ["strategy", "addon-money-setup", "systems-portal", "addon-sops", "addon-intensive"],
  deposit: 1500,
  depositOnly: true,
  depositNote: `Reserves your build spot and ${endsNote} bundle price. We confirm Portal or Full Hub at your consult, and the balance is paid in your portal.`,
  spots: 5,
  pool: "systems-builds-2026",
  build: "systems-portal",
  agreement: true,
  next: ["Sign your service agreement at the top of your portal.", "Book your first strategy session from your portal. VIP clients get a session within 7 days.", "Start your build questionnaire under \"Your build\". It saves as you go."],
});

export const DEFAULT_EVENTS: EventOffer[] = [
  {
    slug: "create",
    name: "C.R.E.A.T.E.",
    endsAt: "2026-10-18T23:59:00-04:00",
    intro: "You came to C.R.E.A.T.E. to connect, restore, and leave empowered. These offers are for the people in this room, only through Sunday night, so the momentum from this weekend has somewhere to go.",
    tiers: [
      {
        id: "seed",
        active: false,
        name: "Bloom Books Bundle",
        tagline: "Start on your own, today.",
        price: 37,
        includes: ["Pour From Wholeness, the practitioner wellness guide, only available to clients", TOOLSLINE, PORTAL, "Bonus: the full Build & Bloom guidebook collection"],
        serviceIds: [],
        agreement: false,
        next: ["Open your portal and find your books under Books & Tools.", "Then open Money and start with \"How to use Money\"."],
      },
      {
        id: "sprout",
        name: "Strategy Intensive + Books",
        tagline: "One focused session on what is stuck, plus the full guidebook collection.",
        price: 297,
        was: 350,
        includes: ["A 90-minute one-on-one working session on your top priority", "A written action plan in your portal, with next steps you can actually do", BOOKS, TOOLSLINE, PORTAL],
        serviceIds: ["addon-intensive"],
        agreement: true,
        next: ["Sign your short service agreement at the top of your portal.", "Book your Strategy Intensive from your portal. Use it within 30 days.", "Your books are in your portal under Books & Tools."],
      },
      {
        id: "bloom",
        name: "VIP Bloom Plan",
        tagline: "Strategy, structure, and support for the next 90 days.",
        price: 1397,
        early: { price: 997, until: "2026-10-17T23:59:00-04:00" },
        was: 2400,
        includes: ["Three strategy sessions and a 90-day plan built with you in your portal", "Bonus: a Money Setup Session to organize your finances together (a $350 value)", "VIP scheduling: your first session within 7 days", "Email support between sessions", BOOKS, TOOLSLINE, PORTAL],
        serviceIds: ["strategy", "addon-money-setup"],
        deposit: 500,
        depositNote: "Hold your C.R.E.A.T.E. price with $500 today. The balance is due before your first session, in your portal.",
        agreement: true,
        next: ["Sign your service agreement at the top of your portal.", "Book your first strategy session from your portal. VIP clients get a session within 7 days.", "Pay any remaining balance in your portal before that session."],
      },
      SYSTEMS("your C.R.E.A.T.E."),
      VIP_SYSTEMS("your C.R.E.A.T.E."),
    ],
  },
];

// The October 26 mastermind: same offers, its own dates. Off until you add its name and dates in admin.
{
  const c = DEFAULT_EVENTS[0];
  DEFAULT_EVENTS.push({
    slug: "oct26",
    name: "the October 26 mastermind",
    endsAt: "2026-10-28T23:59:00-04:00",
    intro: "These offers are for the people in this room, for a short time only, so the momentum from this mastermind has somewhere to go.",
    active: false,
    tiers: c.tiers.map((t) => ({
      ...t,
      ...(t.early ? { early: { ...t.early, until: "2026-10-26T23:59:00-04:00" } } : {}),
      depositNote: t.depositNote?.replace("your C.R.E.A.T.E.", "your mastermind").replace("C.R.E.A.T.E.", "mastermind"),
    })),
  });
}

// Public $27 virtual workshop, and the private follow-up offer for attendees (turn on after the workshop)
DEFAULT_EVENTS.push(
  {
    slug: "build-it-workshop",
    name: "Build It So It Doesn't Break You",
    headline: "Build It So It Doesn't Break You",
    details: "Saturday, November 14 · 11:00 AM to 12:30 PM ET · Live on Zoom",
    endsAt: "2026-11-14T10:00:00-05:00",
    intro: "A hands-on workshop for women business owners. Find what's draining your business with the Bloom Check, then build three tools in the room: a pay-yourself-first money plan, a weekly schedule that protects your energy, and your first written process.",
    open: true,
    active: true,
    tiers: [{
      id: "seat", name: "Workshop seat", tagline: "90 minutes, live and hands-on. Only 15 seats.", price: 27,
      includes: ["The Bloom Check, scored and explained", "A pay-yourself-first money plan", "A weekly schedule that protects your energy", "Your first SOP, written in the room", "A free 20-minute one-on-one Bloom Check debrief after the workshop", "Your own Build & Bloom portal with Money and 12 business tools"],
      serviceIds: [], agreement: false, spots: 15, pool: "build-it-nov-2026",
      next: ["Your Zoom link will be emailed to you 2 days before the workshop.", "Before the workshop, take the Bloom Check in your portal under Books & Tools.", "After the workshop, book your free 20-minute debrief from the Bloom Check page."],
    }],
  },
  {
    slug: "build-it-next-step",
    name: "Build It workshop",
    headline: "Your next step, workshop pricing",
    details: "For workshop attendees only, for 72 hours",
    endsAt: "2026-11-17T11:00:00-05:00",
    intro: "You built the tools. Now let's put them to work on your business, together.",
    active: false,
    tiers: [{
      id: "intensive", name: "Strategy Intensive", tagline: "90 minutes on your top priority, with a written plan.", price: 223, was: 350,
      includes: ["A 90-minute one-on-one working session", "A written action plan in your portal", "Workshop price: $250, minus the $27 you already paid"],
      serviceIds: ["addon-intensive"], agreement: true,
      next: ["Sign your short service agreement at the top of your portal.", "Book your Strategy Intensive from your portal within 30 days."],
    }],
  },
);

export const eventOpen = (e: EventOffer, now = Date.now()) => e.active !== false && now < new Date(e.endsAt).getTime();
/** The price a guest pays right now */
export const tierPrice = (t: EventTier, now = Date.now()) => (t.early && now < new Date(t.early.until).getTime() ? t.early.price : t.price);
export const earlyOn = (t: EventTier, now = Date.now()) => !!t.early && now < new Date(t.early.until).getTime();
export const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** The Bloom Check: the five-area self-check used in the live activity and on the page */
export const BLOOM_CHECK: { id: string; area: string; statement: string; step: string; tier: string }[] = [
  { id: "money", area: "Money", statement: "I know where my money goes, and I pay myself on purpose.", step: "This week, open one separate account for taxes and move 15% of every deposit into it.", tier: "sprout" },
  { id: "systems", area: "Systems", statement: "My business runs without me holding every detail in my head.", step: "Write down the one task only you know how to do. That is your first system.", tier: "sprout" },
  { id: "people", area: "People", statement: "My team, clients, and partners know what to expect from me, and I from them.", step: "Name the conversation you have been putting off, and put it on the calendar.", tier: "sprout" },
  { id: "capacity", area: "Capacity", statement: "I end most weeks with energy left, not running on empty.", step: "Protect one 90-minute block this week that nobody can book.", tier: "bloom" },
  { id: "direction", area: "Direction", statement: "I know my one priority for the next 90 days.", step: "Finish this sentence and say it out loud: \"By January, I will have...\"", tier: "bloom" },
];
