import type { Consult, Service } from "./types";

/** Who is paying: an individual or small business, or an organization with a team. Each service can carry a price for both. */
export type Tier = "business" | "org";
export const TIERS: { id: Tier; label: string; short: string; hint: string }[] = [
  { id: "business", label: "Small business or individual", short: "Small business", hint: "Solo founders, entrepreneurs, and very small teams" },
  { id: "org", label: "Organization", short: "Organization", hint: "Practices, agencies, nonprofits, and institutions with a team" },
];
export const tierLabel = (t: Tier | "" | undefined) => TIERS.find((x) => x.id === t)?.short ?? "";

/** The suggested price for this kind of client. Falls back to the other price when only one is set. null = custom quote. */
export function priceFor(s: Pick<Service, "price" | "priceOrg">, tier: Tier | "" | undefined): number | null {
  const biz = typeof s.price === "number" ? s.price : null;
  const org = typeof s.priceOrg === "number" ? s.priceOrg : null;
  return tier === "org" ? org ?? biz : biz ?? org;
}

/** A copy of the catalog priced for one kind of client (used anywhere a client sees or pays a price) */
export function pricedFor<T extends Service>(services: T[], tier: Tier | "" | undefined): T[] {
  return services.map((s) => ({ ...s, price: priceFor(s, tier) }));
}

export interface QuoteLine { id: string; name: string; unit: string; suggested: number | null; price: number | null; qty: number; total: number; custom: boolean }

/** The starting price for a consult: each chosen service at its suggested price (or your override) times quantity, minus any adjustment */
export function buildQuote(c: Pick<Consult, "tier" | "serviceIds" | "quote">, services: Service[]) {
  const lines: QuoteLine[] = c.serviceIds
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is Service => !!s)
    .map((s) => {
      const suggested = priceFor(s, c.tier);
      const over = c.quote.prices[s.id];
      const price = typeof over === "number" ? over : suggested;
      const qty = Math.max(1, Math.round(c.quote.qty[s.id] || 1));
      return { id: s.id, name: s.name, unit: s.unit, suggested, price, qty, total: price === null ? 0 : Math.round(price * qty * 100) / 100, custom: typeof over === "number" };
    });
  const subtotal = Math.round(lines.reduce((t, l) => t + l.total, 0) * 100) / 100;
  const discount = Math.min(subtotal, Math.max(0, c.quote.discount || 0));
  return { lines, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100, unpriced: lines.filter((l) => l.price === null).length };
}
