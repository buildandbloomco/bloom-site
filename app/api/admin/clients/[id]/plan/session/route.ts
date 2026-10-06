import { getClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { getPlan, sanitizePlan, savePlan } from "@/lib/workspace";
import { nowET } from "@/lib/booking";
import { newId } from "@/lib/crypto";

type Ctx = { params: Promise<{ id: string }> };

// One click: start a new strategy session. Open items from the last session move forward into it.
export async function POST(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : nowET().date;
  const plan = await getPlan(id);
  const start = /^\d{2}:\d{2}$/.test(String(b.start)) ? String(b.start) : "";
  const link = /^https:\/\//i.test(String(b.link || "")) ? String(b.link).slice(0, 500) : "";
  const minutes = Number(b.minutes) || 60;

  // Put the next session on the calendar without touching today's
  if (b.schedule) {
    const nid = newId();
    plan.sessions.push({ id: nid, title: `Session ${plan.sessions.length + 1}`, date, start, status: "planned", goal: "", agenda: [], notes: "", decisions: [], resources: [], minutes, link });
    plan.enabled = true;
    const saved = await sanitizePlan(plan, plan, client);
    await savePlan(saved);
    return json({ plan: saved, sessionId: nid, carried: 0 });
  }

  // Pull open items from the session before an already scheduled one
  if (typeof b.carryInto === "string") {
    const cur = plan.sessions.find((s) => s.id === b.carryInto);
    if (!cur) return error("Session not found.", 404);
    const before = plan.sessions.filter((s) => s.id !== cur.id && s.date && (!cur.date || s.date <= cur.date)).sort((a, b2) => a.date.localeCompare(b2.date)).pop();
    let n = 0;
    if (before) {
      for (const t of plan.tasks) if (t.sessionId === before.id && t.status !== "done") { t.sessionId = cur.id; t.carriedFrom = t.carriedFrom || before.title; n++; }
      before.status = "done";
    }
    const saved = await sanitizePlan(plan, plan, client);
    await savePlan(saved);
    return json({ plan: saved, sessionId: cur.id, carried: n });
  }

  // The session before this one: the most recent dated session on or before the new date
  const prev = plan.sessions.filter((s) => s.date && s.date <= date).sort((a, b2) => a.date.localeCompare(b2.date)).pop() ?? null;
  const sid = newId();
  const n = plan.sessions.length + 1;
  let carried = 0;
  if (prev && b.carry !== false) {
    for (const t of plan.tasks) {
      if (t.sessionId === prev.id && t.status !== "done") {
        t.sessionId = sid;
        t.carriedFrom = t.carriedFrom || prev.title;
        carried++;
      }
    }
    if (b.closePrev !== false) prev.status = "done";
  }
  plan.sessions.push({
    id: sid, title: `Session ${n}`, date, start, minutes, link, status: "planned", goal: "",
    agenda: carried ? [{ id: newId(), text: `Review ${carried} open item${carried === 1 ? "" : "s"} from last time`, by: "us" }] : [],
    notes: "", decisions: [], resources: [],
  });
  plan.enabled = true;
  if (!plan.title) plan.title = "Your strategy sessions";
  const next = await sanitizePlan(plan, plan, client);
  await savePlan(next);
  return json({ plan: next, sessionId: sid, carried });
}
