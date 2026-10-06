/** The build workspace: what we ask a client before building their system, and how they follow the work. */

export const BUILD_KINDS = [
  { id: "systems-landing", label: "Landing Page Build" },
  { id: "systems-portal", label: "Proposal and Payment Portal" },
  { id: "systems-hub", label: "Full Operations Hub" },
] as const;
export type BuildKind = (typeof BUILD_KINDS)[number]["id"];

export const STAGES = [
  { id: "discovery", label: "Discovery", detail: "We gather what we need and map how your business works." },
  { id: "design", label: "Design", detail: "You see the layout and flow before anything is built." },
  { id: "build", label: "Build", detail: "We build it on your accounts, in your brand." },
  { id: "review", label: "Your review", detail: "You try it with real examples and tell us what to change." },
  { id: "launch", label: "Launch", detail: "It goes live on your domain and we hand you the keys." },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

export type FieldType = "text" | "long" | "url" | "color" | "choice" | "multi";
export interface Field { key: string; label: string; hint?: string; type: FieldType; options?: string[]; placeholder?: string; /** Skip this question for a landing page */ notLanding?: boolean }
export interface Section { id: string; title: string; intro: string; fields: Field[]; notLanding?: boolean }

export const INTAKE: Section[] = [
  { id: "business", title: "Your business", intro: "The basics, in your own words. This becomes the wording on your site.", fields: [
    { key: "bizName", label: "Business name, exactly as it should appear", type: "text" },
    { key: "tagline", label: "Tagline or one-line description", type: "text", placeholder: "What you do and who it is for" },
    { key: "about", label: "About your business", hint: "A few sentences is fine. We will polish it.", type: "long" },
    { key: "audience", label: "Who are your clients or customers?", type: "long" },
    { key: "services", label: "What you offer", hint: "One per line. Add prices if you want them shown.", type: "long" },
    { key: "contact", label: "Contact details to show publicly", hint: "Email, phone, address, hours. Only what you want people to see.", type: "long" },
    { key: "goal", label: "What is the number one thing this system should do for you?", type: "long" },
  ] },
  { id: "brand", title: "Your brand", intro: "Colors, fonts, and feel. Upload your logo and any brand files in the Files box on this page.", fields: [
    { key: "color1", label: "Main color", type: "color" },
    { key: "color2", label: "Second color", type: "color" },
    { key: "color3", label: "Accent color", type: "color" },
    { key: "colorNotes", label: "Anything else about color", hint: "Exact codes from a brand guide, colors to avoid, or \"I need help choosing.\"", type: "text" },
    { key: "fonts", label: "Fonts you use, if any", type: "text" },
    { key: "feel", label: "How should it feel?", type: "multi", options: ["Warm", "Clean and minimal", "Bold", "Elegant", "Playful", "Earthy", "Modern", "Classic", "Luxurious", "Down to earth"] },
    { key: "likes", label: "Websites you like, and what you like about them", hint: "One per line.", type: "long" },
    { key: "dislikes", label: "Anything you do not want", type: "long" },
    { key: "photos", label: "Do you have photos we can use?", type: "choice", options: ["Yes, I will upload them", "Some, I need a few more", "No, please use stock or graphics"] },
  ] },
  { id: "links", title: "Your links", intro: "Everything that already exists, so we can connect it or replace it.", fields: [
    { key: "currentSite", label: "Current website", type: "url" },
    { key: "domain", label: "Domain you own or want", hint: "For example yourbusiness.com. Tell us where it is registered if you know.", type: "text" },
    { key: "instagram", label: "Instagram", type: "url" },
    { key: "socials", label: "Other social links", hint: "One per line.", type: "long" },
    { key: "booking", label: "Booking link", hint: "Calendly, Acuity, Square, or similar.", type: "url" },
    { key: "payments", label: "How do you take payments now?", type: "text", placeholder: "Stripe, Square, Zelle, invoices" },
    { key: "drive", label: "Shared folder with your documents", hint: "Google Drive or Dropbox link, if you have one.", type: "url" },
    { key: "otherTools", label: "Other tools you use every week", hint: "Email marketing, forms, scheduling, spreadsheets.", type: "long" },
  ] },
  { id: "site", title: "Your website", intro: "What visitors should see and do.", fields: [
    { key: "pages", label: "Pages or sections you want", type: "multi", options: ["Home", "About", "Services", "Pricing", "Booking", "Contact form", "Testimonials", "FAQ", "Events", "Shop", "Courses", "Blog or resources", "Gallery"] },
    { key: "cta", label: "What should a visitor do first?", type: "choice", options: ["Book a call", "Fill out an inquiry form", "Request a quote", "Buy something", "Call or text me", "Join a list"] },
    { key: "testimonials", label: "Testimonials or reviews to include", hint: "Paste them here with the person's name, or tell us where to find them.", type: "long" },
    { key: "copyHelp", label: "Who is writing the words?", type: "choice", options: ["I have my wording ready", "I have a start, please polish it", "Please write it from what I shared"] },
  ] },
  { id: "admin", title: "Your admin side", intro: "What you want to see and do when you sign in to run your business.", notLanding: true, fields: [
    { key: "journey", label: "Walk us through a client, from first contact to final payment", hint: "Step by step, the way it happens today. Messy is fine.", type: "long" },
    { key: "dropped", label: "Where do things get dropped or delayed?", type: "long" },
    { key: "adminHome", label: "What do you want on your home screen every morning?", type: "multi", options: ["Proposals waiting on a response", "Who viewed a proposal", "Payments and balances due", "Follow-ups I owe", "This week's calls and sessions", "New inquiries", "Tasks for my team", "Revenue this month"] },
    { key: "features", label: "What should it handle?", type: "multi", options: ["Proposals", "Agreements and signatures", "Card payments", "Payment plans", "Client portal with login", "Shared files", "Calendar and booking", "Email reminders", "Lead tracking", "Courses or trainings", "Shop or digital products", "Staff logins", "Content calendar"] },
    { key: "proposalInfo", label: "What goes in your proposals?", hint: "Packages, pricing, deposits, terms, anything you always include.", type: "long" },
    { key: "team", label: "Who else needs access, and what should they be able to do?", type: "long" },
  ] },
  { id: "clientSide", title: "Your clients' side", intro: "What your clients should see and do when they sign in.", notLanding: true, fields: [
    { key: "clientSees", label: "What should a client be able to do?", type: "multi", options: ["View their proposal", "Sign an agreement", "Pay online", "See what is due", "Book sessions", "Upload files", "See progress on their project", "Message or request changes", "Download documents", "Take a course"] },
    { key: "clientTone", label: "How should it feel for them?", type: "text", placeholder: "Calm and simple, premium, friendly" },
    { key: "clientNotes", label: "Anything clients ask you for over and over?", type: "long" },
  ] },
  { id: "launch", title: "Timing and launch", intro: "So we plan around your calendar.", fields: [
    { key: "deadline", label: "Is there a date this needs to be live by?", type: "text" },
    { key: "reviewer", label: "Who gives final approval?", type: "text" },
    { key: "bestContact", label: "Best way and time to reach you during the build", type: "text" },
    { key: "anythingElse", label: "Anything else we should know?", type: "long" },
  ] },
];
export const ALL_FIELDS = INTAKE.flatMap((s) => s.fields);
export const FIELD = new Map(ALL_FIELDS.map((f) => [f.key, f]));

/** Accounts the client needs in their own name, so they own what we build */
export const ACCOUNTS = [
  { key: "domain", label: "Domain name", cost: "About $12 to $20 a year", why: "Your web address. Registered in your name.", url: "" },
  { key: "github", label: "GitHub", cost: "Free", why: "Stores your site's files and history.", url: "https://github.com/signup" },
  { key: "vercel", label: "Vercel Pro", cost: "$20 a month", why: "Hosts your site. The free plan is for personal use only, so a business needs Pro.", url: "https://vercel.com/pricing" },
  { key: "claude", label: "Claude Pro", cost: "$20 a month", why: "The AI assistant your system is built and updated with. With your own account, you or anyone you hire can keep improving it.", url: "https://claude.com/pricing" },
  { key: "stripe", label: "Stripe", cost: "No monthly fee. A fee per card payment.", why: "Takes card payments and sends them to your bank.", url: "https://stripe.com", notLanding: true },
  { key: "email", label: "Email sending (Resend)", cost: "Free to start", why: "Sends invites, reminders, and alerts from your own address.", url: "https://resend.com", notLanding: true },
] as const;
export type AccountKey = (typeof ACCOUNTS)[number]["key"];
/** What the client pays other companies each month to keep the system running (not paid to us) */
export const RUNNING_COSTS = { monthly: 40, line: "Vercel Pro ($20) and Claude Pro ($20), plus your domain at about $12 to $20 a year" };

export interface BuildUpdate { id: string; at: string; text: string; link: string }
export interface BuildRequest { id: string; at: string; addOnId: string; label: string; note: string; status: "new" | "quoted" | "added" | "declined"; reply: string }
export interface Build {
  enabled: boolean;
  kind: BuildKind;
  stage: StageId;
  /** Shown to the client as the target launch date */
  targetDate: string;
  previewUrl: string;
  liveUrl: string;
  updates: BuildUpdate[];
  intake: Record<string, string | string[]>;
  intakeSubmittedAt: string | null;
  accounts: Partial<Record<AccountKey, "todo" | "done">>;
  requests: BuildRequest[];
}
export const blankBuild = (): Build => ({ enabled: false, kind: "systems-portal", stage: "discovery", targetDate: "", previewUrl: "", liveUrl: "", updates: [], intake: {}, intakeSubmittedAt: null, accounts: {}, requests: [] });
export const sectionsFor = (kind: BuildKind) => INTAKE.filter((s) => !(kind === "systems-landing" && s.notLanding));
export const accountsFor = (kind: BuildKind) => ACCOUNTS.filter((a) => !(kind === "systems-landing" && "notLanding" in a && a.notLanding));
const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "");
export function intakeProgress(b: Pick<Build, "kind" | "intake">) {
  const fields = sectionsFor(b.kind).flatMap((s) => s.fields);
  const done = fields.filter((f) => filled(b.intake[f.key])).length;
  return { done, total: fields.length, percent: Math.round((done / fields.length) * 100) };
}
