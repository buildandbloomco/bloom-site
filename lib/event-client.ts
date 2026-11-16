import "server-only";
import { findOrCreateClient } from "./enroll";
import { setNameCode } from "./data";
import { getFin, saveFin } from "./finance";
import { getBuild, saveBuild } from "./builds";
import { GUIDES } from "./guides";
import { isGuestEvent, type EventOffer, type EventTier } from "./event-def";
import type { Client } from "./types";

/** Turn a guest pass into a full client portal (Money, business tools, every guidebook) */
export async function makeFullPortal(client: Client) {
  delete client.kind;
  client.tier = client.tier || "business";
  client.guideSlugs = Array.from(new Set([...(client.guideSlugs ?? []), ...GUIDES.map((g) => g.slug)]));
  client.showBooking = true;
  const fin = await getFin(client.id);
  if (!fin.enabled) await saveFin(client.id, { ...fin, enabled: true });
}

/**
 * Find or create the portal for someone who picked an event offer, set up for that event.
 * Personal events (access "guest") get a guest pass named after the person.
 * Business events get a full client portal, named after their business if they gave one.
 * A guest who picks a business offer is upgraded to a full portal. A full client stays full.
 * Guests sign in with their name and stay a lead until you make them an active client.
 * The caller saves the client.
 */
export async function eventClient(ev: EventOffer, tier: EventTier, p: { name: string; email: string; business?: string; welcome: string }): Promise<{ client: Client; created: boolean; setUp: boolean }> {
  const guest = isGuestEvent(ev);
  const { client, created } = await findOrCreateClient(guest || !p.business ? p.name : p.business, p.email);
  const upgrade = !created && client.kind === "guest" && !guest;
  if (!created && !upgrade) return { client, created, setUp: false };

  client.contactName = p.name.split(/\s+/)[0] || p.name;
  client.welcome = p.welcome;
  client.package = { ...client.package, title: tier.name, summary: tier.tagline, serviceIds: tier.serviceIds, customItems: tier.includes.map((i) => ({ title: i, detail: "" })) };
  if (guest) {
    client.kind = "guest";
    client.tier = "";
    client.guideSlugs = [];
    // Guests sign in with their name, not a random code
    if (created) await setNameCode(client, p.name);
  } else {
    if (upgrade && p.business) client.name = p.business;
    await makeFullPortal(client);
    if (tier.build) { const bd = await getBuild(client.id); await saveBuild(client.id, { ...bd, enabled: true, kind: tier.build }); }
  }
  return { client, created, setUp: true };
}
