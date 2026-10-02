import { getClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { getAssessment, getPlan, sanitizePlan, saveAssessment, savePlan } from "@/lib/workspace";
import { newId } from "@/lib/crypto";

type Ctx = { params: Promise<{ id: string }> };

// Turn an assessment recommendation into a task on the client's strategy plan
export async function POST(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const [client, a] = await Promise.all([getClient(id), getAssessment(id)]);
  if (!client || !a) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const rec = a.recommendations.find((r) => r.id === String(b.recId));
  if (!rec) return error("Save the recommendation first.");
  const plan = await getPlan(id);
  const taskId = newId();
  plan.enabled = true;
  plan.tasks.push({
    id: taskId, sessionId: plan.sessions.some((s) => s.id === b.sessionId) ? String(b.sessionId) : "", title: rec.title, detail: rec.detail,
    owner: b.owner === "us" ? "us" : "client", due: /^\d{4}-\d{2}-\d{2}$/.test(String(b.due)) ? String(b.due) : "", status: "todo",
    link: { type: "assessment", refId: "", label: "", url: "" }, createdBy: "us", comments: [], domain: rec.domain,
  });
  const next = await sanitizePlan(plan, plan, client);
  await savePlan(next);
  rec.taskId = taskId;
  await saveAssessment(a);
  return json({ ok: true, taskId, assessment: a });
}
