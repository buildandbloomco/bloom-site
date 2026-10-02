import "server-only";
import { kv } from "./kv";
import { newId } from "./crypto";
import { getCatalog, listClients } from "./data";
import { listCourses } from "./courses";
import { listPieces } from "./library";
import type { Client } from "./types";
import { blankLink, type PlanLink, type PlanTask, type StrategyPlan, type PlanSession, type Owner } from "./plan-types";
import type { Assessment, TeamResponse } from "./assessment-types";
import { DOMAINS, ITEM_COUNT, itemKey, OPEN_QUESTIONS, OPS_FIELDS, POLICIES, PRIORITIES, ROLE_GROUPS, type OpsKey } from "./assessment-def";
import { randomBytes } from "crypto";

const K = { plans: "bb:plans", assess: "bb:assess", tokens: "bb:assess:tokens", resp: (id: string) => `bb:assess:resp:${id}` };
const str = (v: unknown, max = 2000) => String(v ?? "").slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const rid = () => newId();

// ---------------- strategy plans ----------------
export function blankPlan(clientId: string): StrategyPlan {
  return { clientId, enabled: false, title: "Your strategy plan", focus: "", sessions: [], tasks: [], requests: [], clientCanAdd: true, updatedAt: new Date().toISOString() };
}

export async function getPlan(clientId: string): Promise<StrategyPlan> {
  return (await kv().hget<StrategyPlan>(K.plans, clientId)) ?? blankPlan(clientId);
}
export async function savePlan(p: StrategyPlan) {
  await kv().hset(K.plans, p.clientId, { ...p, updatedAt: new Date().toISOString() });
}
export async function listPlans(): Promise<StrategyPlan[]> {
  return Object.values(await kv().hgetall<StrategyPlan>(K.plans));
}

/** Fill in the label and address for a link so the portal can show it directly */
export async function resolveLink(l: PlanLink, client?: Client | null): Promise<PlanLink> {
  if (!l || !l.type) return blankLink();
  const out: PlanLink = { type: l.type, refId: str(l.refId, 120), label: str(l.label, 200), url: str(l.url, 1000) };
  if (l.type === "service") {
    const s = (await getCatalog()).services.find((x) => x.id === l.refId);
    if (s) { out.label = out.label || s.name; out.url = client ? `/p/${client.slug}#package` : ""; }
  } else if (l.type === "course") {
    const c = (await listCourses()).find((x) => x.id === l.refId);
    if (c) { out.label = out.label || c.title; out.url = `/courses/${c.slug}`; }
  } else if (l.type === "library") {
    const it = (await getCatalog()).library.find((x) => x.id === l.refId);
    if (it) { out.label = out.label || it.title; out.url = it.url; }
  } else if (l.type === "wellness") {
    const p = (await listPieces()).find((x) => x.id === l.refId);
    if (p) { out.label = out.label || p.title; out.url = `/library/${p.slug}`; }
  } else if (l.type === "assessment") {
    out.label = out.label || "Organizational Wellness Assessment";
    out.url = client ? `/p/${client.slug}/assessment` : "";
  } else if (l.type === "url") {
    if (!/^https?:\/\//.test(out.url)) out.url = "";
    out.label = out.label || out.url;
  }
  return out;
}

export async function sanitizePlan(b: Partial<StrategyPlan>, prev: StrategyPlan, client: Client | null): Promise<StrategyPlan> {
  const sessions: PlanSession[] = [];
  for (const s of (Array.isArray(b.sessions) ? b.sessions : prev.sessions).slice(0, 60)) {
    const resources: PlanLink[] = [];
    for (const r of (Array.isArray(s.resources) ? s.resources : []).slice(0, 12)) {
      const x = await resolveLink(r, client);
      if (x.type) resources.push(x);
    }
    sessions.push({
      id: str(s.id, 40) || rid(), title: str(s.title, 200) || "Strategy session", date: isDate(str(s.date)) ? str(s.date) : "",
      start: /^\d{2}:\d{2}$/.test(str(s.start)) ? str(s.start) : "", status: s.status === "done" ? "done" : "planned",
      goal: str(s.goal, 1000), notes: str(s.notes, 20000),
      agenda: (Array.isArray(s.agenda) ? s.agenda : []).slice(0, 40).map((a) => ({ id: str(a.id, 40) || rid(), text: str(a.text, 500), by: (a.by === "client" ? "client" : "us") as Owner })).filter((a) => a.text.trim()),
      decisions: (Array.isArray(s.decisions) ? s.decisions : []).map((d) => str(d, 500)).filter((d) => d.trim()).slice(0, 40),
      resources,
    });
  }
  const tasks: PlanTask[] = [];
  for (const t of (Array.isArray(b.tasks) ? b.tasks : prev.tasks).slice(0, 300)) {
    tasks.push({
      id: str(t.id, 40) || rid(), sessionId: sessions.some((s) => s.id === t.sessionId) ? str(t.sessionId, 40) : "",
      title: str(t.title, 300), detail: str(t.detail, 4000), owner: t.owner === "client" ? "client" : "us",
      due: isDate(str(t.due)) ? str(t.due) : "", status: t.status === "done" || t.status === "doing" ? t.status : "todo",
      link: await resolveLink(t.link ?? blankLink(), client), createdBy: t.createdBy === "client" ? "client" : "us",
      comments: (Array.isArray(t.comments) ? t.comments : []).slice(-60).map((c) => ({ id: str(c.id, 40) || rid(), by: c.by === "client" ? "client" : "us", text: str(c.text, 2000), at: str(c.at, 40) || new Date().toISOString() })),
      domain: str(t.domain, 40),
    });
  }
  return {
    ...prev,
    enabled: b.enabled ?? prev.enabled,
    title: str(b.title ?? prev.title, 200) || "Your strategy plan",
    focus: str(b.focus ?? prev.focus, 2000),
    clientCanAdd: b.clientCanAdd ?? prev.clientCanAdd,
    sessions,
    tasks: tasks.filter((t) => t.title.trim()),
    requests: (Array.isArray(b.requests) ? b.requests : prev.requests).slice(-200).map((r) => ({
      id: str(r.id, 40) || rid(), kind: ["change", "new", "remove", "question"].includes(r.kind) ? r.kind : "change",
      targetType: ["task", "session", "plan"].includes(r.targetType) ? r.targetType : "plan", targetId: str(r.targetId, 40), targetLabel: str(r.targetLabel, 300),
      text: str(r.text, 3000), at: str(r.at, 40), status: r.status === "resolved" ? "resolved" : "open", reply: str(r.reply, 3000),
    })),
  };
}

/** A ready-made three-session plan to start from */
export function planTemplate(kind: "strategy" | "assessment"): Pick<StrategyPlan, "title" | "focus" | "sessions" | "tasks"> {
  const s = (title: string, goal: string, agenda: string[]): PlanSession => ({ id: rid(), title, date: "", start: "", status: "planned", goal, agenda: agenda.map((text) => ({ id: rid(), text, by: "us" as const })), notes: "", decisions: [], resources: [] });
  const t = (sessionId: string, owner: "client" | "us", title: string, detail = "", link?: PlanLink): PlanTask => ({ id: rid(), sessionId, title, detail, owner, due: "", status: "todo", link: link ?? blankLink(), createdBy: "us", comments: [], domain: "" });
  if (kind === "assessment") {
    const a = s("Kickoff: what we're measuring and why", "Agree on goals for the assessment and how we'll share it with your team.", ["Your goals for the assessment", "Who takes the team survey and how we'll introduce it", "Timeline and what you'll receive"]);
    const b = s("Results review", "Walk through the results together and choose the top priorities.", ["Strengths to protect", "Areas that need attention", "Choose two or three priorities"]);
    const c = s("Action planning", "Turn priorities into a 90-day plan with owners and dates.", ["Priority actions and owners", "What support is needed", "How we'll check progress"]);
    const assess: PlanLink = { type: "assessment", refId: "", label: "Organizational Wellness Assessment", url: "" };
    return {
      title: "Organizational Wellness Assessment", focus: "Understand what's wearing your people down, protect what's working, and build a realistic plan to change it.",
      sessions: [a, b, c],
      tasks: [t(a.id, "client", "Complete the leader questionnaire", "About 15 minutes.", assess), t(a.id, "client", "Share the anonymous team survey link with your staff", "Aim for most of the team to respond.", assess),
        t(a.id, "us", "Send a short message you can forward to your team about the survey"), t(b.id, "us", "Analyze results and prepare findings"),
        t(b.id, "client", "Review results before our session", "", assess), t(c.id, "us", "Draft the 90-day action plan"), t(c.id, "client", "Confirm owners for each priority")],
    };
  }
  const a = s("Session 1: Where you are and where you're going", "Get clear on your goals, your capacity, and what's getting in the way.", ["Your goals for the next 6 to 12 months", "What's working and what's draining you", "Your biggest constraint right now"]);
  const b = s("Session 2: Systems and workflows", "Map the work so it doesn't all live in your head.", ["Walk through your core processes", "Where time and energy are leaking", "What to document, delegate, or drop"]);
  const c = s("Session 3: Your roadmap", "Leave with a 90-day roadmap and clear next steps.", ["Priorities for the next 90 days", "Owners and dates", "How we'll keep momentum"]);
  return {
    title: "Your strategy plan", focus: "Clarity, structure, and growth that doesn't cost you your peace.",
    sessions: [a, b, c],
    tasks: [t(a.id, "client", "List your top 3 goals for this season"), t(a.id, "client", "Share any current plans, org charts, or process docs"), t(a.id, "us", "Send the session summary and priorities"),
      t(b.id, "client", "Track where your time goes for one week"), t(b.id, "us", "Draft your workflow map"), t(c.id, "us", "Build your 90-day roadmap"), t(c.id, "client", "Review and approve the roadmap")],
  };
}

// ---------------- assessment ----------------
export function blankAssessment(clientId: string, client?: Client | null): Assessment {
  return {
    clientId, enabled: false, status: "leader", token: randomBytes(12).toString("base64url"), closesOn: "",
    profile: { orgName: client?.name ?? "", teamSize: "", roles: "", services: "", policies: [], priorities: "", recentChanges: "", success: "", ...blankOps() },
    leaderAnswers: {}, leaderSubmittedAt: null, leaderName: "", summary: "", recommendations: [], shareComments: false, sharedAt: null, updatedAt: new Date().toISOString(),
  };
}

function blankOps() {
  return Object.fromEntries(OPS_FIELDS.map((f) => [f.key, ""])) as Record<OpsKey, string>;
}
export async function getAssessment(clientId: string): Promise<Assessment | null> {
  const a = await kv().hget<Assessment>(K.assess, clientId);
  if (!a) return null;
  // Fill in anything added after this assessment was first saved
  a.profile = { ...blankOps(), ...a.profile };
  a.recommendations = (a.recommendations ?? []).map((r) => ({ ...r, priority: PRIORITIES.some((p) => p.id === r.priority) ? r.priority : "next" }));
  return a;
}
export async function saveAssessment(a: Assessment) {
  await kv().hset(K.assess, a.clientId, { ...a, updatedAt: new Date().toISOString() });
  await kv().hset(K.tokens, a.token, a.clientId);
}
export async function assessmentByToken(token: string): Promise<Assessment | null> {
  const id = await kv().hget<string>(K.tokens, token);
  if (!id) return null;
  const a = await getAssessment(id);
  return a && a.token === token ? a : null;
}
export async function listResponses(clientId: string): Promise<TeamResponse[]> {
  return Object.values(await kv().hgetall<TeamResponse>(K.resp(clientId))).sort((a, b) => a.at.localeCompare(b.at));
}
export async function addResponse(clientId: string, r: TeamResponse) {
  await kv().hset(K.resp(clientId), r.id, r);
}
export async function deleteResponse(clientId: string, id: string) {
  await kv().hdel(K.resp(clientId), id);
}

export function cleanAnswers(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const d of DOMAINS) d.items.forEach((_, i) => {
    const k = itemKey(d.id, i);
    const v = Number((raw as Record<string, unknown>)[k]);
    if (v >= 1 && v <= 5) out[k] = Math.round(v);
  });
  return out;
}

export function cleanProfile(p: Partial<Assessment["profile"]> | undefined, prev: Assessment["profile"]): Assessment["profile"] {
  const x = p ?? {};
  return {
    orgName: str(x.orgName ?? prev.orgName, 200), teamSize: str(x.teamSize ?? prev.teamSize, 60), roles: str(x.roles ?? prev.roles, 1000),
    services: str(x.services ?? prev.services, 1000), policies: (Array.isArray(x.policies) ? x.policies : prev.policies).filter((v: string) => POLICIES.includes(v)),
    priorities: str(x.priorities ?? prev.priorities, 3000), recentChanges: str(x.recentChanges ?? prev.recentChanges, 3000), success: str(x.success ?? prev.success, 3000),
    ...(Object.fromEntries(OPS_FIELDS.map((f) => [f.key, str(x[f.key] ?? prev[f.key] ?? "", 3000)])) as Record<OpsKey, string>),
  };
}

export { ITEM_COUNT, OPEN_QUESTIONS, ROLE_GROUPS };

/** Every client's open plan tasks and sessions, for the main calendar */
export async function planCalendarItems() {
  const [plans, clients] = await Promise.all([listPlans(), listClients()]);
  const out: { id: string; clientId: string; date: string; start: string; title: string; kind: "session" | "deliverable"; href: string; detail: string }[] = [];
  for (const p of plans) {
    if (!p.enabled) continue;
    const c = clients.find((x) => x.id === p.clientId);
    if (!c || c.status === "archived") continue;
    for (const s of p.sessions) if (s.date && s.status !== "done") out.push({ id: `ps-${s.id}`, clientId: c.id, date: s.date, start: s.start, title: `${c.name}: ${s.title}`, kind: "session", href: `/admin/clients/${c.id}/plan`, detail: "Strategy session" });
    for (const t of p.tasks) if (t.due && t.status !== "done" && t.owner === "us") out.push({ id: `pt-${t.id}`, clientId: c.id, date: t.due, start: "", title: `${c.name}: ${t.title}`, kind: "deliverable", href: `/admin/clients/${c.id}/plan`, detail: "Your plan task" });
  }
  return out;
}

// ---------------- results ----------------
import { domainScores, MIN_GROUP } from "./assessment-def";
import type { ResultsData } from "@/components/portal/WorkspaceBits";

export function buildResults(a: Assessment, responses: TeamResponse[], includeComments: boolean): ResultsData {
  const team = domainScores(responses.map((r) => r.answers));
  const leader = domainScores(Object.keys(a.leaderAnswers).length ? [a.leaderAnswers] : []).map((d) => ({ id: d.id, score: d.score }));
  const roles = [...new Set(responses.map((r) => r.role))];
  const byRole = roles.map((role) => {
    const rs = responses.filter((r) => r.role === role);
    return { role, count: rs.length, scores: rs.length >= MIN_GROUP ? domainScores(rs.map((r) => r.answers)).map((d) => ({ id: d.id, score: d.score })) : [] };
  });
  return { team, leader, responses: responses.length, byRole, comments: includeComments ? responses.map((r) => r.open) : [] };
}
