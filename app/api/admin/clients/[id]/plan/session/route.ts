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
    id: sid, title: `Session ${n}`, date, start: "", status: "planned", goal: "",
    agenda: carried ? [{ id: newId(), text: `Review ${carried} open item${carried === 1 ? "" : "s"} from last time`, by: "us" }] : [],
    notes: "", decisions: [], resources: [],
  });
  plan.enabled = true;
  if (!plan.title) plan.title = "Your strategy sessions";
  const next = await sanitizePlan(plan, plan, client);
  await savePlan(next);
  return json({ plan: next, sessionId: sid, carried });
}
