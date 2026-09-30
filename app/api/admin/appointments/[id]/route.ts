import { getAppointment, saveAppointment } from "@/lib/courses";
import { cancelAppointment } from "@/lib/booking-server";
import { error, json, requireAdmin } from "@/lib/http";
import { cleanAppt } from "@/lib/appt";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const a = await getAppointment(id);
  if (!a) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const next = cleanAppt({ ...b, enrollmentId: a.enrollmentId, countsAsSession: a.countsAsSession }, a);
  await saveAppointment(next);
  return json(next);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const a = await getAppointment(id);
  if (!a) return json({ ok: true });
  await cancelAppointment(a, `Consult on ${a.date} removed from the calendar.`);
  return json({ ok: true });
}
