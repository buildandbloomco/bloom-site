import { getClient, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { listEvents } from "@/lib/events";
import { matchEvent } from "@/lib/ledger";
import { listNotices, saveNotices } from "@/lib/paynotices";

const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

// Mark a seat as a gift (when the gift details weren't saved at checkout), so the guest list shows who's coming
// and the gift certificate is ready to print
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const slug = str(b.slug, 60), clientId = str(b.clientId, 60), tier = str(b.tier, 120);
  const gift = { to: str(b.to, 120), email: str(b.email), note: str(b.note, 160) };
  if (!gift.to) return error("Add the name of the person the seat is for.");
  if (gift.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gift.email)) return error("Check her email, or leave it blank.");
  const c = await getClient(clientId);
  if (!c) return error("Not found.", 404);
  const events = await listEvents();
  const mine = (x: { description?: string; label?: string; event?: { slug: string; tierId: string } }) => { const m = matchEvent(events, x); return m?.e.slug === slug && (!tier || m.t?.name === tier); };
  // The most recent seat payment without a gift, or else a pending Zelle for the seat
  const p = [...c.payments].reverse().find((x) => !x.gift && mine(x));
  if (p) { p.gift = gift; await saveClient(c); return json({ ok: true }); }
  const list = await listNotices(c.id);
  const n = list.find((x) => x.status === "pending" && !x.gift && mine(x));
  if (n) { n.gift = gift; await saveNotices(c.id, list); return json({ ok: true }); }
  return error("There's no paid or pending seat to mark as a gift.", 404);
}
