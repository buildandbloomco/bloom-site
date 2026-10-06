import { isAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { getPlan } from "@/lib/workspace";
import { inviteIcs, sessionMinutes } from "@/lib/invite";

// Calendar file for one strategy session (for your own calendar)
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response("Please sign in again.", { status: 401 });
  const { id } = await ctx.params;
  const client = await getClient(id);
  const s = client ? (await getPlan(id)).sessions.find((x) => x.id === new URL(req.url).searchParams.get("sid")) : null;
  if (!client || !s || !s.date) return new Response("Not found", { status: 404 });
  const ics = inviteIcs({ uid: `ps-${s.id}`, title: `${client.name}: ${s.title}`, date: s.date, start: s.start, minutes: sessionMinutes(s), link: s.link || "", description: [s.goal, s.link ? `Join: ${s.link}` : ""].filter(Boolean).join("\n") });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="strategy-session.ics"` } });
}
