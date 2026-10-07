import { getSettings, saveSettings } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import type { BookingSettings, Settings } from "@/lib/types";

const n = (v: unknown, min: number, max: number, dflt: number) => {
  const x = Math.round(Number(v));
  return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : dflt;
};
const hhmm = (v: unknown) => (/^\d{2}:\d{2}$/.test(String(v)) ? String(v) : "");

function cleanBooking(b: Partial<BookingSettings> | undefined, cur: BookingSettings): BookingSettings {
  if (!b) return cur;
  return {
    enabled: !!b.enabled,
    hours: (Array.isArray(b.hours) ? b.hours : [])
      .map((h) => ({ day: n(h.day, 0, 6, 1), start: hhmm(h.start), end: hhmm(h.end) }))
      .filter((h) => h.start && h.end && h.start < h.end)
      .slice(0, 28),
    consultMinutes: n(b.consultMinutes, 10, 240, 30),
    sessionMinutes: n(b.sessionMinutes, 10, 480, 60),
    bufferMinutes: n(b.bufferMinutes, 0, 120, 15),
    noticeHours: n(b.noticeHours, 0, 336, 24),
    daysAhead: n(b.daysAhead, 1, 180, 30),
    maxPerDay: n(b.maxPerDay, 0, 20, 0),
    consultTitle: str(b.consultTitle, 120),
    consultIntro: str(b.consultIntro, 1000),
    meetingLink: /^https?:\/\//.test(str(b.meetingLink)) ? str(b.meetingLink, 500) : "",
    location: str(b.location, 200),
    blockedDates: (Array.isArray(b.blockedDates) ? b.blockedDates : []).map(String).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 200),
  };
}

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max);
const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x)).filter((x) => x.trim()) : []);

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const cur = await getSettings();
  const next: Settings = {
    ...cur,
    brandName: str(b.brandName, 120) || cur.brandName,
    tagline: str(b.tagline),
    email: str(b.email, 200),
    phone: str(b.phone, 60),
    website: str(b.website, 300),
    instagram: str(b.instagram, 300),
    location: str(b.location, 120),
    bookingUrl: str(b.bookingUrl, 500),
    bookingEmbed: !!b.bookingEmbed,
    zelle: str(b.zelle, 120).trim(),
    zelleName: str(b.zelleName, 120).trim(),
    beforeYouBook: list(b.beforeYouBook),
    defaultNextSteps: list(b.defaultNextSteps),
    booking: cleanBooking(b.booking, cur.booking),
  };
  await saveSettings(next);
  return json(next);
}
