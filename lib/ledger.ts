import "server-only";
import { listClients } from "./data";
import { listCourses, listEnrollments } from "./courses";
import { listOrders } from "./shop";
import { listLeads } from "./leads";
import { allNotices } from "./paynotices";
import { listEvents, spotHolds, type StoredEvent } from "./events";
import type { Client, Lead, Payment } from "./types";

/** Where a payment came from */
export type Source = "event" | "client" | "course" | "shop" | "guide";
export const SOURCE_LABEL: Record<Source, string> = { event: "Event", client: "Client package", course: "Course", shop: "Shop", guide: "Guidebook" };

/** One payment, from anywhere on the site */
export interface Row {
  id: string;
  /** ISO date or YYYY-MM-DD */
  date: string;
  amount: number;
  who: string;
  email: string;
  /** Admin page for this person */
  href: string;
  source: Source;
  /** Event, course, or product name */
  what: string;
  method: string;
  /** "paid", or "pending" for Zelle that has not been confirmed yet */
  status: "paid" | "pending";
  /** Where to go to confirm a pending payment */
  confirmHref?: string;
}

/** The event offer and tier a client payment (or Zelle notice) belongs to, if any.
 *  New payments carry the event. Older ones are matched by their label, "<event> offer: <tier>". */
export function matchEvent(events: StoredEvent[], p: { description?: string; label?: string; event?: Payment["event"] }) {
  if (p.event) {
    const e = events.find((x) => x.slug === p.event!.slug);
    if (e) return { e, t: e.tiers.find((t) => t.id === p.event!.tierId) ?? null };
  }
  const text = p.label ?? p.description ?? "";
  for (const e of events) for (const t of e.tiers) if (text.startsWith(`${e.name} offer: ${t.name}`)) return { e, t };
  return null;
}

export async function ledger(): Promise<Row[]> {
  const [clients, events, enrollments, courses, orders, leads, notices] = await Promise.all([
    listClients(), listEvents(), listEnrollments(), listCourses(), listOrders(), listLeads(), allNotices(),
  ]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const rows: Row[] = [];

  for (const c of clients) {
    for (const p of c.payments) {
      const m = matchEvent(events, p);
      rows.push({
        id: `c:${c.id}:${p.id}`, date: p.date, amount: Number(p.amount) || 0, who: c.name, email: c.email, href: `/admin/clients/${c.id}`,
        source: m ? "event" : "client",
        what: m ? `${eventLabel(m.e)}${m.t ? ` · ${m.t.name}` : ""}` : p.description || (p.kind === "addon" ? "Add-ons" : "Package payment"),
        method: p.method || "Other", status: "paid",
      });
    }
    for (const n of notices[c.id] ?? []) {
      if (n.status !== "pending") continue;
      const m = matchEvent(events, n);
      rows.push({
        id: `n:${c.id}:${n.id}`, date: n.at, amount: n.amount, who: c.name, email: c.email, href: `/admin/clients/${c.id}`,
        source: m ? "event" : "client", what: m ? `${eventLabel(m.e)}${m.t ? ` · ${m.t.name}` : ""}` : n.label,
        method: "Zelle", status: "pending", confirmHref: `/admin/clients/${c.id}/desk`,
      });
    }
  }

  const courseName = new Map(courses.map((x) => [x.id, x.title]));
  for (const e of enrollments) {
    for (const p of e.payments) {
      rows.push({
        id: `e:${e.id}:${p.id}`, date: p.date, amount: Number(p.amount) || 0, who: e.learnerName || byId.get(e.clientId)?.name || "Learner", email: e.email,
        href: `/admin/courses/${e.courseId}/learners/${e.id}`, source: "course", what: courseName.get(e.courseId) || "Course", method: p.method || "Other", status: "paid",
      });
    }
  }

  for (const o of orders) {
    if (o.method === "free" || !(o.amount > 0) || o.status === "canceled") continue;
    if (o.status === "pending" && o.method === "card") continue; // checkout never finished
    rows.push({
      id: `o:${o.id}`, date: o.at, amount: o.amount, who: o.name, email: o.email, href: o.clientId ? `/admin/clients/${o.clientId}` : "/admin/shop",
      source: "shop", what: o.title, method: o.method === "card" ? "Stripe" : "Zelle", status: o.status === "paid" ? "paid" : "pending",
      ...(o.status === "pending" ? { confirmHref: "/admin/shop" } : {}),
    });
  }

  for (const l of leads) {
    for (const g of l.guides ?? []) {
      if (!(g.paid > 0)) continue;
      rows.push({ id: `g:${l.id}:${g.slug}`, date: g.at, amount: g.paid, who: l.name, email: l.email, href: `/admin/leads/${l.id}`, source: "guide", what: g.title, method: "Stripe", status: "paid" });
    }
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

/** "The Reset Circle" and its guest offer share a name. Tell them apart. */
export function eventLabel(e: StoredEvent) {
  return e.headline && e.headline !== e.name && !e.open && /guest|next step|attendee/i.test(e.headline) ? `${e.name} (guest offer)` : e.name;
}

/* ---------- Events ---------- */

export type GuestStatus = "paid" | "zelle" | "unpaid";
export interface Guest {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  status: GuestStatus;
  paid: number;
  date: string;
}
export interface EventSummary {
  e: StoredEvent;
  label: string;
  state: "open" | "closed" | "off";
  guests: Guest[];
  revenue: number;
  pending: number;
  /** Seats per tier that has limited spots */
  seats: { tier: string; taken: number; total: number }[];
}

/** Everyone who picked an offer at each event: paid, Zelle on the way, or started checkout and stopped */
export async function eventSummaries(): Promise<EventSummary[]> {
  const [events, clients, leads, notices] = await Promise.all([listEvents(), listClients(), listLeads(), allNotices()]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const leadFor = (c: Client): Lead | undefined => leads.find((l) => l.clientId === c.id) ?? leads.find((l) => l.email && l.email.toLowerCase() === c.email.toLowerCase());
  const now = Date.now();
  const out: EventSummary[] = [];

  for (const e of events) {
    const guests = new Map<string, Guest>();
    const add = (c: Client, tier: string, patch: Partial<Guest>) => {
      const key = `${c.id}|${tier}`;
      const g = guests.get(key) ?? { clientId: c.id, name: c.name, email: c.email, phone: leadFor(c)?.phone || "", tier, status: "unpaid" as GuestStatus, paid: 0, date: "" };
      if (patch.paid) g.paid += patch.paid;
      if (patch.status === "paid" || (patch.status === "zelle" && g.status === "unpaid")) g.status = patch.status;
      if (patch.date && (!g.date || patch.date < g.date)) g.date = patch.date;
      guests.set(key, g);
    };

    for (const c of clients) {
      for (const p of c.payments) {
        const m = matchEvent(events, p);
        if (m?.e.slug === e.slug) add(c, m.t?.name || "Offer", { status: "paid", paid: Number(p.amount) || 0, date: p.date });
      }
      for (const n of notices[c.id] ?? []) {
        if (n.status !== "pending") continue;
        const m = matchEvent(events, n);
        if (m?.e.slug === e.slug) add(c, m.t?.name || "Offer", { status: "zelle", date: n.at });
      }
    }
    // People who chose an offer but have not paid yet (lead tag "<event>: <tier>")
    for (const l of leads) {
      if (!l.clientId) continue;
      const c = byId.get(l.clientId);
      if (!c) continue;
      for (const t of e.tiers) if (l.interests.includes(`${e.name}: ${t.name}`) && !guests.has(`${c.id}|${t.name}`)) {
        // Shared names (the Reset Circle and its guest offer) are told apart by tier name, so this is safe
        add(c, t.name, { date: l.createdAt });
      }
    }

    const seats: EventSummary["seats"] = [];
    for (const t of e.tiers) if (t.spots && t.pool) seats.push({ tier: t.name, taken: (await spotHolds(t.pool)).length, total: t.spots });

    const list = [...guests.values()].sort((a, b) => (a.status === b.status ? b.date.localeCompare(a.date) : order(a.status) - order(b.status)));
    out.push({
      e, label: eventLabel(e),
      state: e.active === false ? "off" : now < new Date(e.endsAt).getTime() ? "open" : "closed",
      guests: list,
      revenue: list.reduce((s, g) => s + g.paid, 0),
      pending: list.filter((g) => g.status === "zelle").length,
      seats,
    });
  }
  return out.sort((a, b) => stateOrder(a.state) - stateOrder(b.state) || b.e.endsAt.localeCompare(a.e.endsAt));
}
const order = (s: GuestStatus) => (s === "paid" ? 0 : s === "zelle" ? 1 : 2);
const stateOrder = (s: EventSummary["state"]) => (s === "open" ? 0 : s === "closed" ? 1 : 2);

