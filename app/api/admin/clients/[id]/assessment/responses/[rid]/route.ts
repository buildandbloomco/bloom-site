import { error, json, requireAdmin } from "@/lib/http";
import { deleteResponse, getAssessment } from "@/lib/workspace";

type Ctx = { params: Promise<{ id: string; rid: string }> };

// Remove a test or duplicate response
export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id, rid } = await ctx.params;
  if (!(await getAssessment(id))) return error("Not found.", 404);
  await deleteResponse(id, rid);
  return json({ ok: true });
}
