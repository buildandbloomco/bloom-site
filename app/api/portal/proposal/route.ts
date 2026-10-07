import { currentClient, isAdmin } from "@/lib/auth";
import { rateLimit, saveClient } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { clientIp, error, json } from "@/lib/http";
import { getProposal, saveProposal } from "@/lib/proposals";
import { isExpired, optionTotal } from "@/lib/proposal-def";
import { ensureAgreement } from "@/lib/agreements";
import { notifyAdmin } from "@/lib/notify";

// The client says yes to their proposal and picks an option. That option becomes their package and investment.
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (await isAdmin()) return error("You are previewing as the admin. Only the client can accept, from their own browser.", 403);
  if (!(await rateLimit(`accept:${client.id}`, 20, 60 * 60))) return error("Too many tries. Try again later.", 429);
  const p = await getProposal(client.id);
  if (!p || p.status === "draft") return error("We could not find your proposal.", 404);
  if (p.status === "accepted") return error("This proposal is already accepted.");
  if (isExpired(p, nowET().date)) return error("This proposal has expired. Reach out and we will send an updated one.", 410);
  const b = await req.json().catch(() => ({}));
  const o = p.options.find((x) => x.id === String(b.optionId));
  if (!o) return error("Choose an option first.");
  const name = String(b.name || "").trim().slice(0, 120);
  if (name.length < 3 || !/\s/.test(name)) return error("Type your full name to accept.");
  if (b.agree !== true) return error("Check the box to confirm.");
  // If the numbers changed while they had the page open, they must see the new ones
  if (Number(b.total) !== optionTotal(o)) return error("This proposal was updated while you had it open. Refresh the page to see the latest version.", 409);

  p.status = "accepted"; p.acceptedAt = new Date().toISOString(); p.acceptedOptionId = o.id;
  p.acceptedName = name; p.acceptedTitle = String(b.title || "").trim().slice(0, 120); p.acceptedIp = await clientIp();
  await saveProposal(client.id, p);

  client.package.title = p.options.length > 1 || !client.package.title ? o.name : client.package.title;
  if (o.summary) client.package.summary = o.summary;
  client.package.serviceIds = [...o.serviceIds];
  client.package.customItems = o.customItems.map((i) => ({ ...i }));
  client.investment.lineItems = o.lineItems.map((l) => ({ ...l }));
  client.investment.total = optionTotal(o);
  client.investment.retainer = Math.min(o.retainer, client.investment.total);
  if (client.status === "draft" || client.status === "sent") client.status = "active";
  await saveClient(client);
  await ensureAgreement(client, `${client.name} accepted their proposal.`);
  await notifyAdmin(`${client.name} accepted the proposal`, [`${name}${p.acceptedTitle ? `, ${p.acceptedTitle}` : ""} accepted "${o.name}" for ${client.name}.`, `Total $${optionTotal(o).toLocaleString("en-US")}${o.retainer ? `, retainer $${o.retainer.toLocaleString("en-US")}` : ""}.`], `/admin/clients/${client.id}/proposal`);
  return json({ ok: true });
}
