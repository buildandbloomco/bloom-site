import { rateLimit } from "@/lib/data";
import { clientIp, error, json } from "@/lib/http";
import { newId } from "@/lib/crypto";
import { listLeads, saveLead } from "@/lib/leads";
import { notifyAdmin } from "@/lib/notify";
import { CHECK_AREAS, getTool, pricingMath, usd0, type PricingIn } from "@/lib/tools-def";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

/** One readable line about what they found, for the lead record */
function summary(tool: string, data: unknown): string {
  const d = (data ?? {}) as Record<string, unknown>;
  if (tool === "bloom-check") {
    const entries = Array.isArray(d.entries) ? (d.entries as { scores: Record<string, number> }[]) : [];
    const last = entries[entries.length - 1];
    if (!last) return "";
    return "Bloom Check: " + CHECK_AREAS["bloom-check"].map((a) => `${a.area} ${Number(last.scores?.[a.id]) || 0}/5`).join(", ");
  }
  if (tool === "pricing") {
    const p = d as unknown as PricingIn;
    const m = pricingMath(p);
    return `Pricing: wants to pay themselves ${usd0(p.pay)}/yr, expenses ${usd0(p.expenses)}/mo, needs ${usd0(m.revenue)}/yr, minimum rate ${usd0(m.rate)}/hr`;
  }
  return "";
}

// Someone used a free tool on the website and asked to save their results. They become a lead.
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`toollead:${ip}`, 10, 3600))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => null);
  const tool = getTool(str(b?.tool, 40));
  if (!tool || !tool.publicFree) return error("That tool isn't available.", 404);
  if (str(b.company_url)) return json({ ok: true }); // spam trap
  const name = str(b.name, 120), email = str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email address.");
  const line = summary(tool.id, b.data);
  const existing = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase());
  const lead: Lead = existing ?? {
    id: newId(), createdAt: new Date().toISOString(), status: "new", lane: "business", name, email, phone: "", organization: str(b.business, 200), role: "", website: "",
    interests: [], goals: "", challenges: "", budget: "", timeline: "", heardFrom: `Free tool: ${tool.name}`, assessment: null, notes: "", clientId: null,
  };
  const tag = `Tool: ${tool.name}`;
  if (!lead.interests.includes(tag)) lead.interests.push(tag);
  if (line) lead.challenges = [lead.challenges, line].filter(Boolean).join("\n").slice(0, 4000);
  await saveLead(lead);
  await notifyAdmin(`${name} used the ${tool.name}`, [`${name} (${email}) saved their results from the free ${tool.name} on your website.`, line], `/admin/leads/${lead.id}`);
  return json({ ok: true });
}
