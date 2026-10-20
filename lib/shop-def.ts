/** The shop: digital products sold on the website and delivered in the buyer's portal. Shared by browser and server. */

export type ProductStatus = "live" | "soon" | "hidden";
export const PRODUCT_KINDS = ["Ebook", "Guide", "Workbook", "Coloring book", "Template", "Bundle", "Recording", "Toolkit"] as const;

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  /** Paragraphs separated by blank lines */
  description: string;
  /** 0 = free download */
  price: number;
  was?: number;
  kind: string;
  /** Cover image link (upload in admin). Blank = a branded cover is drawn. */
  cover: string;
  /** The file they get (upload in admin) */
  file: string;
  /** Optional: a guidebook from Books & Tools this product unlocks in their portal */
  guideSlug?: string;
  /** Optional: other products a bundle includes */
  alsoGrants?: string[];
  includes: string[];
  pages?: string;
  status: ProductStatus;
  featured?: boolean;
}

export interface Order {
  id: string;
  at: string;
  productId: string;
  title: string;
  amount: number;
  method: "card" | "zelle" | "free";
  status: "pending" | "paid" | "canceled";
  name: string;
  email: string;
  clientId: string;
  sessionId?: string;
}

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "pour-from-wholeness", slug: "pour-from-wholeness", title: "Pour From Wholeness", subtitle: "A practitioner wellness guide for helpers, healers, and the people who hold everyone else.",
    description: "You became a helper because you care. This guide is about caring for the person who does the caring.\n\nWork through it with a pen: name what you are carrying, take the five-minute Capacity Check, build recovery into your day, protect your caseload and calendar, map your support, and follow a 30-day Restore Plan.",
    price: 17, kind: "Guide", cover: "/shop/pour-from-wholeness.png", file: "/guides/Pour-From-Wholeness-Practitioner-Guide.pdf", guideSlug: "practitioner-wellness",
    includes: ["Burnout, compassion fatigue, and secondary trauma, side by side", "The Capacity Check, a five-minute self-check", "Recovery practices between sessions", "Caseload limits and boundary scripts you can use", "Your support map and questions for supervision", "A 30-day Restore Plan"],
    pages: "10 pages", status: "live", featured: true,
  },
  {
    id: "hard-conversation-planner", slug: "hard-conversation-planner", title: "The Hard Conversation Planner", subtitle: "One page for the conversation you have been putting off.",
    description: "Fill it in before you walk in. Name the issue in one neutral sentence, what you need, what they likely need, your opening line, and your walk-away point.",
    price: 0, kind: "Template", cover: "/shop/hard-conversation-planner.png", file: "/guides/Hard-Conversation-Planner.pdf", guideSlug: "conversation-planner",
    includes: ["The issue in one neutral sentence", "Your opening line", "What to do if it gets heated", "Your walk-away point"], pages: "1 page", status: "live",
  },
  {
    id: "build-it-to-bloom", slug: "build-it-to-bloom", title: "Build It to Bloom", subtitle: "A free starter guide to building and organizing your business.",
    description: "Get clear on your offer, make it official, set simple money habits, map your operations, protect your capacity, and follow a plan for your first 30 days.",
    price: 0, kind: "Guide", cover: "/shop/build-it-to-bloom.png", file: "/guides/Build-It-to-Bloom-Starter-Guide.pdf", guideSlug: "starter-guide",
    includes: ["Your offer and who it serves", "A setup checklist", "Simple money habits and a pricing check", "A week-by-week 30-day plan"], pages: "12 pages", status: "live",
  },
  {
    id: "the-right-yes", slug: "the-right-yes", title: "The Right Yes", subtitle: "A 21-day guide to purpose, discernment, and the difference between trying and doing.",
    description: "Saying yes to the wrong thing is saying no to the right one. Over 21 days, slow down, listen, and learn to recognize the yes that is really yours. Faith is present, and gentle.",
    price: 27, kind: "Ebook", cover: "", file: "", includes: ["21 short daily readings", "Reflection questions for each day", "The Right Yes Decision Filter"], status: "soon",
  },
  {
    id: "bloom-coloring-book", slug: "bloom-coloring-book", title: "Bloom: A Self-Care Coloring Book", subtitle: "Pages to slow down with: heritage patterns, florals, mandalas, and affirmations.",
    description: "A coloring book for grown folks who need a quiet hour. African heritage patterns, botanicals, mandalas, and hand-lettered affirmations to color, breathe, and rest.",
    price: 15, kind: "Coloring book", cover: "", file: "", includes: ["Printable pages, color as many times as you like", "Affirmation pages", "Heritage patterns, florals, and mandalas"], status: "soon",
  },
];

export const priceLabel = (p: Pick<Product, "price">) => (p.price > 0 ? `$${p.price % 1 ? p.price.toFixed(2) : p.price}` : "Free");
export const productPath = (p: Pick<Product, "slug">) => `/shop/${p.slug}`;
