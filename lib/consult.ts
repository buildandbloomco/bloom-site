import type { Consult, ConsultAction, ConsultDeliverable } from "./types";

export const CONSULT_TYPES = ["Free consult", "Discovery call", "Kickoff call", "Check-in", "Wrap-up", "Other"];
export const STAGES = ["Idea stage", "Just launched (under 1 year)", "Growing (1 to 3 years)", "Established (3+ years)", "Organization or institution"];
export const FOCUS_AREAS = [
  "Vision & strategic clarity",
  "Offers & pricing",
  "Systems & operations",
  "Admin & documentation",
  "Team capacity & burnout",
  "Leadership & communication",
  "Workshops & training",
  "Events & gatherings",
  "Funding & partnerships",
  "Marketing & visibility",
];

export const OWNER_LABEL: Record<ConsultAction["owner"], string> = {
  us: "Build & Bloom",
  client: "You",
  both: "Together",
};

export function blankConsult(id: string, business: string): Consult {
  const now = new Date().toISOString();
  return {
    id,
    date: now.slice(0, 10),
    type: "Free consult",
    attendees: "",
    shared: false,
    about: { business, offer: "", audience: "", stage: "", teamSize: "", links: "" },
    goals: "",
    success: "",
    focusAreas: [],
    challenges: "",
    tools: "",
    budget: "",
    startDate: "",
    keyDates: "",
    serviceIds: [],
    deliverables: [],
    actions: [],
    notes: "",
    privateNotes: "",
    reviewedOnCall: false,
    clientConfirmedAt: null,
    clientConfirmedBy: "",
    clientComment: "",
    createdAt: now,
    updatedAt: now,
  };
}

const str = (v: unknown, max = 5000) => String(v ?? "").slice(0, max);
const date = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : "");
const rid = () => Math.random().toString(36).slice(2, 10);

/** Clean up what the admin page sends. Client confirmation fields always come from the saved copy. */
export function sanitizeConsult(b: Partial<Consult>, saved: Consult): Consult {
  const about = (b.about ?? {}) as Partial<Consult["about"]>;
  return {
    ...saved,
    date: date(b.date) || saved.date,
    type: str(b.type, 60) || "Other",
    attendees: str(b.attendees, 500),
    shared: !!b.shared,
    about: {
      business: str(about.business, 300),
      offer: str(about.offer, 2000),
      audience: str(about.audience, 2000),
      stage: str(about.stage, 100),
      teamSize: str(about.teamSize, 100),
      links: str(about.links, 1000),
    },
    goals: str(b.goals),
    success: str(b.success),
    focusAreas: (Array.isArray(b.focusAreas) ? b.focusAreas : []).map((x) => str(x, 100)).slice(0, 30),
    challenges: str(b.challenges),
    tools: str(b.tools, 2000),
    budget: str(b.budget, 300),
    startDate: date(b.startDate),
    keyDates: str(b.keyDates, 2000),
    serviceIds: (Array.isArray(b.serviceIds) ? b.serviceIds : []).map((x) => str(x, 80)).slice(0, 50),
    deliverables: (Array.isArray(b.deliverables) ? b.deliverables : []).slice(0, 100).map(
      (d: Partial<ConsultDeliverable>): ConsultDeliverable => ({
        id: str(d.id, 40) || rid(),
        title: str(d.title, 300),
        due: date(d.due),
        confirmed: !!d.confirmed,
        addedToWork: !!d.addedToWork,
      })
    ),
    actions: (Array.isArray(b.actions) ? b.actions : []).slice(0, 100).map(
      (a: Partial<ConsultAction>): ConsultAction => ({
        id: str(a.id, 40) || rid(),
        text: str(a.text, 500),
        owner: a.owner === "client" || a.owner === "both" ? a.owner : "us",
        due: date(a.due),
        done: !!a.done,
      })
    ),
    notes: str(b.notes, 20000),
    privateNotes: str(b.privateNotes, 20000),
    reviewedOnCall: !!b.reviewedOnCall,
    updatedAt: new Date().toISOString(),
  };
}
