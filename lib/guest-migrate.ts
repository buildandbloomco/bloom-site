import "server-only";
import { kv } from "./kv";
import { listClients, newClientCode, saveClient } from "./data";
import { decryptCode, normalizeCode } from "./crypto";
import { notifyAdmin } from "./notify";
import { stripe } from "./stripe";
import { listEvents } from "./events";
import { addEventBooks, isGuestEvent } from "./event-def";
import { matchEvent, ticketsFor } from "./ledger";
import { allNotices } from "./paynotices";
import { listComps } from "./comps";
import { listLeads, saveLead } from "./leads";
import { listEnrollments } from "./courses";
import { allProposals } from "./proposals";
import { getAssessment, getPlan } from "./workspace";
import { getBuild } from "./builds";
import { getFin, listTx, saveFin } from "./finance";
import { listAgreements } from "./agreements";

const FLAG = "bb:mig:guestpass1";
let running: Promise<void> | null = null;

/** One time: people whose portal came only from a personal event (the Reset Circle) get a guest pass instead.
 *  Anyone with any sign of business work (another payment, a proposal, sessions, a course, Money entries,
 *  an agreement, services in their package, shop purchases) keeps their full portal. Access codes don't change. */
export async function migrateGuestPasses() {
  const steps: [string, () => Promise<void>][] = [[FLAG, run], [BOOKS_FLAG, giveBooks], [LEADS_FLAG, guestsAsLeads], [GIFTS_FLAG, giftsFromStripe], [NAMES_FLAG, retireNameCodes]];
  const todo: typeof steps = [];
  for (const s of steps) if (!(await kv().get(s[0]))) todo.push(s);
  if (!todo.length) return;
  running ??= (async () => { for (const [flag, fn] of todo) if (!(await kv().get(flag))) await fn(); })().finally(() => { running = null; });
  await running;
}

const LEADS_FLAG = "bb:mig:guestlead1";
/** One time: event guests go back to being leads */
async function guestsAsLeads() {
  const leads = await listLeads();
  for (const c of await listClients()) {
    if (c.kind !== "guest" || c.status === "archived") continue;
    const lead = leads.find((l) => l.clientId === c.id);
    if (lead?.status === "converted") await saveLead({ ...lead, status: "new" });
  }
  await kv().set(LEADS_FLAG, true);
}

const NAMES_FLAG = "bb:mig:nonamecodes1";
/** One time: names are too easy to guess, so they stop opening portals. Anyone whose only code was their name
 *  gets a new word code, and you get one email listing them so you can send each person theirs. */
async function retireNameCodes() {
  const leads = await listLeads();
  const changed: string[] = [];
  for (const c of await listClients()) {
    if (c.aliasIndex) { await kv().hdel("bb:codes", c.aliasIndex); delete c.aliasIndex; await saveClient(c); }
    if (c.kind !== "guest" || !c.codeEnc) continue;
    const name = normalizeCode(leads.find((l) => l.clientId === c.id)?.name || c.name);
    const code = decryptCode(c.codeEnc);
    if (!name || code.replace(/\d+$/, "") !== name) continue;
    const next = await newClientCode(c);
    if (!next) continue;
    c.notes = [c.notes, `Access code changed from their name to ${next} (${new Date().toISOString().slice(0, 10)}).`].join("\n");
    await saveClient(c);
    changed.push(`${c.name} (${c.email}): ${next}`);
  }
  if (changed.length) await notifyAdmin(`New access codes for ${changed.length} event ${changed.length === 1 ? "guest" : "guests"}`, ["Names no longer open guest passes. These guests had their name as their code, so they have a new one. Please send each person theirs:", ...changed], "/admin/leads");
  await kv().set(NAMES_FLAG, true);
}

const GIFTS_FLAG = "bb:mig:giftstripe1";
/** One time: card payments for gifted seats made before gift details were saved on the payment get them from Stripe */
async function giftsFromStripe() {
  const s = stripe();
  if (!s) { await kv().set(GIFTS_FLAG, true); return; }
  const events = await listEvents();
  for (const c of await listClients()) {
    let changed = false;
    for (const p of c.payments) {
      if (p.gift || !p.stripeSessionId) continue;
      const m = matchEvent(events, p);
      if (!m?.e.giftable) continue;
      try {
        const meta = (await s.checkout.sessions.retrieve(p.stripeSessionId)).metadata ?? {};
        if (meta.giftFor) { p.gift = { to: meta.giftFor, email: meta.giftEmail || "", note: meta.giftNote || "" }; changed = true; }
      } catch { /* leave it; you can add the gift by hand on the Events page */ }
    }
    if (changed) await saveClient(c);
  }
  await kv().set(GIFTS_FLAG, true);
}

const BOOKS_FLAG = "bb:mig:eventbooks1";
/** One time: everyone who already has a paid or complimentary seat gets that event's books (The Right Yes for the Reset Circle) */
async function giveBooks() {
  for (const c of await listClients()) {
    if (c.status === "archived") continue;
    let changed = false;
    for (const t of await ticketsFor(c)) if (t.status === "paid" || t.status === "comp") changed = addEventBooks(c, t.e) || changed;
    if (changed) await saveClient(c);
  }
  await kv().set(BOOKS_FLAG, true);
}

async function run() {
  const events = await listEvents();
  const guestEvents = events.filter(isGuestEvent);
  if (!guestEvents.length) { await kv().set(FLAG, true); return; }
  const [clients, notices, leads, enrollments, proposals] = await Promise.all([listClients(), allNotices(), listLeads(), listEnrollments(), allProposals()]);
  const comps = new Set((await Promise.all(guestEvents.map((e) => listComps(e.slug)))).flat().map((x) => x.clientId));
  const isGuestMatch = (p: Parameters<typeof matchEvent>[1]) => { const m = matchEvent(events, p); return !!m && isGuestEvent(m.e); };

  for (const c of clients) {
    if (c.kind === "guest" || c.status === "archived") continue;
    // Their portal must have come from a personal event
    const fromGuestEvent = guestEvents.some((e) => c.notes.includes(`Came from ${e.name}`) || c.notes.includes(`Complimentary seat at ${e.name}`));
    if (!fromGuestEvent || c.notes.includes("Shop customer")) continue;
    // Every payment and pending Zelle is for a personal event
    const pend = (notices[c.id] ?? []).filter((n) => n.status === "pending");
    const hasTicket = c.payments.some(isGuestMatch) || pend.some(isGuestMatch) || comps.has(c.id) || leads.some((l) => l.clientId === c.id && guestEvents.some((e) => e.tiers.some((t) => l.interests.includes(`${e.name}: ${t.name}`))));
    if (!hasTicket || !c.payments.every(isGuestMatch) || !pend.every(isGuestMatch)) continue;
    // No business work of any kind
    if (c.package.serviceIds.length || c.consults.length || c.deliverables.length || c.milestones.length || c.requests.length || proposals[c.id]) continue;
    if (enrollments.some((e) => e.clientId === c.id)) continue;
    const [plan, assess, build, tx, agreements] = await Promise.all([getPlan(c.id), getAssessment(c.id), getBuild(c.id), listTx(c.id), listAgreements(c.id)]);
    if (plan.enabled || assess?.enabled || build.enabled || tx.length || agreements.length) continue;

    const lead = leads.find((l) => l.clientId === c.id);
    c.kind = "guest";
    c.tier = "";
    c.guideSlugs = [];
    if (lead?.name) { c.name = lead.name; c.contactName = lead.name.split(/\s+/)[0] || lead.name; }
    c.notes = [c.notes, "Switched to a guest pass (personal event, no business work)."].join("\n");
    await saveClient(c);
    const fin = await getFin(c.id);
    if (fin.enabled) await saveFin(c.id, { ...fin, enabled: false });
  }
  await kv().set(FLAG, true);
}
