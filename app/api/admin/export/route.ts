import { kv } from "@/lib/kv";
import { requireAdmin } from "@/lib/http";
import type { Client } from "@/lib/types";
import type { StrategyPlan } from "@/lib/plan-types";

const HASHES = ["bb:leads", "bb:courses", "bb:enrollments", "bb:appts", "bb:plans", "bb:assess", "bb:content:posts", "bb:lib:pieces", "bb:lib:members", "bb:lib:answers", "bb:lib:done", "bb:waitlist", "bb:agreements", "bb:reviews"];
const VALUES = ["bb:settings", "bb:catalog", "bb:lib:settings"];

// A full copy of everything stored in the portal, as one file you can keep somewhere safe.
// Add ?client=<id> for one client only. Portal access codes are left out on purpose.
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const only = new URL(req.url).searchParams.get("client") || "";
  const db = kv();
  const safe = (c: Client) => { const { codeEnc, codeIndex, ...rest } = c; void codeEnc; void codeIndex; return rest; };
  const allClients = await db.hgetall<Client>("bb:clients");
  const plans = await db.hgetall<StrategyPlan>("bb:plans");
  const ids = Object.keys(allClients).filter((id) => !only || id === only);
  if (only && !ids.length) return new Response("Not found", { status: 404 });

  const perClient: Record<string, unknown> = {};
  for (const id of ids) {
    const rooms: Record<string, unknown> = {};
    for (const s of plans[id]?.sessions ?? []) {
      const r = await db.hgetall(`bb:room:${id}:${s.id}`);
      if (Object.keys(r).length) rooms[s.id] = r;
    }
    perClient[id] = { teamResponses: await db.hgetall(`bb:assess:resp:${id}`), files: await db.hgetall(`bb:files:${id}`), strategyRooms: rooms };
  }

  const out: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    about: "Backup of the Build & Bloom portal. Portal access codes are not included. Uploaded files and videos are listed by link, not copied.",
    scope: only ? `client ${only}` : "everything",
    clients: Object.fromEntries(ids.map((id) => [id, safe(allClients[id])])),
    perClient,
  };
  if (only) {
    out.plan = plans[only] ?? null;
    out.assessment = await db.hget("bb:assess", only);
    out.agreements = await db.hget("bb:agreements", only);
    out.review = await db.hget("bb:reviews", only);
    const enr = await db.hgetall<{ clientId?: string }>("bb:enrollments");
    out.enrollments = Object.fromEntries(Object.entries(enr).filter(([, e]) => e.clientId === only));
    const ap = await db.hgetall<{ clientId?: string }>("bb:appts");
    out.appointments = Object.fromEntries(Object.entries(ap).filter(([, e]) => e.clientId === only));
  } else {
    for (const k of VALUES) out[k.slice(3)] = await db.get(k);
    for (const k of HASHES) out[k.slice(3)] = await db.hgetall(k);
  }
  const name = only ? `bloom-${allClients[only].slug || only}` : "bloom-backup";
  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" },
  });
}
