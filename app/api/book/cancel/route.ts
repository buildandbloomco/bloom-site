import { getAppointment } from "@/lib/courses";
import { cancelAppointment } from "@/lib/booking-server";
import { fmtTime, longDate, nowET, toMin } from "@/lib/booking";
import { safeEqual } from "@/lib/crypto";
import { error, json } from "@/lib/http";

// The person who booked cancels from their confirmation page
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const a = await getAppointment(String(b.id || ""));
  if (!a || !a.token || !safeEqual(a.token, String(b.t || ""))) return error("We could not find that booking.", 404);
  const now = nowET();
  if (a.date < now.date || (a.date === now.date && toMin(a.start) <= now.min)) return error("This appointment has already started.");
  await cancelAppointment(a, `${a.guestName || "They"} cancelled the consult for ${longDate(a.date)} at ${fmtTime(a.start)} ET.`);
  return json({ ok: true });
}
