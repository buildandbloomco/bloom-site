import { rateLimit } from "@/lib/data";
import { clientIp, error, json } from "@/lib/http";
import { newId } from "@/lib/crypto";
import { listLeads, saveLead } from "@/lib/leads";
import { notifyAdmin } from "@/lib/notify";
import { getProduct } from "@/lib/shop";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

// "Tell me when it's out" for coming-soon products
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`shopnotify:${ip}`, 10, 3600))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => ({}));
  if (str(b.company_url)) return json({ ok: true });
  const p = await getProduct(str(b.productId, 80));
  if (!p || p.status !== "soon") return error("That product isn't available.", 404);
  const name = str(b.name, 120), email = str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email.");
  const existing = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase());
  const lead: Lead = existing ?? { id: newId(), createdAt: new Date().toISOString(), status: "new", lane: "business", name, email, phone: "", organization: "", role: "", website: "", interests: [], goals: "", challenges: "", budget: "", timeline: "", heardFrom: "Shop", assessment: null, notes: "", clientId: null };
  const tag = `Waitlist: ${p.title}`;
  if (!lead.interests.includes(tag)) lead.interests.push(tag);
  await saveLead(lead);
  await notifyAdmin(`${name} wants ${p.title}`, [`${name} (${email}) asked to hear when ${p.title} is out.`], `/admin/leads/${lead.id}`);
  return json({ ok: true });
}
