import { getSettings, rateLimit, saveClient } from "@/lib/data";
import { clientIp, error, json, siteOrigin } from "@/lib/http";
import { newId } from "@/lib/crypto";
import { listLeads, saveLead } from "@/lib/leads";
import { notifyAdmin } from "@/lib/notify";
import { stripe } from "@/lib/stripe";
import { startClientSession } from "@/lib/auth";
import { eventClient } from "@/lib/event-client";
import { ensureAgreement } from "@/lib/agreements";
import { listNotices, saveNotices } from "@/lib/paynotices";
import { BLOOM_CHECK, earlyOn, isGuestEvent, tierPrice, usd } from "@/lib/event-def";
import { eventAccess, getEvent, spotsLeft, takeSpot } from "@/lib/events";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

// A guest picks an offer and pays by card or tells us they are paying by Zelle. They become a client right away.
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`eventbuy:${ip}`, 12, 60 * 60))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => ({}));
  const ev = await eventAccess(str(b.slug, 60));
  if (!ev) return error("This offer has closed, or you need to enter the room code again.", 403);
  const tier = ev.tiers.find((t) => t.id === str(b.tierId, 40));
  if (!tier) return error("Choose an offer.");
  const name = str(b.name, 120), email = str(b.email, 200), phone = str(b.phone, 40), business = str(b.business, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email. Your receipt and portal details go there.");
  if (b.agree !== true) return error("Please check the box to agree to the terms.");
  // A seat bought as a gift for someone else
  const gb = (ev.giftable && b.gift && typeof b.gift === "object" ? b.gift : null) as Record<string, unknown> | null;
  const gift = gb ? { to: str(gb.to, 120), email: str(gb.email, 200), note: str(gb.note, 160) } : null;
  if (gift && !gift.to) return error("Please add the name of the person you are gifting this seat to.");
  if (gift?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gift.email)) return error("Please check her email, or leave it blank.");
  const giftLine = gift ? `GIFT: this seat is for ${gift.to}${gift.email ? ` (${gift.email})` : " (no email given, send details to the buyer)"}${gift.note ? `. Note: "${gift.note}"` : ""}.` : "";
  const certUrl = gift ? `/event/${ev.slug}/gift?to=${encodeURIComponent(gift.to)}&from=${encodeURIComponent(name)}${gift.note ? `&note=${encodeURIComponent(gift.note)}` : ""}` : "";
  const method = b.method === "zelle" ? "zelle" : "card";
  const full = await getEvent(ev.slug);
  const fullTier = full?.tiers.find((t) => t.id === tier.id);
  const left = fullTier ? await spotsLeft(fullTier) : null;
  if (left === 0) return error("All the spots for this offer are taken. Ask Jadon about the waitlist.");
  const deposit = (tier.depositOnly || b.pay === "deposit") && tier.deposit ? tier.deposit : 0;
  const price = tierPrice(tier);
  const early = earlyOn(tier);
  const amount = deposit || price;
  const label = `${ev.name} offer: ${tier.name}${deposit ? " (deposit)" : ""}`;
  const settings = await getSettings();
  if (method === "zelle" && !settings.zelle) return error("Zelle isn't available right now. Please pay by card.");
  const s = method === "card" ? stripe() : null;
  if (method === "card" && !s) return error(settings.zelle ? "Card payments aren't turned on yet. Please choose Zelle." : "Online payment isn't available yet. Please see Jadon.", 503);

  // Their Bloom Check answers, if they took it
  const check = (b.check && typeof b.check === "object" ? b.check : {}) as Record<string, unknown>;
  const scored = BLOOM_CHECK.map((q) => ({ q, n: Math.min(5, Math.max(0, Number(check[q.id]) || 0)) })).filter((x) => x.n > 0);
  const checkLine = scored.length ? `Bloom Check: ${scored.map((x) => `${x.q.area} ${x.n}/5`).join(", ")}` : "";

  // Lead record, so you can follow up with everyone, paid or not
  const now = new Date().toISOString();
  const existingLead = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase());
  const tag = `${ev.name}: ${tier.name}`;
  const lead: Lead = existingLead ?? {
    id: newId(), createdAt: now, status: "new", lane: "business", name, email, phone, organization: business, role: "", website: "",
    interests: [], goals: "", challenges: "", budget: "", timeline: "", heardFrom: ev.name, assessment: null, notes: giftLine, clientId: null,
  };
  if (!lead.interests.includes(tag)) lead.interests.push(tag);
  if (checkLine && !lead.challenges.includes(checkLine)) lead.challenges = [lead.challenges, checkLine].filter(Boolean).join("\n");
  if (!lead.phone) lead.phone = phone;
  if (!lead.organization) lead.organization = business;

  // Their client portal
  const guestEv = isGuestEvent(ev);
  const first = name.split(/\s+/)[0] || name;
  const { client, created, setUp } = await eventClient(ev, tier, {
    name, email, business,
    welcome: guestEv ? `Welcome, ${first}! Your seat at ${ev.name} is saved. Your ticket and everything you need for the day are right here.` : `Welcome, ${first}! It was so good to be in the room with you at ${ev.name}. Everything from here lives in this portal.`,
  });
  if (setUp) {
    // A guest upgrading to a full portal keeps what they already paid for (their ticket) on the bill
    const prev = created ? null : client.investment;
    const line = { label: `${tier.name}, ${ev.name} ${early ? "decide-today " : ""}price`, amount: price };
    client.investment = prev && prev.total > 0
      ? { total: prev.total + price, retainer: prev.total + (deposit || price), lineItems: [...prev.lineItems, line], note: deposit ? tier.depositNote || "" : prev.note }
      : { total: price, retainer: deposit || price, lineItems: [line], note: deposit ? tier.depositNote || "" : "" };
    client.notes = [client.notes, `Came from ${ev.name} (${now.slice(0, 10)}). Chose ${tier.name}${deposit ? " with a deposit" : ""}, paying by ${method === "zelle" ? "Zelle" : "card"}.`, giftLine, checkLine].filter(Boolean).join("\n");
    // Card: the portal waits as "sent" until the payment clears, then becomes active (and gets its agreement) automatically
    if (method === "card") client.status = "sent";
    await saveClient(client);
    if (tier.agreement && method === "zelle") await ensureAgreement(client, `${client.name} chose ${tier.name} at ${ev.name}.`);
  }
  lead.clientId = client.id;
  lead.status = "converted";
  await saveLead(lead);

  if (method === "zelle") {
    const list = await listNotices(client.id);
    if (!list.some((n) => n.status === "pending" && n.amount === amount))
      await saveNotices(client.id, [{ id: newId(), at: now, method: "zelle", amount, packageAmount: amount, addOnTotal: 0, addOnIds: [], label, name: str(b.zelleName, 120) || name, note: `${tag}${phone ? `. Phone ${phone}` : ""}`, status: "pending", event: { slug: ev.slug, tierId: tier.id }, ...(gift ? { gift } : {}) }, ...list]);
    if (tier.spots && tier.pool) await takeSpot(tier.pool, { ref: `zelle:${client.id}:${tier.id}`, clientId: client.id, at: now, event: ev.slug });
    await notifyAdmin(`${name} chose ${tier.name} and is paying ${usd(amount)} by Zelle`, [`${name} (${email}${phone ? `, ${phone}` : ""}) chose ${tier.name} at ${ev.name}.`, "Check your bank, then confirm the Zelle payment on their Meeting view.", giftLine, checkLine], `/admin/clients/${client.id}/desk`);
    if (created) await startClientSession(client.id);
    return json({ ok: true, zelle: { to: settings.zelle, name: settings.zelleName || settings.brandName, amount, memo: `${name.split(/\s+/)[0]} ${tier.name}` }, welcome: created ? `/event/${ev.slug}/welcome?t=${tier.id}&z=1${gift ? `&g=${encodeURIComponent(gift.to)}&gf=${encodeURIComponent(name)}${gift.note ? `&gn=${encodeURIComponent(gift.note)}` : ""}` : ""}` : null, cert: certUrl || null });
  }

  const origin = await siteOrigin();
  const session = await s!.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(amount * 100), product_data: { name: `${tier.name}${deposit ? " (deposit)" : ""}`, description: `Build & Bloom, ${ev.name} price` } } }],
    metadata: { kind: "event", slug: ev.slug, tierId: tier.id, clientId: client.id, packageAmount: String(amount), optionLabel: label, payerName: name, newClient: created ? "1" : "", noAgreement: tier.agreement ? "" : "1", pool: tier.spots && tier.pool ? tier.pool : "", ...(gift ? { giftFor: gift.to.slice(0, 120), giftNote: gift.note.slice(0, 160), giftEmail: gift.email.slice(0, 200) } : {}) },
    success_url: `${origin}/api/event/done?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/event/${ev.slug}?canceled=1`,
  });
  return json({ ok: true, checkout: session.url });
}
