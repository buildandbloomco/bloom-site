import { getAppointment } from "@/lib/courses";
import { getSettings } from "@/lib/data";
import { buildIcs } from "@/lib/ics";
import { safeEqual } from "@/lib/crypto";

// "Add to my calendar" file for the person who booked
export async function GET(req: Request) {
  const u = new URL(req.url);
  const a = await getAppointment(u.searchParams.get("id") || "");
  if (!a || !a.token || !safeEqual(a.token, u.searchParams.get("t") || "")) return new Response("Not found", { status: 404 });
  const s = await getSettings();
  const title = a.kind === "consult" ? `${s.booking.consultTitle || "Consult"} with ${s.brandName}` : `Session with ${s.brandName}`;
  const ics = buildIcs(s.brandName, [{ uid: a.id, title, date: a.date, start: a.start, end: a.end, location: a.link || a.location, description: a.link ? `Join: ${a.link}` : "" }]);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="build-and-bloom.ics"` } });
}
