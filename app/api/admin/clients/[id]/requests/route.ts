import { getClient, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const b = await req.json().catch(() => ({}));
  const status = ["new", "seen", "done"].includes(b.status) ? b.status : "seen";
  c.requests = c.requests.map((r) => (r.id === b.requestId ? { ...r, status } : r));
  await saveClient(c);
  return json({ requests: c.requests });
}
