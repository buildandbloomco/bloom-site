import { calendarFeedKey, safeEqual } from "@/lib/crypto";
import { calendarItems } from "@/lib/calendar";
import { buildIcs } from "@/lib/ics";

// Private calendar subscription (Google Calendar, Apple Calendar, Outlook). The link contains a secret key.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!safeEqual(key, calendarFeedKey())) return new Response("Not found", { status: 404 });
  const items = (await calendarItems()).filter((i) => i.kind !== "payment");
  const ics = buildIcs("Build & Bloom Collective", items.map((i) => ({ uid: i.id, title: i.title, date: i.date, start: i.start, end: i.end, location: i.link, description: i.detail })));
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } });
}
