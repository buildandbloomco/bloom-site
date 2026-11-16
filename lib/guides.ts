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
  {
    slug: "practitioner-wellness",
    title: "Pour From Wholeness",
    tagline: "A practitioner wellness guide for helpers, healers, and the people who hold everyone else.",
    inside: [
      "Burnout, compassion fatigue, and secondary trauma, side by side",
      "The Capacity Check: a five-minute self-check",
      "Recovery practices between sessions and at the end of the day",
      "Caseload and calendar limits, with boundary scripts",
      "Your support map and questions for supervision",
      "A 30-day Restore Plan",
    ],
    file: "/guides/Pour-From-Wholeness-Practitioner-Guide.pdf",
    pages: 10,
    price: 0,
    lane: "orgs",
    public: false,
  },
  {
    slug: "right-yes",
    title: "The Right Yes",
    tagline: "A 21-day guide from trying to doing.",
    inside: [
      "Week 1, Hear It: the six signs of trying",
      "Week 2, Clear It: the no's that make room, with four no scripts",
      "Week 3, Say It: the six marks of a right yes, your vision, and your first step",
      "A reading, scripture, journal prompt, and Right Yes step for every day",
      "Your signed Right Yes commitment page",
      "The Right Yes Circle: the practice in one sitting, for groups",
    ],
    // Source and build script: guides/right-yes (node guides/right-yes/build.mjs)
    file: "/guides/The-Right-Yes.pdf",
    pages: 55,
    price: 0,
    lane: "business",
    public: false,
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const guidePrice = (g: Guide) => (g.price > 0 ? `$${g.price % 1 ? g.price.toFixed(2) : g.price}` : "Free");
