import { learnerApi } from "@/lib/learn";
import { listAppointments } from "@/lib/courses";
import { buildIcs } from "@/lib/ics";

// Download all of this learner's sessions as a calendar file
export async function GET(_req: Request, ctx: { params: Promise<{ eid: string }> }) {
  const { eid } = await ctx.params;
  const x = await learnerApi(eid);
  if (!x) return new Response("Please sign in again.", { status: 401 });
  const appts = (await listAppointments()).filter((a) => a.enrollmentId === eid);
  const ics = buildIcs(`${x.course.title}`, [
    ...x.course.liveSessions.map((s) => ({ uid: `live-${s.id}`, title: `${x.course.title}: ${s.title}`, date: s.date, start: s.start, end: s.end, location: s.link || s.location, description: s.notes })),
    ...appts.map((a) => ({ uid: `appt-${a.id}`, title: a.title, date: a.date, start: a.start, end: a.end, location: a.link || a.location, description: a.notes })),
  ]);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${x.course.slug}-sessions.ics"` } });
}
