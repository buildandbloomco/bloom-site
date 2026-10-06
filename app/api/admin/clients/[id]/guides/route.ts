import { getClient, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { GUIDES } from "@/lib/guides";

// Which guidebooks this client sees in their portal
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b || !Array.isArray(b.slugs)) return error("Bad request.");
  c.guideSlugs = GUIDES.map((g) => g.slug).filter((s) => b.slugs.includes(s));
  await saveClient(c);
  return json({ ok: true, slugs: c.guideSlugs });
}
