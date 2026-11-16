import { getClient, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { makeFullPortal } from "@/lib/event-client";
import { getFin, saveFin } from "@/lib/finance";

// Switch someone between a guest pass (personal events) and a full client portal. Their access code stays the same.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (b.kind === "full") {
    await makeFullPortal(c);
  } else if (b.kind === "guest") {
    c.kind = "guest";
    const fin = await getFin(c.id);
    if (fin.enabled) await saveFin(c.id, { ...fin, enabled: false });
  } else return error("Bad request.");
  await saveClient(c);
  return json({ ok: true });
}
