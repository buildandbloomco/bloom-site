export type ServiceKind = "core" | "addon";

export interface Service {
  id: string;
  name: string;
  kind: ServiceKind;
  description: string;
  /** Price in dollars for a small business or individual. null = custom quote */
  price: number | null;
  /** Price in dollars for an organization. Empty = same as the small business price */
  priceOrg?: number | null;
  /** Show the price on the public website (otherwise it says the price is set at the consult) */
  showPrice?: boolean;
  /** e.g. "per session", "per month", "one time" */
  unit: string;
  active: boolean;
  /** Show on the public website */
  showOnSite?: boolean;
  /** Which audience this is for on the website */
  lane?: Lane;
}

export type Lane = "orgs" | "business" | "both";

export type LibraryKind = "workshop" | "product" | "resource";

export interface LibraryItem {
  id: string;
  title: string;
  kind: LibraryKind;
  description: string;
  url: string;
  /** e.g. "Free", "$27", "Included" */
  priceLabel: string;
  /** "all" = every client sees it. "assigned" = only clients you add it to */
  audience: "all" | "assigned";
  active: boolean;
  /** Show on the public website's Workshops & Resources page */
  showOnSite?: boolean;
  /** Optional event or release date, YYYY-MM-DD */
  date?: string;
}

export interface Settings {
  brandName: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  location: string;
  /** Link to your free consult booking page (Wix, Calendly, etc.) */
  bookingUrl: string;
  /** Show the booking page inside the portal (works with Calendly; many sites block it) */
  bookingEmbed: boolean;
  beforeYouBook: string[];
  defaultNextSteps: string[];
  booking: BookingSettings;
}

/** Built-in booking. All times are Eastern Time (America/New_York). */
export interface BookingSettings {
  /** When on, every Book button uses your own booking page instead of bookingUrl */
  enabled: boolean;
  /** Weekly hours. day: 0 = Sunday ... 6 = Saturday. Several blocks per day are allowed. */
  hours: { day: number; start: string; end: string }[];
  consultMinutes: number;
  sessionMinutes: number;
  bufferMinutes: number;
  /** How far ahead people must book */
  noticeHours: number;
  /** How far out people can book */
  daysAhead: number;
  /** Most bookings per day (0 = no limit) */
  maxPerDay: number;
  consultTitle: string;
  consultIntro: string;
  /** Default meeting link (Zoom, Google Meet) sent with every booking */
  meetingLink: string;
  location: string;
  /** Dates you are unavailable (YYYY-MM-DD) */
  blockedDates: string[];
}

export interface Catalog {
  services: Service[];
  library: LibraryItem[];
}

export interface Payment {
  id: string;
  /** "package" counts toward the package balance. "addon" is extra. */
  kind: "package" | "addon";
  amount: number;
  description: string;
  date: string;
  method: string;
  stripeSessionId?: string;
}

export interface AddOnRequest {
  id: string;
  addOnIds: string[];
  note: string;
  date: string;
  status: "new" | "seen" | "done";
}

export type DeliverableType =
  | "document"
  | "folder"
  | "website"
  | "video"
  | "content"
  | "presentation"
  | "design"
  | "recording"
  | "other";

export type DeliverableStatus = "in-progress" | "review" | "final";

/** Work you complete for a client: Google Docs, sites, videos, content, folders... */
export interface Deliverable {
  id: string;
  title: string;
  type: DeliverableType;
  url: string;
  note: string;
  status: DeliverableStatus;
  /** Date added or delivered, YYYY-MM-DD */
  date: string;
  /** Deadline, YYYY-MM-DD or "" */
  dueDate: string;
  /** Optional section, e.g. "Phase 1: Strategy" or "Brand Content" */
  group: string;
}

export interface Milestone {
  id: string;
  title: string;
  /** YYYY-MM-DD or "" */
  due: string;
  done: boolean;
}

export interface ProjectUpdate {
  id: string;
  date: string;
  text: string;
}

export interface ConsultAction {
  id: string;
  text: string;
  owner: "us" | "client" | "both";
  due: string;
  done: boolean;
}

export interface ConsultDeliverable {
  id: string;
  title: string;
  due: string;
  confirmed: boolean;
  addedToWork: boolean;
}

/** A sheet you fill out live during a consult, kickoff, or check-in call */
export interface Consult {
  id: string;
  date: string;
  type: string;
  attendees: string;
  /** Show this sheet in the client's portal */
  shared: boolean;
  about: {
    business: string;
    offer: string;
    audience: string;
    stage: string;
    teamSize: string;
    links: string;
  };
  goals: string;
  success: string;
  focusAreas: string[];
  challenges: string;
  tools: string;
  budget: string;
  startDate: string;
  keyDates: string;
  serviceIds: string[];
  /** Which kind of client this is. Sets the questions on the sheet and which prices are suggested */
  tier: "business" | "org" | "";
  /** Answers to the questions for that kind of client */
  typeAnswers: Record<string, string>;
  /** Starting price built during the call */
  quote: {
    /** Your own price for a service, when different from the suggested one */
    prices: Record<string, number>;
    /** Sessions, months, or units for a service */
    qty: Record<string, number>;
    discount: number;
    discountNote: string;
    note: string;
    /** Show the starting price in the summary the client sees */
    share: boolean;
    /** When this starting price was copied into their proposal */
    appliedAt: string | null;
  };
  deliverables: ConsultDeliverable[];
  actions: ConsultAction[];
  notes: string;
  /** Never shown to the client */
  privateNotes: string;
  reviewedOnCall: boolean;
  clientConfirmedAt: string | null;
  clientConfirmedBy: string;
  clientComment: string;
  createdAt: string;
  updatedAt: string;
}

/** Someone who filled out the inquiry form on the website */
export interface Lead {
  id: string;
  createdAt: string;
  status: "new" | "contacted" | "converted" | "closed";
  lane: "orgs" | "business" | "other";
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  website: string;
  interests: string[];
  goals: string;
  challenges: string;
  budget: string;
  timeline: string;
  heardFrom: string;
  /** Only for mental health practices and helping organizations */
  assessment: {
    staffLicensed: string;
    staffInterns: string;
    staffAdmin: string;
    serviceAreas: string[];
    caseIntensity: string;
    fatigueSigns: string[];
    crisisProtocol: string;
    billableHours: string;
    decompression: string;
    supervision: string;
    modelConflict: string;
    outcomes: string[];
    identityDynamics: string;
  } | null;
  notes: string;
  clientId: string | null;
  /** Set when they book a consult on your booking page */
  consult?: { date: string; start: string; apptId: string } | null;
  /** Guidebooks this person requested or bought */
  guides?: { slug: string; title: string; at: string; paid: number; stripeSessionId?: string }[];
}

export type ClientStatus = "draft" | "sent" | "active" | "completed" | "archived";

export interface Client {
  id: string;
  slug: string;
  name: string;
  contactName: string;
  email: string;
  status: ClientStatus;
  /** "none" = an existing client who pays you outside the site. Their portal hides the investment and payment sections */
  billing?: "standard" | "none";
  /** Small business or organization. Sets which add-on prices they see and pay in the portal */
  tier?: "business" | "org" | "";
  /** Guidebooks shown in their portal. Not set = just the client guidebook */
  guideSlugs?: string[];
  codeEnc: string;
  codeIndex: string;
  welcome: string;
  package: {
    title: string;
    summary: string;
    format: string;
    duration: string;
    startDate: string;
    serviceIds: string[];
    customItems: { title: string; detail: string }[];
  };
  investment: {
    total: number;
    retainer: number;
    lineItems: { label: string; amount: number }[];
    note: string;
  };
  addOnIds: string[];
  libraryIds: string[];
  deliverables: Deliverable[];
  updates: ProjectUpdate[];
  milestones: Milestone[];
  /** null = calculate from milestones automatically */
  progressOverride: number | null;
  /** A shared Google Drive folder shown live in the portal */
  driveFolderUrl: string;
  consults: Consult[];
  /** Older versions stored simple links here. They are moved into deliverables automatically. */
  links?: { title: string; url: string; note: string }[];
  nextSteps: string[];
  showBooking: boolean;
  notes: string;
  payments: Payment[];
  requests: AddOnRequest[];
  createdAt: string;
  updatedAt: string;
  lastViewedAt: string | null;
}

/** What the browser is allowed to see about a client */
export type PublicClient = Omit<Client, "codeEnc" | "codeIndex" | "notes">;

/** Someone who joined the Wellness Library waitlist */
export interface WaitlistEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  plan: "individual" | "team";
  name: string;
  email: string;
  organization: string;
  role: string;
  teamSize: string;
  interests: string[];
  note: string;
  heardFrom: string;
  status: "waiting" | "invited" | "joined";
}
