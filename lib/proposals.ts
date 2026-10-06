import "server-only";
import { kv } from "./kv";
import { newId } from "./crypto";
import type { Client } from "./types";
import type { Proposal, ProposalOption } from "./proposal-def";

export type { Proposal, ProposalOption };
const KEY = "bb:proposals";
export async function getProposal(clientId: string): Promise<Proposal | null> { return kv().hget<Proposal>(KEY, clientId); }
export async function saveProposal(clientId: string, p: Proposal) { await kv().hset(KEY, clientId, p); }
export async function allProposals(): Promise<Record<string, Proposal>> { return kv().hgetall<Proposal>(KEY); }

/** An option built from what is already on the client page (for example, after "Use as their proposal" on a consult sheet) */
export function optionFromClient(c: Client): ProposalOption {
  return {
    id: newId(), name: c.package.title || "Your package", summary: c.package.summary || "",
    serviceIds: [...c.package.serviceIds], customItems: c.package.customItems.map((i) => ({ ...i })),
    lineItems: c.investment.lineItems.length ? c.investment.lineItems.map((l) => ({ ...l })) : c.investment.total ? [{ label: c.package.title || "Package", amount: c.investment.total }] : [],
    retainer: c.investment.retainer || 0, recommended: false,
  };
}
export const blankProposal = (c: Client): Proposal => ({ status: "draft", intro: "", expires: "", options: [optionFromClient(c)], sentAt: null, viewedAt: null, acceptedAt: null, acceptedOptionId: "", acceptedName: "", acceptedTitle: "", acceptedIp: "" });

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const amt = (v: unknown) => Math.max(0, Math.min(10000000, Math.round((Number(v) || 0) * 100) / 100));
// Price lines can be negative, so you can show a discount
const signed = (v: unknown) => Math.max(-10000000, Math.min(10000000, Math.round((Number(v) || 0) * 100) / 100));
/** Clean what the editor sends. Who accepted and when is never taken from the browser. */
export function cleanOptions(raw: unknown, validServiceIds: Set<string>): ProposalOption[] {
  const list = (Array.isArray(raw) ? raw : []).slice(0, 4).map((o: Record<string, unknown>) => ({
    id: /^[a-z0-9]{6,40}$/i.test(String(o.id)) ? String(o.id) : newId(),
    name: str(o.name, 120).trim() || "Option",
    summary: str(o.summary, 1000),
    serviceIds: (Array.isArray(o.serviceIds) ? o.serviceIds : []).map(String).filter((id) => validServiceIds.has(id)).slice(0, 40),
    customItems: (Array.isArray(o.customItems) ? o.customItems : []).slice(0, 30).map((i: Record<string, unknown>) => ({ title: str(i.title, 200).trim(), detail: str(i.detail, 1000) })).filter((i) => i.title),
    lineItems: (Array.isArray(o.lineItems) ? o.lineItems : []).slice(0, 30).map((l: Record<string, unknown>) => ({ label: str(l.label, 200).trim(), amount: signed(l.amount) })).filter((l) => l.label),
    retainer: amt(o.retainer),
    recommended: !!o.recommended,
  }));
  let seen = false;
  for (const o of list) { if (o.recommended && seen) o.recommended = false; if (o.recommended) seen = true; }
  return list;
}
