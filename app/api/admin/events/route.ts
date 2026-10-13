import { getCatalog } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { cleanEvents, listEvents, saveEvents } from "@/lib/events";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json({ events: await listEvents() });
}

// Save every event offer at once (the editor sends the whole list)
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  const ids = new Set((await getCatalog()).services.map((s) => s.id));
  const events = cleanEvents(b?.events, ids);
  if (typeof events === "string") return error(events);
  await saveEvents(events);
  return json({ ok: true, events });
}
