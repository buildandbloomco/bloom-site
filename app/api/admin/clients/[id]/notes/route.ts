import { getClient, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";

// Private notes from the meeting view. Only you ever see these.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b || typeof b.notes !== "string") return error("Bad request.");
  c.notes = b.notes.slice(0, 20000);
  await saveClient(c);
  return json({ ok: true });
}
