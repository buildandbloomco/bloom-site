import { deleteWaitlistEntry, getWaitlistEntry, saveWaitlistEntry } from "@/lib/waitlist";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const e = await getWaitlistEntry(id);
  if (!e) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (["waiting", "invited", "joined"].includes(b.status)) e.status = b.status;
  await saveWaitlistEntry(e);
  return json(e);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  await deleteWaitlistEntry(id);
  return json({ ok: true });
}
