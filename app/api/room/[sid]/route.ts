import { currentClient, isAdmin } from "@/lib/auth";
import { getClient, rateLimit } from "@/lib/data";
import { error, json } from "@/lib/http";
import { getPlan } from "@/lib/workspace";
import { applyOps, applyTaskOps, publishRecap, readRoom, seedRoom, sessionTasks, touchPresence } from "@/lib/room";
import type { Role } from "@/lib/room-def";

type Ctx = { params: Promise<{ sid: string }> };

/** Who is asking: you (signed in to admin, naming the client) or the client themselves */
async function who(clientId: string | null) {
  if (clientId && (await isAdmin())) {
    const client = await getClient(clientId);
    return client ? { role: "us" as Role, client } : null;
  }
  const client = await currentClient();
  return client && client.status !== "archived" ? { role: "client" as Role, client } : null;
}

// Both browsers ask this every couple of seconds. It returns only what changed since they last asked.
export async function GET(req: Request, ctx: Ctx) {
  const { sid } = await ctx.params;
  const u = new URL(req.url);
  const me = await who(u.searchParams.get("c"));
  if (!me) return error("Please sign in again.", 401);
  const plan = await getPlan(me.client.id);
  const session = plan.sessions.find((s) => s.id === sid);
  if (!session || (me.role === "client" && !plan.enabled)) return error("That session isn't available.", 404);
  const now = Date.now(); // taken before reading, so nothing written during the read is ever skipped
  let room = await readRoom(me.client.id, sid);
  if (me.role === "us" && !room["f:seeded"]) { await seedRoom(me.client.id, sid); room = await readRoom(me.client.id, sid); }
  if (u.searchParams.get("p")) await touchPresence(me.client.id, sid, me.role, u.searchParams.get("e") || "");
  const since = Number(u.searchParams.get("since")) || 0;
  const entries: Record<string, unknown> = {};
  for (const [k, e] of Object.entries(room)) {
    if (k.startsWith("~")) continue;
    if (k.startsWith("p:") && me.role !== "us") continue;
    if (e.at > since) entries[k] = e;
  }
  const other = room[me.role === "us" ? "~client" : "~us"];
  return json({
    now, entries,
    other: other ? { here: now - other.at < 25000, editing: now - other.at < 8000 ? other.v : "" } : { here: false, editing: "" },
    tasks: sessionTasks(plan.tasks, sid),
    session: { title: session.title, date: session.date, status: session.status },
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { sid } = await ctx.params;
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const me = await who(typeof b.c === "string" ? b.c : null);
  if (!me) return error("Please sign in again.", 401);
  if (me.role === "client" && !(await rateLimit(`room:${me.client.id}`, 2400, 60 * 60))) return error("Too many changes at once. Give it a minute.", 429);
  const plan = await getPlan(me.client.id);
  const session = plan.sessions.find((s) => s.id === sid);
  if (!session || (me.role === "client" && !plan.enabled)) return error("That session isn't available.", 404);
  if (me.role === "client" && session.status === "done") return error("This session is closed.", 403);
  if (Array.isArray(b.ops) && b.ops.length) await applyOps(me.client.id, sid, me.role, b.ops);
  if (Array.isArray(b.tasks) && b.tasks.length) await applyTaskOps(me.client, sid, me.role, b.tasks);
  if (b.publish && me.role === "us") await publishRecap(me.client, sid, !!b.close);
  return json({ ok: true, now: Date.now() });
}
