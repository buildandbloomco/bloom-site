import { getEnrollment, saveAppointment, saveEnrollment } from "@/lib/courses";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import { cleanAppt } from "@/lib/appt";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const a = cleanAppt(b, { id: newId(), title: "", date: "", start: "", end: "", kind: "other", clientId: "", enrollmentId: "", location: "", link: "", notes: "", countsAsSession: false, createdAt: new Date().toISOString() });
  if (!a.date) return error("Choose a date.");
  if (a.enrollmentId) {
    const e = await getEnrollment(a.enrollmentId);
    if (e) {
      a.clientId = e.clientId;
      if (a.countsAsSession) e.sessionsUsed += 1;
      if (b.requestId) e.requests = e.requests.map((r) => (r.id === b.requestId ? { ...r, status: "scheduled" } : r));
      await saveEnrollment(e);
    }
  }
  await saveAppointment(a);
  return json(a);
}
