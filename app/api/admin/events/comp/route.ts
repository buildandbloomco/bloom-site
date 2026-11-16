import { listClients, saveClient } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import { newId } from "@/lib/crypto";
import { eventClient } from "@/lib/event-client";
import { isGuestEvent } from "@/lib/event-def";
import { listLeads, saveLead } from "@/lib/leads";
import { getEvent, releaseSpot, spotsLeft, takeSpot } from "@/lib/events";
import { compRef, listComps, saveComps } from "@/lib/comps";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

// Add a complimentary guest to an event: they take a seat and get a portal, with no payment
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const slug = str(b.slug, 60);
  const ev = await getEvent(slug);
  if (!ev) return error("That event wasn't found.", 404);
  const tier = ev.tiers.find((t) => t.id === str(b.tierId, 40));
  if (!tier) return error("Choose an offer.");
  const name = str(b.name, 120), email = str(b.email, 200), note = str(b.note, 300);
  if (!name) return error("Add the guest's name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Add a valid email. Their portal details go there.");
  if ((await spotsLeft(tier)) === 0) return error(`All the seats for ${tier.name} are taken.`);

  const now = new Date().toISOString();
  const comps = await listComps(slug);
  const already = (await listClients()).find((c) => c.email.trim().toLowerCase() === email.toLowerCase() && c.status !== "archived");
  if (already && comps.some((c) => c.clientId === already.id)) return error(`${already.name} already has a complimentary seat at ${ev.name}.`);

  const first = name.split(/\s+/)[0] || name;
  const { client, created } = await eventClient(ev, tier, {
    name, email,
    welcome: isGuestEvent(ev) ? `Welcome, ${first}! Your seat at ${ev.name} is saved. Your ticket and everything you need for the day are right here.` : `Welcome, ${first}! We're so glad you're joining us at ${ev.name}. Everything from here lives in this portal.`,
  });
  const compLine = `Complimentary seat at ${ev.name} (${tier.name}), added by Jadon.${note ? ` ${note}` : ""}`;
  client.notes = [client.notes, compLine].filter(Boolean).join("\n");
  await saveClient(client);

  // Lead record, so they show up with everyone else from the event
  const tag = `${ev.name}: ${tier.name}`;
  const existing = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase());
  const lead: Lead = existing ?? {
    id: newId(), createdAt: now, status: "new", lane: "business", name, email, phone: "", organization: "", role: "", website: "",
    interests: [], goals: "", challenges: "", budget: "", timeline: "", heardFrom: "Complimentary", assessment: null, notes: "", clientId: null,
  };
  const addedTag = !lead.interests.includes(tag);
  if (addedTag) lead.interests.push(tag);
  if (!lead.notes.includes(compLine)) lead.notes = [lead.notes, compLine].filter(Boolean).join("\n");
  lead.clientId = client.id;
  lead.status = "converted";
  await saveLead(lead);

  if (tier.spots && tier.pool) await takeSpot(tier.pool, { ref: compRef(client.id), clientId: client.id, at: now, event: slug });
  await saveComps(slug, [...comps, { clientId: client.id, tierId: tier.id, at: now, note, addedTag }]);
  return json({ ok: true, clientId: client.id, created });
}

// Take a complimentary seat back. The seat opens up again; their portal stays.
export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const slug = str(b.slug, 60), clientId = str(b.clientId, 60);
  const comps = await listComps(slug);
  const gone = comps.filter((c) => c.clientId === clientId);
  if (!gone.length) return error("That complimentary seat wasn't found.", 404);
  await saveComps(slug, comps.filter((c) => c.clientId !== clientId));
  const ev = await getEvent(slug);
  const leads = await listLeads();
  for (const c of gone) {
    const t = ev?.tiers.find((x) => x.id === c.tierId);
    if (t?.pool) await releaseSpot(t.pool, compRef(clientId));
    // Take the event tag back off their lead if the comp put it there, so they don't show as "didn't finish paying"
    const lead = c.addedTag && ev && t ? leads.find((l) => l.clientId === clientId) : undefined;
    if (lead) await saveLead({ ...lead, interests: lead.interests.filter((x) => x !== `${ev!.name}: ${t!.name}`) });
  }
  return json({ ok: true });
}
