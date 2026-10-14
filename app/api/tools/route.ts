import { currentClient, isAdmin } from "@/lib/auth";
import { getClient, rateLimit } from "@/lib/data";
import { error, json } from "@/lib/http";
import { getTool } from "@/lib/tools-def";
import { cleanData, getToolRecord, saveToolRecord } from "@/lib/tools";

// GET ?tool=<id>  (admin adds &c=<clientId> and only sees tools that are not private)
export async function GET(req: Request) {
  const u = new URL(req.url);
  const tool = getTool(u.searchParams.get("tool") || "");
  if (!tool) return error("Unknown tool.", 404);
  const c = u.searchParams.get("c");
  if (c && (await isAdmin())) {
    if (!(await getClient(c))) return error("Not found.", 404);
    const r = await getToolRecord(c, tool.id);
    return json(r.private ? { private: true, data: null } : { private: false, data: r.data, updatedAt: r.updatedAt });
  }
  const me = await currentClient();
  if (!me) return error("Please sign in again.", 401);
  return json(await getToolRecord(me.id, tool.id));
}

// Only the client saves their own tools
export async function POST(req: Request) {
  const me = await currentClient();
  if (!me) return error("Please sign in again.", 401);
  if (!(await rateLimit(`tools:${me.id}`, 600, 3600))) return error("Saving too fast. Try again in a minute.", 429);
  const b = await req.json().catch(() => null);
  const tool = getTool(String(b?.tool || ""));
  if (!tool) return error("Unknown tool.", 404);
  if (JSON.stringify(b?.data ?? null).length > 200_000) return error("That is too much to save in one tool. Try splitting it up.");
  const prev = await getToolRecord(me.id, tool.id);
  const rec = { data: b.data === undefined ? prev.data : cleanData(b.data), private: typeof b.private === "boolean" ? b.private : prev.private, updatedAt: new Date().toISOString() };
  await saveToolRecord(me.id, tool.id, rec);
  return json({ ok: true, updatedAt: rec.updatedAt, private: rec.private });
}
