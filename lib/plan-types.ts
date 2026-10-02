/** Strategy plans: sessions you run with a client, tasks for each side, and change requests. */

export type Owner = "client" | "us";
export type TaskStatus = "todo" | "doing" | "done";

/** Something a task or session can point to: a service, course, product, library piece, the assessment, or a link */
export interface PlanLink {
  type: "service" | "course" | "library" | "wellness" | "assessment" | "url" | "";
  refId: string;
  /** Filled in when saved, so the portal can show it without extra lookups */
  label: string;
  url: string;
}

export interface PlanComment {
  id: string;
  by: Owner;
  text: string;
  at: string;
}

export interface PlanTask {
  id: string;
  sessionId: string;
  title: string;
  detail: string;
  owner: Owner;
  /** YYYY-MM-DD or "" */
  due: string;
  status: TaskStatus;
  link: PlanLink;
  createdBy: Owner;
  comments: PlanComment[];
  /** Set when a task came from an assessment recommendation */
  domain: string;
}

export interface PlanSession {
  id: string;
  title: string;
  /** YYYY-MM-DD or "" */
  date: string;
  start: string;
  status: "planned" | "done";
  /** Goal for the session, shown to the client */
  goal: string;
  agenda: { id: string; text: string; by: Owner }[];
  /** Shared notes and decisions, written after the session */
  notes: string;
  decisions: string[];
  /** Resources you want them to look at for this session */
  resources: PlanLink[];
}

export interface PlanRequest {
  id: string;
  kind: "change" | "new" | "remove" | "question";
  targetType: "task" | "session" | "plan";
  targetId: string;
  targetLabel: string;
  text: string;
  at: string;
  status: "open" | "resolved";
  reply: string;
}

export interface StrategyPlan {
  clientId: string;
  enabled: boolean;
  title: string;
  /** One or two sentences: what this plan is for */
  focus: string;
  sessions: PlanSession[];
  tasks: PlanTask[];
  requests: PlanRequest[];
  /** Let the client add their own tasks and agenda items */
  clientCanAdd: boolean;
  updatedAt: string;
}

export const blankLink = (): PlanLink => ({ type: "", refId: "", label: "", url: "" });

export function progress(tasks: PlanTask[], owner?: Owner) {
  const t = owner ? tasks.filter((x) => x.owner === owner) : tasks;
  const done = t.filter((x) => x.status === "done").length;
  const doing = t.filter((x) => x.status === "doing").length;
  return { total: t.length, done, doing, pct: t.length ? Math.round(((done + doing * 0.5) / t.length) * 100) : 0 };
}

export const LINK_TYPES: { id: PlanLink["type"]; label: string }[] = [
  { id: "", label: "No link" },
  { id: "service", label: "A service or add-on" },
  { id: "course", label: "A course" },
  { id: "library", label: "A workshop, product, or resource" },
  { id: "wellness", label: "A Wellness Library piece" },
  { id: "assessment", label: "The wellness assessment" },
  { id: "url", label: "Any link" },
];
