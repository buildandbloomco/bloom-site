import { deleteContent, getContent, sanitizeContent, saveContent } from "@/lib/content";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const saved = await getContent(id);
  if (!saved) return error("Not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return error("Bad request.");
  const next = sanitizeContent({ ...saved, ...b }, saved);
  await saveContent(next);
  return json(next);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  await deleteContent(id);
  return json({ ok: true });
}
