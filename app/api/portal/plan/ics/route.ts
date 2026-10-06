import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { siteOrigin } from "@/lib/http";
import { getPlan } from "@/lib/workspace";
import { inviteIcs, sessionMinutes } from "@/lib/invite";

// "Add to my calendar" for a client's strategy session
export async function GET(req: Request) {
  const client = await currentClient();
  if (!client) return new Response("Please sign in again.", { status: 401 });
  const plan = await getPlan(client.id);
  const s = plan.enabled ? plan.sessions.find((x) => x.id === new URL(req.url).searchParams.get("sid")) : null;
  if (!s || !s.date) return new Response("Not found", { status: 404 });
  const [settings, origin] = await Promise.all([getSettings(), siteOrigin()]);
  const room = `${origin}/p/${client.slug}/room/${s.id}`;
  const ics = inviteIcs({ uid: `ps-${s.id}`, title: `${s.title} with ${settings.brandName}`, date: s.date, start: s.start, minutes: sessionMinutes(s), link: s.link || "", description: [s.goal, s.link ? `Join the call: ${s.link}` : "", `Your strategy room: ${room}`].filter(Boolean).join("\n") });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="strategy-session.ics"` } });
}
