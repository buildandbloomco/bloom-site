import { getClient, saveClient } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import { listNotices, saveNotices } from "@/lib/paynotices";
import { ensureAgreement } from "@/lib/agreements";

// Confirm that a reported Zelle payment arrived (it is then recorded as paid), or dismiss it
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const list = await listNotices(id);
  const n = list.find((x) => x.id === String(b.noticeId));
  if (!n || n.status !== "pending") return error("That notice was already handled.", 404);
  if (b.action === "dismiss") n.status = "dismissed";
  else if (b.action === "confirm") {
    // You can correct the amount if what arrived was different from what they reported
    const got = b.amount === undefined || b.amount === "" ? n.amount : Math.round((Number(b.amount) || 0) * 100) / 100;
    if (got <= 0) return error("Enter the amount that arrived.");
    const addOn = got === n.amount ? n.addOnTotal : 0;
    const date = nowET().date;
    if (got - addOn > 0) c.payments.push({ id: newId(), kind: "package", amount: Math.round((got - addOn) * 100) / 100, description: `${n.label} (Zelle from ${n.name})`, date, method: "Zelle" });
    if (addOn > 0) {
      c.payments.push({ id: newId(), kind: "addon", amount: addOn, description: `Add-ons (Zelle from ${n.name})`, date, method: "Zelle" });
      c.requests.push({ id: newId(), addOnIds: n.addOnIds, note: `Paid $${addOn.toFixed(2)} for these add-ons by Zelle.`, date: new Date().toISOString(), status: "new" });
    }
    const becameActive = c.status === "draft" || c.status === "sent";
    if (becameActive) c.status = "active";
    await saveClient(c);
    if (becameActive) await ensureAgreement(c, `${c.name} made their first payment.`);
    n.status = "confirmed"; n.amount = got;
  } else return error("Bad request.");
  await saveNotices(id, list);
  return json({ ok: true });
}
