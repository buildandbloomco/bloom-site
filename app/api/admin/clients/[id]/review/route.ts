import { getClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { saveReview } from "@/lib/reviews";

const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));

// Save your write-up for a progress review, and choose whether the client can see it
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!(await getClient(id))) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (!isDate(b.from) || !isDate(b.to) || b.from > b.to) return error("Pick a valid date range.");
  const r = { from: String(b.from), to: String(b.to), summary: String(b.summary ?? "").slice(0, 6000), next: String(b.next ?? "").slice(0, 6000), sharedAt: b.share ? new Date().toISOString() : null };
  await saveReview(id, r);
  return json(r);
}
