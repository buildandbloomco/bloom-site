import { currentClient } from "@/lib/auth";
import { amountPaid, getCatalog, getSettings, rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";
import { buildCharge, payChoices, type PayOption } from "@/lib/pricing";
import { pricedFor } from "@/lib/tier";
import { blocksPayment, listAgreements } from "@/lib/agreements";
import { getProposal } from "@/lib/proposals";
import { listNotices, saveNotices } from "@/lib/paynotices";
import { notifyAdmin } from "@/lib/notify";

// The client says they sent a Zelle payment. Nothing is recorded as paid until you confirm it arrived.
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (client.billing === "none") return error("There is nothing to pay on this account.");
  const settings = await getSettings();
  if (!settings.zelle) return error("Zelle is not available right now. Please pay by card or reach out.", 400);
  if ((await getProposal(client.id))?.status === "sent") return error("Please accept your proposal first. You will find it at the top of your portal.");
  if (blocksPayment(await listAgreements(client.id))) return error("Please sign your agreement first. You will find it at the top of your portal.");
  if (!(await rateLimit(`zelle:${client.id}`, 10, 60 * 60))) return error("Too many tries. Try again later.", 429);

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return error("Please add the name on the Zelle account you sent from.");
  const catalog = await getCatalog();
  const offered = new Set(client.addOnIds);
  const addOns = pricedFor(catalog.services, client.tier).filter((sv) => sv.kind === "addon" && sv.active && offered.has(sv.id) && (Array.isArray(body.addOnIds) ? body.addOnIds : []).includes(sv.id) && typeof sv.price === "number");
  const paid = amountPaid(client);
  const option = String(body.option) as PayOption;
  const charge = buildCharge({ inv: client.investment, paid, option, customAmount: Number(body.customAmount), addOns, packageTitle: client.package.title });
  if (charge.error) return error(charge.error);
  const list = await listNotices(client.id);
  if (list.some((n) => n.status === "pending" && n.amount === charge.total)) return error("You already told us about a Zelle payment for this amount. We will confirm it as soon as it arrives.");
  const addOnTotal = addOns.reduce((t, a) => t + (a.price || 0), 0);
  const label = payChoices(client.investment, paid).find((c) => c.id === option)?.label || "Payment";
  await saveNotices(client.id, [{ id: newId(), at: new Date().toISOString(), method: "zelle", amount: charge.total, packageAmount: Math.round((charge.total - addOnTotal) * 100) / 100, addOnTotal, addOnIds: addOns.map((a) => a.id), label, name, note: String(body.note || "").trim().slice(0, 500), status: "pending" }, ...list]);
  await notifyAdmin(`${client.name} says they sent $${charge.total.toFixed(2)} by Zelle`, [`${name} reported a Zelle payment of $${charge.total.toFixed(2)} (${label}).`, "Check your bank, then confirm it on their Meeting view so it counts toward their balance."], `/admin/clients/${client.id}/desk`);
  return json({ ok: true, amount: charge.total });
}
