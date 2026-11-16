import "server-only";
import { listClients } from "./data";
import { listLeads } from "./leads";
import { listWaitlist } from "./waitlist";
import { eventSummaries } from "./ledger";
import { firstName } from "./format";

export interface Person { email: string; name: string; first: string; tag: string }
export interface Audience { id: string; label: string; hint: string; people: Person[] }

const ok = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
function dedupe(list: Person[]): Person[] {
  const seen = new Map<string, Person>();
  for (const p of list) { const k = p.email.trim().toLowerCase(); if (ok(k) && !seen.has(k)) seen.set(k, { ...p, email: p.email.trim() }); }
  return [...seen.values()];
}
const person = (name: string, email: string, tag: string, first?: string): Person => ({ email, name, first: first || firstName(name || ""), tag });

/** Everyone you can email, grouped the ways you'd want to reach them */
export async function audiences(): Promise<Audience[]> {
  const [clients, leads, waitlist, events] = await Promise.all([listClients(), listLeads(), listWaitlist(), eventSummaries()]);
  const live = clients.filter((c) => c.status !== "archived");
  const full = live.filter((c) => c.kind !== "guest" && (c.status === "active" || c.status === "completed"));
  const guests = live.filter((c) => c.kind === "guest");
  const openLeads = leads.filter((l) => l.status === "new" || l.status === "contacted");
  const out: Audience[] = [];

  for (const s of events.filter((x) => x.state === "open" || x.guests.length)) {
    const seated = s.guests.filter((g) => g.status !== "unpaid");
    const unpaid = s.guests.filter((g) => g.status === "unpaid");
    // Gift recipients without an email are reached through the buyer
    const seatedPeople = seated.flatMap((g) => [g.email ? person(g.name, g.email, "Guest") : null, g.buyer && !g.email ? person(g.buyer.name, g.buyer.email, "Gift buyer") : null].filter((x): x is Person => !!x));
    if (seated.length) out.push({ id: `event:${s.e.slug}`, label: `${s.label}: everyone with a seat`, hint: "Paid, complimentary, and Zelle to confirm. Gift recipients with no email are reached through the buyer.", people: dedupe(seatedPeople) });
    if (unpaid.length) out.push({ id: `unpaid:${s.e.slug}`, label: `${s.label}: didn't finish paying`, hint: "Picked an offer but the payment never came through.", people: dedupe(unpaid.map((g) => person(g.name, g.email, "Didn't finish"))) });
  }
  out.push(
    { id: "clients", label: "Active clients", hint: "Clients with a full portal who are active or completed.", people: dedupe(full.map((c) => person(c.name, c.email, "Client", c.contactName ? firstName(c.contactName) : undefined))) },
    { id: "guests", label: "All event guests", hint: "Everyone with a guest pass.", people: dedupe(guests.map((c) => person(c.name, c.email, "Guest"))) },
    { id: "leads", label: "Leads: new and contacted", hint: "Inquiries, guidebook requests, and event guests who aren't clients yet.", people: dedupe(openLeads.map((l) => person(l.name, l.email, "Lead"))) },
    { id: "waitlist", label: "Wellness Library waitlist", hint: "Everyone still waiting or invited.", people: dedupe(waitlist.filter((w) => w.status !== "joined").map((w) => person(w.name, w.email, "Waitlist"))) },
  );
  const everyone = dedupe([...full.map((c) => person(c.name, c.email, "Client", c.contactName ? firstName(c.contactName) : undefined)), ...guests.map((c) => person(c.name, c.email, "Guest")), ...leads.filter((l) => l.status !== "closed").map((l) => person(l.name, l.email, "Lead")), ...waitlist.map((w) => person(w.name, w.email, "Waitlist"))]);
  out.push({ id: "everyone", label: "Everyone", hint: "All clients, guests, leads (except closed), and the waitlist, each address once.", people: everyone });
  return out;
}

/** Everyone, for picking one or a few people by name */
export async function directory(): Promise<Person[]> {
  const all = await audiences();
  return all.find((a) => a.id === "everyone")!.people.sort((a, b) => a.name.localeCompare(b.name));
}
