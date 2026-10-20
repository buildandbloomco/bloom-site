import { getSettings, rateLimit } from "@/lib/data";
import { clientIp, error, json, siteOrigin } from "@/lib/http";
import { newId, sign } from "@/lib/crypto";
import { listLeads, saveLead } from "@/lib/leads";
import { notifyAdmin } from "@/lib/notify";
import { stripe } from "@/lib/stripe";
import { dlToken, fulfill, getProduct, saveOrder } from "@/lib/shop";
import { priceLabel, type Order } from "@/lib/shop-def";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

// Someone buys (or downloads a free) product from the shop
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`shop:${ip}`, 15, 3600))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => ({}));
  if (str(b.company_url)) return json({ ok: true });
  const p = await getProduct(str(b.productId, 80));
  if (!p || p.status !== "live") return error("That product isn't available.", 404);
  const name = str(b.name, 120), email = str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email. Your download link goes there.");
  const method: Order["method"] = p.price <= 0 ? "free" : b.method === "zelle" ? "zelle" : "card";
  const settings = await getSettings();
  if (method === "zelle" && !settings.zelle) return error("Zelle isn't available right now. Please pay by card.");
  const s = method === "card" ? stripe() : null;
  if (method === "card" && !s) return error(settings.zelle ? "Card payments aren't turned on yet. Please choose Zelle." : "Online payment isn't available yet. Please check back soon.", 503);

  // Everyone becomes a lead, so you can follow up
  const now = new Date().toISOString();
  const existing = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase());
  const lead: Lead = existing ?? { id: newId(), createdAt: now, status: "new", lane: "business", name, email, phone: "", organization: "", role: "", website: "", interests: [], goals: "", challenges: "", budget: "", timeline: "", heardFrom: "Shop", assessment: null, notes: "", clientId: null };
  const tag = `Shop: ${p.title}${p.price > 0 ? "" : " (free)"}`;
  if (!lead.interests.includes(tag)) lead.interests.push(tag);
  await saveLead(lead);

  const order: Order = { id: newId(), at: now, productId: p.id, title: p.title, amount: p.price, method, status: "pending", name, email, clientId: "" };
  await saveOrder(order);
  const thanks = (o: Order) => `/shop/thanks?o=${o.id}&k=${encodeURIComponent(sign(o.id, 30 * 24 * 3600))}`;

  if (method === "free") {
    const { order: done } = await fulfill(order);
    if (!existing) await notifyAdmin(`${name} downloaded ${p.title}`, [`${name} (${email}) downloaded the free ${p.title} from your shop.`], `/admin/leads/${lead.id}`);
    return json({ ok: true, thanks: thanks(done), download: `/api/shop/download?t=${encodeURIComponent(dlToken(done.id, p.id))}` });
  }
  if (method === "zelle") {
    await notifyAdmin(`${name} is paying ${priceLabel(p)} by Zelle for ${p.title}`, [`${name} (${email}) ordered ${p.title} from your shop and is paying by Zelle.`, "When it arrives, confirm it in Admin, then Shop, then Orders. That sends their download and opens their portal."], "/admin/shop");
    return json({ ok: true, zelle: { to: settings.zelle, name: settings.zelleName || settings.brandName, amount: p.price, memo: `${name.split(/\s+/)[0]} ${p.title}` }, thanks: thanks(order) });
  }
  const origin = await siteOrigin();
  const session = await s!.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(p.price * 100), product_data: { name: p.title, description: p.subtitle.slice(0, 200) || undefined } } }],
    metadata: { kind: "shop", orderId: order.id },
    success_url: `${origin}/api/shop/done?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/${p.slug}?canceled=1`,
  });
  return json({ ok: true, checkout: session.url });
}
