import { getClient, saveClient } from "@/lib/data";
import { sanitizeConsult } from "@/lib/consult";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; cid: string }> };

// Autosave from the consultation sheet
export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id, cid } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const i = c.consults.findIndex((x) => x.id === cid);
  if (i < 0) return error("Sheet not found.", 404);
  const body = await req.json().catch(() => null);
  if (!body) return error("Bad request.");
  c.consults[i] = sanitizeConsult(body, c.consults[i]);
  // The newest sheet decides which prices this client sees in their portal
  if (c.consults[i].tier && i === 0) c.tier = c.consults[i].tier;
  await saveClient(c);
  const s = c.consults[i];
  return json({
    ok: true,
    updatedAt: s.updatedAt,
    clientConfirmedAt: s.clientConfirmedAt,
    clientConfirmedBy: s.clientConfirmedBy,
    clientComment: s.clientComment,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id, cid } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  c.consults = c.consults.filter((x) => x.id !== cid);
  await saveClient(c);
  return json({ ok: true });
}
