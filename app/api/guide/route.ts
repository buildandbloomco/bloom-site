import { rateLimit } from "@/lib/data";
import { listLeads, saveLead } from "@/lib/leads";
import { newId } from "@/lib/crypto";
import { clientIp, error, json, siteOrigin } from "@/lib/http";
import { getGuide } from "@/lib/guides";
import { stripe } from "@/lib/stripe";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

// Someone asks for a guidebook. They become a lead (or their existing lead is updated), then get the download or go to checkout.
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`guide:${ip}`, 10, 60 * 60))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const guide = getGuide(str(b.slug, 60));
  if (!guide) return error("That guide isn't available.", 404);
  if (str(b.company_url)) return json({ ok: true, url: guide.price > 0 ? "" : guide.file }); // spam trap
  const name = str(b.name, 120);
  const email = str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email address.");

  const now = new Date().toISOString();
  const existing = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase());
  const tag = `Guide: ${guide.title}`;
  const lead: Lead = existing ?? {
    id: newId(), createdAt: now, status: "new", lane: guide.lane, name, email, phone: "",
    organization: str(b.organization, 200), role: "", website: "", interests: [], goals: str(b.working, 1000), challenges: "",
    budget: "", timeline: "", heardFrom: str(b.heardFrom, 200), assessment: null, notes: "", clientId: null,
  };
  if (!lead.interests.includes(tag)) lead.interests.push(tag);
  if (existing) {
    if (!lead.organization) lead.organization = str(b.organization, 200);
    if (str(b.working, 1000) && !lead.goals.includes(str(b.working, 1000))) lead.goals = [lead.goals, str(b.working, 1000)].filter(Boolean).join("\n");
  }
  lead.guides = lead.guides ?? [];
  const had = lead.guides.find((g) => g.slug === guide.slug);
  if (!had) lead.guides.push({ slug: guide.slug, title: guide.title, at: now, paid: 0 });
  await saveLead(lead);

  if (guide.price <= 0 || (had && had.paid > 0)) return json({ ok: true, url: guide.file });

  const s = stripe();
  if (!s) return error("Online payments are not turned on yet. Please reach out and we will send it to you.", 503);
  const origin = await siteOrigin();
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(guide.price * 100), product_data: { name: `${guide.title} (guidebook)` } } }],
    metadata: { kind: "guide", slug: guide.slug, leadId: lead.id },
    success_url: `${origin}/guides/${guide.slug}?paid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/guides/${guide.slug}`,
  });
  return json({ ok: true, checkout: session.url });
}
