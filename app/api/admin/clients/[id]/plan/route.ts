import { getClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { getPlan, planTemplate, sanitizePlan, savePlan } from "@/lib/workspace";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const prev = await getPlan(id);
  const next = await sanitizePlan(b, prev, client);
  await savePlan(next);
  return json(next);
}

// Start from a template: adds its sessions and tasks to the plan
export async function POST(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const tpl = planTemplate(b.template === "assessment" ? "assessment" : "strategy");
  const prev = await getPlan(id);
  const merged = { ...prev, enabled: true, title: prev.sessions.length ? prev.title : tpl.title, focus: prev.focus || tpl.focus, sessions: [...prev.sessions, ...tpl.sessions], tasks: [...prev.tasks, ...tpl.tasks] };
  const next = await sanitizePlan(merged, prev, client);
  await savePlan(next);
  return json(next);
}
