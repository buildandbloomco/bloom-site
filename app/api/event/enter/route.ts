import { rateLimit } from "@/lib/data";
import { clientIp, error, json } from "@/lib/http";
import { eventOpen } from "@/lib/event-def";
import { checkEventCode, getEvent, grantEvent } from "@/lib/events";

// A guest types the room code said at the event
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`event:${ip}`, 15, 15 * 60))) return error("Too many tries. Please wait a few minutes.", 429);
  const b = await req.json().catch(() => ({}));
  const e = await getEvent(String(b.slug || ""));
  if (!e) return error("This page isn't available.", 404);
  if (!eventOpen(e)) return error("These offers have closed.", 410);
  if (!checkEventCode(e, String(b.code || ""))) return error("That code didn't match. Listen for the room code, or ask Jadon.", 401);
  await grantEvent(e);
  return json({ ok: true });
}
