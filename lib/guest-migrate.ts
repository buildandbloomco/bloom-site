import "server-only";
import { kv } from "./kv";
import { listClients, saveClient } from "./data";
import { listEvents } from "./events";
import { isGuestEvent } from "./event-def";
import { matchEvent } from "./ledger";
import { allNotices } from "./paynotices";
import { listComps } from "./comps";
import { listLeads } from "./leads";
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
  if (await kv().get(FLAG)) return;
  running ??= run().finally(() => { running = null; });
  await running;
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
