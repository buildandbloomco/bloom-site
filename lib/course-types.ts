export type CourseFormat = "self-paced" | "virtual" | "in-person" | "hybrid";
export type PromptType = "short" | "long" | "table" | "checklist" | "scale";

/** A workbook question or exercise inside a lesson */
export interface Prompt {
  id: string;
  type: PromptType;
  label: string;
  /** Extra guidance, a journal title, or a fill-in-the-blank template */
  help: string;
  /** table: column headings */
  columns: string[];
  /** table: row labels (leave empty to use blankRows) */
  rows: string[];
  blankRows: number;
  /** checklist: items */
  options: string[];
}

export interface Lesson {
  id: string;
  title: string;
  /** Teaching text. Blank lines start new paragraphs. */
  intro: string;
  videoUrl: string;
  resourceUrl: string;
  resourceLabel: string;
  /** A quote or affirmation shown in a highlighted box */
  callout: string;
  prompts: Prompt[];
  minutes: number;
}

export interface CourseModule {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface PaymentPlan {
  id: string;
  label: string;
  installments: number;
  /** Days between payments */
  intervalDays: number;
}

export interface CoursePackage {
  id: string;
  name: string;
  description: string;
  includes: string[];
  price: number;
  /** Billed every month (like a retainer) instead of once */
  monthly: boolean;
  /** Number of 1:1 sessions with you included */
  sessions: number;
  sessionMinutes: number;
  format: string;
  /** Payment plans allowed for this package (ids from course.plans) */
  planIds: string[];
  featured: boolean;
  active: boolean;
}

export interface CourseAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Adds this many 1:1 sessions */
  sessions: number;
}

export interface Coupon {
  code: string;
  percentOff: number;
  amountOff: number;
  active: boolean;
  maxUses: number;
  uses: number;
}

export interface LiveSession {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  link: string;
  notes: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  format: CourseFormat;
  status: "draft" | "published" | "archived";
  showOnSite: boolean;
  pace: string;
  welcome: string;
  affirmations: string[];
  closing: string;
  modules: CourseModule[];
  packages: CoursePackage[];
  addOns: CourseAddOn[];
  plans: PaymentPlan[];
  coupons: Coupon[];
  /** Extra downloads and links for every learner */
  resources: { title: string; url: string; note: string }[];
  /** Library items (digital products) included with the course */
  libraryIds: string[];
  liveSessions: LiveSession[];
  printableWorkbook: boolean;
  certificate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  note: string;
  stripeSessionId?: string;
}

export interface SessionRequest {
  id: string;
  date: string;
  times: string;
  note: string;
  status: "new" | "scheduled" | "closed";
}

export interface Enrollment {
  id: string;
  courseId: string;
  clientId: string;
  packageId: string;
  addOnIds: string[];
  learnerName: string;
  email: string;
  status: "pending" | "active" | "completed" | "paused";
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
  /** lessonId -> ISO date completed */
  completed: Record<string, string>;
  lastLessonId: string;
  /** promptId -> answer (string, string[][] for tables, string[] for checklists) */
  answers: Record<string, unknown>;
  sessionsIncluded: number;
  sessionsUsed: number;
  requests: SessionRequest[];
  /** Total owed for the package, add-ons, after discounts (for monthly: the monthly amount) */
  total: number;
  couponCode: string;
  monthly: boolean;
  planId: string;
  installments: number;
  installmentAmount: number;
  intervalDays: number;
  payments: CoursePayment[];
  comped: boolean;
  notes: string;
  showCode: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  kind: "session" | "consult" | "event" | "other";
  clientId: string;
  enrollmentId: string;
  location: string;
  link: string;
  notes: string;
  /** Counts toward the learner's included 1:1 sessions */
  countsAsSession: boolean;
  createdAt: string;
  /** Filled in when someone books themselves from the booking page */
  bookedOnline?: boolean;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  leadId?: string;
  /** Secret for the booker's confirmation and cancel link */
  token?: string;
  /** Blocks booking even without a time (use for time off) */
  blocksDay?: boolean;
}
