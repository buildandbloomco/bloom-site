import { deleteEnrollment, getEnrollment, saveEnrollment } from "@/lib/courses";
import { activate } from "@/lib/enroll";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const e = await getEnrollment(id);
  if (!e) return error("Enrollment not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (["pending", "active", "completed", "paused"].includes(b.status)) {
    if (b.status === "active") await activate(e);
    e.status = b.status;
    if (b.status === "completed" && !e.completedAt) e.completedAt = new Date().toISOString();
  }
  if (b.sessionsIncluded !== undefined) e.sessionsIncluded = Math.max(0, Math.round(Number(b.sessionsIncluded) || 0));
  if (b.sessionsUsed !== undefined) e.sessionsUsed = Math.max(0, Math.round(Number(b.sessionsUsed) || 0));
  if (typeof b.notes === "string") e.notes = b.notes.slice(0, 20000);
  if (typeof b.comped === "boolean") e.comped = b.comped;
  if (b.requestId) e.requests = e.requests.map((r) => (r.id === b.requestId ? { ...r, status: b.requestStatus === "closed" ? "closed" : "scheduled" } : r));
  await saveEnrollment(e);
  return json(e);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  await deleteEnrollment(id);
  return json({ ok: true });
}
