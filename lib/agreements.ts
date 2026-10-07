import "server-only";
import { createHash } from "crypto";
import { kv } from "./kv";

/** A document a client reads and signs in their portal by typing their name */
export interface Agreement {
  id: string;
  title: string;
  body: string;
  status: "draft" | "sent" | "signed";
  /** Card payments in the portal are blocked until this is signed */
  requiredToPay: boolean;
  createdAt: string;
  sentAt: string | null;
  signedAt: string | null;
  signedName: string;
  signedTitle: string;
  signedIp: string;
  /** Fingerprint of the exact text that was signed */
  signedHash: string;
  /** Written from your template (not typed by hand) */
  auto?: boolean;
  /** You changed the wording yourself, so it is no longer rewritten automatically */
  customized?: boolean;
  /** Fingerprint of the client details it was written from: name, services, and pricing */
  source?: string;
  /** When it was last rewritten to match the client page */
  updatedAt?: string;
}

const KEY = "bb:agreements";
export async function listAgreements(clientId: string): Promise<Agreement[]> {
  return (await kv().hget<Agreement[]>(KEY, clientId)) ?? [];
}
export async function saveAgreements(clientId: string, list: Agreement[]) {
  await kv().hset(KEY, clientId, list);
}
export const fingerprint = (a: Pick<Agreement, "title" | "body">) => createHash("sha256").update(`${a.title}\n\n${a.body}`).digest("hex");
export const needsSignature = (list: Agreement[]) => list.filter((a) => a.status === "sent");
export const blocksPayment = (list: Agreement[]) => list.some((a) => a.status === "sent" && a.requiredToPay);

import { newId } from "./crypto";
import { getCatalog, getSettings } from "./data";
import { getPlan } from "./workspace";
import { notifyAdmin } from "./notify";
import { money } from "./format";
import type { Client } from "./types";
import { buildContract, DEFAULT_CONTRACT_SETTINGS, type ContractSettings } from "./contract-def";

const SETTINGS_KEY = "bb:contracts";
export async function getContractSettings(): Promise<ContractSettings> {
  return { ...DEFAULT_CONTRACT_SETTINGS, ...((await kv().get<Partial<ContractSettings>>(SETTINGS_KEY)) ?? {}) };
}
export async function saveContractSettings(c: ContractSettings) { await kv().set(SETTINGS_KEY, c); }

/** A fingerprint of everything on the client page that the agreement is written from */
export function agreementSource(client: Client, planEnabled: boolean): string {
  const p = client.package, i = client.investment;
  return createHash("sha256").update(JSON.stringify([client.name, p.serviceIds, p.customItems, p.format, p.duration, i.total, i.retainer, i.lineItems, client.billing ?? "standard", planEnabled])).digest("hex").slice(0, 24);
}
const isAuto = (a: Agreement) => a.auto ?? a.title === "Client Services Agreement";

/**
 * Keep unsigned agreements in step with the client page. Call after anything changes a client's services or pricing.
 * Signed agreements are never touched, and neither is one whose wording you edited by hand.
 */
export async function syncAgreement(client: Client): Promise<number> {
  try {
    const list = await listAgreements(client.id);
    if (!list.some((a) => a.status !== "signed")) return 0;
    const cur = agreementSource(client, !!(await getPlan(client.id)).enabled);
    let n = 0;
    for (const a of list) {
      if (a.status === "signed" || !isAuto(a) || a.customized || a.source === cur) continue;
      const fresh = await draftAgreement(client);
      a.body = fresh.body; a.source = cur; a.auto = true; a.updatedAt = new Date().toISOString();
      n++;
    }
    if (n) await saveAgreements(client.id, list);
    return n;
  } catch {
    return 0;
  }
}
/** True when the client's services or pricing have changed since their latest signed agreement */
export async function signedIsStale(client: Client, list: Agreement[]): Promise<boolean> {
  const signed = list.filter((a) => a.status === "signed" && a.source).sort((a, b) => (b.signedAt ?? "").localeCompare(a.signedAt ?? ""))[0];
  if (!signed || list.some((a) => a.status !== "signed")) return false; // a new one is already in progress
  return signed.source !== agreementSource(client, !!(await getPlan(client.id)).enabled);
}

/** Write this client's agreement from your template, their package, and their pricing */
export async function draftAgreement(client: Client, cs?: ContractSettings): Promise<Agreement> {
  const [settings, catalog, plan, conf] = await Promise.all([getSettings(), getCatalog(), getPlan(client.id), cs ?? getContractSettings()]);
  const names = client.package.serviceIds.map((id) => catalog.services.find((s) => s.id === id)?.name).filter((n): n is string => !!n);
  const scope = [...names, ...client.package.customItems.map((i) => (i.detail ? `${i.title}: ${i.detail}` : i.title))];
  if (!scope.length) scope.push(plan.enabled ? "Strategy sessions and related support, as outlined in your client portal" : "Consulting services as described in your client portal");
  const extras = [client.package.format && `Format: ${client.package.format}`, client.package.duration && `Length of engagement: ${client.package.duration}`].filter(Boolean) as string[];
  const inv = client.investment;
  let fees: string;
  if (client.billing === "none") fees = "Fees for these services are billed as we have already agreed between us. This Agreement does not change that arrangement.";
  else if (inv.total > 0) {
    const lines = inv.lineItems.length > 1 ? inv.lineItems.map((l) => `- ${l.label}: ${l.amount < 0 ? `-${money(-l.amount)}` : money(l.amount)}`).join("\n") + "\n\n" : "";
    fees = `${lines}The total fee for these services is ${money(inv.total)}.${inv.retainer > 0 ? ` A retainer of ${money(inv.retainer)} is due before work begins.` : ""} ${inv.retainer > 0 && inv.retainer < inv.total ? "The remaining balance is" : "Payment is"} due as shown in your client portal.`;
  } else fees = "Your fees are the amounts shown in the proposal in your client portal.";
  const date = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" });
  const body = buildContract(conf.template, { brand: settings.brandName, client: client.name, date, state: conf.state, scope: [...scope, ...extras], fees, serviceIds: client.package.serviceIds, hasPlan: !!plan.enabled });
  return { id: newId(), title: "Client Services Agreement", body, status: "draft", requiredToPay: client.billing === "none" ? false : conf.requiredToPay, createdAt: new Date().toISOString(), sentAt: null, signedAt: null, signedName: "", signedTitle: "", signedIp: "", signedHash: "", auto: true, source: agreementSource(client, !!plan.enabled) };
}

/**
 * Called whenever a client becomes active. If they have no agreement yet, one is written for them
 * and (depending on your setting) sent to their portal. Never throws, so it cannot block the thing that triggered it.
 */
export async function ensureAgreement(client: Client, reason: string) {
  try {
    if (client.status !== "active") return;
    const conf = await getContractSettings();
    if (conf.mode === "off") return;
    const list = await listAgreements(client.id);
    if (list.length) return; // they already have one, in any state
    const a = await draftAgreement(client, conf);
    if (conf.mode === "send") { a.status = "sent"; a.sentAt = new Date().toISOString(); }
    await saveAgreements(client.id, [a]);
    await notifyAdmin(conf.mode === "send" ? `Agreement sent to ${client.name}` : `Agreement drafted for ${client.name}`,
      [`${reason} An agreement was written from your template and ${conf.mode === "send" ? "placed in their portal to sign" : "saved as a draft for you to review and send"}.`], `/admin/clients/${client.id}/agreements`);
  } catch {
    /* the agreement can always be created by hand from the client's Agreements page */
  }
}
