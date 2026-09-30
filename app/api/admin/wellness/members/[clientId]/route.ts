import { getAccess, removeAccess, saveAccess } from "@/lib/library";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ clientId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { clientId } = await ctx.params;
  const a = await getAccess(clientId);
  if (!a) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (["active", "paused", "ended"].includes(b.status)) a.status = b.status;
  if (b.plan === "team" || b.plan === "individual") a.plan = b.plan;
  if (typeof b.teamName === "string") a.teamName = b.teamName.slice(0, 200);
  if (typeof b.founding === "boolean") a.founding = b.founding;
  await saveAccess(a);
  return json(a);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { clientId } = await ctx.params;
  await removeAccess(clientId);
  return json({ ok: true });
}
