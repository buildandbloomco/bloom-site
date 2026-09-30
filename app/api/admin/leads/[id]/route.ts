import { deleteLead, getLead, saveLead } from "@/lib/leads";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const lead = await getLead(id);
  if (!lead) return error("Lead not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (["new", "contacted", "converted", "closed"].includes(b.status)) lead.status = b.status;
  if (typeof b.notes === "string") lead.notes = b.notes.slice(0, 20000);
  await saveLead(lead);
  return json(lead);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  await deleteLead(id);
  return json({ ok: true });
}
