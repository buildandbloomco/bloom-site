/** Guidebooks you give away or sell. Everyone who requests one becomes a lead in Admin > Leads. */
export interface Guide {
  slug: string;
  title: string;
  tagline: string;
  /** What's inside, shown on the guide's page */
  inside: string[];
  /** File in /public/guides */
  file: string;
  pages: number;
  /** Price in dollars. 0 = free (name and email only). Above 0 = paid through Stripe before the download. */
  price: number;
  /** Which lead type a request counts as */
  lane: "orgs" | "business";
  /** Show on the public Guides page. Every guide always shows inside the client portal. */
  public: boolean;
}

export const GUIDES: Guide[] = [
  {
    slug: "starter-guide",
    title: "Build It to Bloom",
    tagline: "A free starter guide to building and organizing your business.",
    inside: [
      "Get clear on your offer and who it serves",
      "A setup checklist to make it official",
      "Simple money habits and a pricing check",
      "Map your operations and pick one tool per job",
      "Protect your capacity before you need to",
      "A week-by-week plan for your first 30 days",
    ],
    file: "/guides/Build-It-to-Bloom-Starter-Guide.pdf",
    pages: 12,
    price: 0,
    lane: "business",
    public: true,
  },
  {
    slug: "client-guidebook",
    title: "Working with Build & Bloom",
    tagline: "The client guidebook: our services, how an engagement runs, your portal, your strategy plan, and the wellness assessment.",
    inside: [
      "Every service and who it fits",
      "The six steps from inquiry to wrap-up",
      "A tour of the client portal",
      "How strategy sessions and your plan work",
      "The Organizational Wellness Assessment, stage by stage",
      "Templates and scripts you can copy",
    ],
    file: "/guides/Build-and-Bloom-Client-Guidebook.pdf",
    pages: 13,
    price: 0,
    lane: "orgs",
    public: true,
  },
  {
    slug: "conversation-planner",
    title: "The Hard Conversation Planner",
    tagline: "One page for the conversation you have been putting off. Fill it in before you walk in.",
    inside: [
      "The issue in one neutral sentence",
      "What you need, and what they likely need",
      "Your opening line",
      "A question to check your story",
      "What you will do if it gets heated",
      "Your walk-away point",
    ],
    file: "/guides/Hard-Conversation-Planner.pdf",
    pages: 1,
    price: 0,
    lane: "orgs",
    public: true,
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const guidePrice = (g: Guide) => (g.price > 0 ? `$${g.price % 1 ? g.price.toFixed(2) : g.price}` : "Free");
