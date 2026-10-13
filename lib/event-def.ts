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
}

const PORTAL = "Your own private Build & Bloom portal with Money: budget, income buckets you drag and drop, team pay, and tax dates";
const BOOKS = "Every Build & Bloom guidebook, including the new Pour From Wholeness practitioner wellness guide";

export const DEFAULT_EVENTS: EventOffer[] = [
  {
    slug: "create",
    name: "C.R.E.A.T.E.",
    endsAt: "2026-10-18T23:59:00-04:00",
    intro: "You came to C.R.E.A.T.E. to connect, restore, and leave empowered. These offers are for the people in this room, only through Sunday night, so the momentum from this weekend has somewhere to go.",
    tiers: [
      {
        id: "seed",
        name: "Bloom Books Bundle",
        tagline: "Start on your own, today.",
        price: 37,
        includes: ["Pour From Wholeness, the practitioner wellness guide, only available to clients", PORTAL, "Bonus: the full Build & Bloom guidebook library"],
        serviceIds: [],
        agreement: false,
        next: ["Open your portal and find your books under Guides.", "Then open Money and start with \"How to use Money\"."],
      },
      {
        id: "sprout",
        name: "Strategy Intensive + Books",
        tagline: "One focused session on what is stuck, plus the full guidebook library.",
        price: 297,
        was: 350,
        includes: ["A 90-minute one-on-one working session on your top priority", "A written action plan in your portal, with next steps you can actually do", BOOKS, PORTAL],
        serviceIds: ["addon-intensive"],
        agreement: true,
        next: ["Sign your short service agreement at the top of your portal.", "Book your Strategy Intensive from your portal. Use it within 30 days.", "Your guidebooks are in your portal under Guides."],
      },
      {
        id: "bloom",
        name: "VIP Bloom Plan",
        tagline: "Strategy, structure, and support for the next 90 days.",
        price: 1397,
        early: { price: 997, until: "2026-10-17T23:59:00-04:00" },
        was: 2400,
        featured: true,
        includes: ["Three strategy sessions and a 90-day plan built with you in your portal", "Bonus: a Money Setup Session to organize your finances together (a $350 value)", "VIP scheduling: your first session within 7 days", "Email support between sessions", BOOKS, PORTAL],
        serviceIds: ["strategy", "addon-money-setup"],
        deposit: 500,
        depositNote: "Hold your C.R.E.A.T.E. price with $500 today. The balance is due before your first session, in your portal.",
        agreement: true,
        next: ["Sign your service agreement at the top of your portal.", "Book your first strategy session from your portal. VIP clients get a session within 7 days.", "Pay any remaining balance in your portal before that session."],
      },
    ],
  },
];

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
