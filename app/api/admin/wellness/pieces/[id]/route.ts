import { deletePiece, getPiece, listPieces, savePiece } from "@/lib/library";
import { sanitizePiece } from "@/lib/wellness-sanitize";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const saved = await getPiece(id);
  if (!saved) return error("Not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const next = sanitizePiece(b, saved);
  if ((await listPieces()).some((p) => p.id !== id && p.slug === next.slug)) return error("Another piece already uses that page address.");
  await savePiece(next);
  return json(next);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  await deletePiece(id);
  return json({ ok: true });
}
