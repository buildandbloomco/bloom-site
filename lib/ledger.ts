import "server-only";
import { listClients } from "./data";
import { listCourses, listEnrollments } from "./courses";
import { listOrders } from "./shop";
import { listLeads } from "./leads";
import { allNotices } from "./paynotices";
import { listEvents, spotHolds, type StoredEvent } from "./events";
import { listComps } from "./comps";
import type { Client, Lead, Payment, SeatGift } from "./types";

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

/** "comp" = a complimentary seat you gave them (no payment) */
export type GuestStatus = "paid" | "comp" | "zelle" | "unpaid";
export interface Guest {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  status: GuestStatus;
  /** Has a complimentary seat you can take back */
  comp?: boolean;
  paid: number;
  date: string;
  /** Has a guest pass (personal events) rather than a full client portal */
  guestPass: boolean;
  /** The seat is a gift: name/email above are the person coming, buyer is who paid */
  gift?: SeatGift;
  buyer?: { name: string; email: string };
  /** Gift certificate for this seat: gifts from a buyer, and complimentary seats from you */
  cert?: { to: string; from: string; note: string };
}

/** Who a complimentary seat's certificate is from */
export const COMP_FROM = "Jadon";

/** Printable gift certificate for a gifted seat */
export const certUrl = (slug: string, gift: { to: string; note: string }, from: string) =>
  `/event/${slug}/gift?to=${encodeURIComponent(gift.to)}&from=${encodeURIComponent(from)}${gift.note ? `&note=${encodeURIComponent(gift.note)}` : ""}`;

/** Gifts saved only as a note at checkout (seats bought before gift details were stored on the payment) */
function giftsInNotes(text: string): SeatGift[] {
  const out: SeatGift[] = [];
  for (const m of text.matchAll(/GIFT: this seat is for (.+?)(?: \(([^)]*)\))?(?:\. Note: "(.*?)")?\.$/gm)) {
    const email = /@/.test(m[2] || "") ? m[2] : "";
    if (!out.some((g) => g.to === m[1])) out.push({ to: m[1], email, note: m[3] || "" });
  }
  return out;
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
    const add = (c: Client, tier: string, patch: Partial<Guest>, gift?: SeatGift) => {
      // A gifted seat is its own row, named for the person coming
      const key = `${c.id}|${tier}${gift ? `|gift:${gift.to.toLowerCase()}` : ""}`;
      const base: Guest = { clientId: c.id, name: c.name, email: c.email, phone: leadFor(c)?.phone || "", tier, status: "unpaid", paid: 0, date: "", guestPass: c.kind === "guest" };
      const g = guests.get(key) ?? (gift ? { ...base, name: gift.to, email: gift.email, phone: "", gift, buyer: { name: c.name, email: c.email }, cert: { to: gift.to, from: c.name, note: gift.note } } : base);
      if (patch.paid) g.paid += patch.paid;
      if (patch.status === "comp") g.comp = true;
      if (patch.cert && !g.cert) g.cert = patch.cert;
      if (patch.status && order(patch.status) < order(g.status)) g.status = patch.status;
      if (patch.date && (!g.date || patch.date < g.date)) g.date = patch.date;
      guests.set(key, g);
    };

    for (const c of clients) {
      for (const p of c.payments) {
        const m = matchEvent(events, p);
        if (m?.e.slug === e.slug) add(c, m.t?.name || "Offer", { status: "paid", paid: Number(p.amount) || 0, date: p.date }, p.gift);
      }
      for (const n of notices[c.id] ?? []) {
        if (n.status !== "pending") continue;
        const m = matchEvent(events, n);
        if (m?.e.slug === e.slug) add(c, m.t?.name || "Offer", { status: "zelle", date: n.at }, n.gift);
      }
    }
    // Complimentary seats: they hold a seat, $0, never "didn't finish paying"
    for (const x of await listComps(e.slug)) {
      const c = byId.get(x.clientId);
      if (c) add(c, e.tiers.find((t) => t.id === x.tierId)?.name || "Offer", { status: "comp", date: x.at, cert: { to: c.name, from: COMP_FROM, note: x.message || "" } });
    }
    // People who chose an offer but have not paid yet (lead tag "<event>: <tier>")
    for (const l of leads) {
      if (!l.clientId) continue;
      const c = byId.get(l.clientId);
      if (!c) continue;
      for (const t of e.tiers) if (l.interests.includes(`${e.name}: ${t.name}`) && ![...guests.keys()].some((k) => k === `${c.id}|${t.name}` || k.startsWith(`${c.id}|${t.name}|gift:`))) {
        // Shared names (the Reset Circle and its guest offer) are told apart by tier name, so this is safe
        add(c, t.name, { date: l.createdAt });
      }
    }

    // Older gifted seats: the gift was saved as a note. Turn the buyer's row into the recipient's.
    if (e.giftable) {
      for (const [key, g] of [...guests.entries()]) {
        if (g.gift || g.status === "unpaid" || g.status === "comp") continue;
        const c = byId.get(g.clientId)!;
        const taken = new Set([...guests.values()].filter((x) => x.clientId === c.id && x.gift).map((x) => x.gift!.to));
        const gift = giftsInNotes([c.notes, leadFor(c)?.notes ?? ""].join("\n")).find((x) => !taken.has(x.to));
        if (gift) guests.set(key, { ...g, name: gift.to, email: gift.email, phone: "", gift, buyer: { name: c.name, email: c.email }, cert: { to: gift.to, from: c.name, note: gift.note } });
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
const order = (s: GuestStatus) => ({ paid: 0, comp: 1, zelle: 2, unpaid: 3 })[s];
const stateOrder = (s: EventSummary["state"]) => (s === "open" ? 0 : s === "closed" ? 1 : 2);


/* ---------- One person's tickets (for their guest pass) ---------- */

export interface Ticket {
  e: StoredEvent;
  tier: StoredEvent["tiers"][number] | null;
  status: GuestStatus;
  paid: number;
  /** Seats bought as gifts for other people */
  gifts: SeatGift[];
  /** A complimentary seat's certificate, addressed to them */
  compCert?: { to: string; from: string; note: string };
}

/** Every event this client has a seat at, or started checkout for */
export async function ticketsFor(c: Client): Promise<Ticket[]> {
  const [events, notices, leads] = await Promise.all([listEvents(), allNotices(), listLeads()]);
  const lead = leads.find((l) => l.clientId === c.id) ?? leads.find((l) => l.email && l.email.toLowerCase() === c.email.toLowerCase());
  const out = new Map<string, Ticket>();
  const add = (e: StoredEvent, tier: Ticket["tier"], status: GuestStatus, paid = 0, gift?: SeatGift) => {
    const k = `${e.slug}|${tier?.id ?? ""}`;
    const t = out.get(k) ?? { e, tier, status, paid: 0, gifts: [] };
    t.paid += paid;
    if (gift && !t.gifts.some((g) => g.to === gift.to)) t.gifts.push(gift);
    if (order(status) < order(t.status)) t.status = status;
    out.set(k, t);
  };
  for (const p of c.payments) { const m = matchEvent(events, p); if (m) add(m.e, m.t, "paid", Number(p.amount) || 0, p.gift); }
  for (const n of notices[c.id] ?? []) { if (n.status !== "pending") continue; const m = matchEvent(events, n); if (m) add(m.e, m.t, "zelle", 0, n.gift); }
  for (const e of events) {
    for (const x of await listComps(e.slug)) if (x.clientId === c.id) {
      add(e, e.tiers.find((t) => t.id === x.tierId) ?? null, "comp");
      const t = out.get(`${e.slug}|${x.tierId}`);
      if (t) t.compCert = { to: c.name, from: COMP_FROM, note: x.message || "" };
    }
    for (const t of e.tiers) if (lead?.interests.includes(`${e.name}: ${t.name}`)) add(e, t, "unpaid");
  }
  // Older gifted seats: the gift was saved as a note at checkout
  const noted = giftsInNotes([c.notes, lead?.notes ?? ""].join("\n"));
  for (const t of out.values()) if (t.e.giftable && !t.gifts.length && t.status !== "unpaid" && t.status !== "comp" && noted.length) t.gifts.push(...noted);
  return [...out.values()].sort((a, b) => a.e.endsAt.localeCompare(b.e.endsAt));
}
