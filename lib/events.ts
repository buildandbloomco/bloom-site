import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { kv } from "./kv";
import { normalizeCode, safeEqual, sign, verify } from "./crypto";
import { DEFAULT_EVENTS, RESET_CIRCLE, eventOpen, type EventOffer, type EventTier } from "./event-def";

/** An event as stored: the guest-facing offer plus its room code, which never leaves the server except to admin */
export interface StoredEvent extends EventOffer { code: string }

const KEY = "bb:events";

export async function listEvents(): Promise<StoredEvent[]> {
  const saved = await kv().get<StoredEvent[]>(KEY);
  if (saved) {
    // One time: the Reset Circle early bird now ends Dec 15 instead of Dec 31 (only if it was still Dec 31)
    if (!(await kv().get("bb:events:mig:reset6"))) {
      const dec31 = new Date("2026-12-31T23:59:00-05:00").getTime();
      if (saved.some((e) => e.slug === "reset-circle" && e.tiers.some((t) => t.early && new Date(t.early.until).getTime() === dec31))) {
        const next = saved.map((e) => e.slug !== "reset-circle" ? e : { ...e, tiers: e.tiers.map((t) => t.early && new Date(t.early.until).getTime() === dec31 ? { ...t, early: { ...t.early, until: "2026-12-15T23:59:00-05:00" } } : t) });
        await kv().set(KEY, next);
        saved.splice(0, saved.length, ...next);
      }
      await kv().set("bb:events:mig:reset6", true);
    }
    // One time: the Reset Circle is a public event, so guests never need a room code
    if (!(await kv().get("bb:events:mig:reset5"))) {
      if (saved.some((e) => e.slug === "reset-circle" && !e.open)) {
        const next = saved.map((e) => (e.slug === "reset-circle" ? { ...e, open: true } : e));
        await kv().set(KEY, next);
        saved.splice(0, saved.length, ...next);
      }
      await kv().set("bb:events:mig:reset5", true);
    }
    // One time: add the November workshop events to a list you already saved
    if (!(await kv().get("bb:events:mig:workshop1"))) {
      const add = DEFAULT_EVENTS.filter((e) => ["build-it-workshop", "build-it-next-step"].includes(e.slug) && !saved.some((x) => x.slug === e.slug));
      const next = [...saved, ...add.map((e) => ({ ...e, active: e.active !== false, code: "BLOOM" }))];
      await kv().set(KEY, next);
      await kv().set("bb:events:mig:workshop1", true);
      return next;
    }
    // One time: the Reset Circle moved to Saturday, Jan 16, 2027 (full day, $157 early bird, $197), and the guest offer moved with it
    if (!(await kv().get("bb:events:mig:reset4"))) {
      const next = saved.map((e) => {
        if (e.slug === "reset-circle") return { ...e, ...RESET_CIRCLE, code: e.code, active: e.active !== false };
        if (e.slug === "reset-guests") return { ...e, endsAt: "2027-01-23T23:59:00-05:00", details: "For Reset Circle guests · through Saturday, January 23", tiers: e.tiers.map((t) => ({ ...t, next: t.next.map((n) => n.replace("Sessions run in January.", "Sessions run in late January and February.")) })) };
        return e;
      });
      if (saved.some((e) => e.slug === "reset-circle")) { await kv().set(KEY, next); saved.splice(0, saved.length, ...next); }
      await kv().set("bb:events:mig:reset4", true);
      await kv().set("bb:events:mig:reset3", true);
    }
    // One time: Reset Circle price update ($35 early bird, then $45), only if the prices were not already changed in admin
    if (!(await kv().get("bb:events:mig:reset3")) && saved.some((e) => e.slug === "reset-circle")) {
      const next = saved.map((e) => e.slug !== "reset-circle" ? e : { ...e, tiers: e.tiers.map((t) => t.id === "seat" && t.price === 40 && t.early?.price === 30 ? { ...t, price: 45, early: { ...t.early, price: 35 } } : t) });
      await kv().set(KEY, next);
      await kv().set("bb:events:mig:reset3", true);
      saved.splice(0, saved.length, ...next);
    }
    // One time: add the private guest offer for Reset Circle attendees
    if (!(await kv().get("bb:events:mig:reset2"))) {
      const add = DEFAULT_EVENTS.filter((e) => e.slug === "reset-guests" && !saved.some((x) => x.slug === e.slug));
      const next = [...saved, ...add.map((e) => ({ ...e, active: e.active !== false, code: "RESET" }))];
      await kv().set(KEY, next);
      await kv().set("bb:events:mig:reset2", true);
      if (await kv().get("bb:events:mig:reset1")) return next;
      saved.splice(0, saved.length, ...next);
    }
    // One time: add the Dec 5 Reset Circle and turn off the Nov 14 virtual workshop it replaces
    if (!(await kv().get("bb:events:mig:reset1"))) {
      const add = DEFAULT_EVENTS.filter((e) => e.slug === "reset-circle" && !saved.some((x) => x.slug === e.slug));
      const next = [...saved.map((e) => (e.slug === "build-it-workshop" ? { ...e, active: false } : e)), ...add.map((e) => ({ ...e, active: e.active !== false, code: "BLOOM" }))];
      await kv().set(KEY, next);
      await kv().set("bb:events:mig:reset1", true);
      return next;
    }
    return saved;
  }
  return DEFAULT_EVENTS.map((e) => ({ ...e, active: e.active !== false, code: process.env[`EVENT_CODE_${e.slug.toUpperCase()}`] || (e.slug === "reset-guests" ? "RESET" : "BLOOM") }));
}
export async function saveEvents(list: StoredEvent[]) { await kv().set(KEY, list); }
export async function getEvent(slug: string): Promise<StoredEvent | null> {
  return (await listEvents()).find((e) => e.slug === slug) ?? null;
}

/** What guests are allowed to see: no room code, only active tiers */
export function publicEvent(e: StoredEvent): EventOffer {
  const { code: _code, ...rest } = e;
  void _code;
  return { ...rest, tiers: rest.tiers.filter((t) => t.active !== false) };
}

const cookieName = (slug: string) => `bb_ev_${slug}`;
// Changing the room code signs everyone out of the page
const stamp = (e: StoredEvent) => `${e.slug}:${crypto.createHash("sha256").update(normalizeCode(e.code)).digest("hex").slice(0, 10)}`;

export function checkEventCode(e: StoredEvent, code: string): boolean {
  return !!e.code && safeEqual(normalizeCode(code), normalizeCode(e.code));
}

export async function grantEvent(e: StoredEvent) {
  const secs = Math.max(60, Math.ceil((new Date(e.endsAt).getTime() - Date.now()) / 1000) + 3600);
  (await cookies()).set(cookieName(e.slug), sign(stamp(e), secs), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: secs });
}

/** The event as guests see it, if it is open and this browser entered the current room code */
export async function eventAccess(slug: string): Promise<EventOffer | null> {
  const e = await getEvent(slug);
  if (!e || !eventOpen(e)) return null;
  if (e.open) return publicEvent(e);
  return verify((await cookies()).get(cookieName(slug))?.value) === stamp(e) ? publicEvent(e) : null;
}

/* ---------- Cleaning what admin sends ---------- */
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const money = (v: unknown) => { const n = Math.round(Number(v) * 100) / 100; return Number.isFinite(n) && n > 0 ? n : 0; };
const lines = (v: unknown, max = 12) => (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x) => str(x, 400)).filter(Boolean).slice(0, max);
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function cleanTier(t: Record<string, unknown>, i: number, serviceIds: Set<string>): EventTier | string {
  const name = str(t.name, 80);
  if (!name) return `Tier ${i + 1} needs a name.`;
  const price = money(t.price);
  if (!price) return `${name} needs a price above $0.`;
  const was = money(t.was), deposit = money(t.deposit);
  const e = (t.early && typeof t.early === "object" ? t.early : {}) as Record<string, unknown>;
  const earlyPrice = money(e.price), until = str(e.until, 40);
  let early: EventTier["early"];
  if (earlyPrice) {
    if (earlyPrice >= price) return `${name}: the decide-today price must be lower than the event price.`;
    if (Number.isNaN(new Date(until).getTime())) return `${name}: choose when the decide-today price ends.`;
    early = { price: earlyPrice, until: new Date(until).toISOString() };
  }
  if (deposit && deposit >= (early?.price ?? price)) return `${name}: the deposit must be less than the price.`;
  return {
    id: slugify(str(t.id, 40)) || `tier-${i + 1}`,
    name, tagline: str(t.tagline, 160), price,
    ...(early ? { early } : {}),
    ...(was > price ? { was } : {}),
    includes: lines(t.includes),
    serviceIds: (Array.isArray(t.serviceIds) ? t.serviceIds : []).map(String).filter((x) => serviceIds.has(x)).slice(0, 12),
    ...(deposit ? { deposit, depositNote: str(t.depositNote, 300) } : {}),
    featured: t.featured === true,
    agreement: t.agreement === true,
    next: lines(t.next, 6),
    active: t.active !== false,
    ...(Number(t.spots) > 0 ? { spots: Math.min(999, Math.floor(Number(t.spots))), pool: slugify(str(t.pool, 40)) || `${slugify(name)}-spots` } : {}),
    ...(t.depositOnly === true && deposit ? { depositOnly: true } : {}),
    ...(t.fromPrice === true ? { fromPrice: true } : {}),
    ...(["systems-landing", "systems-portal", "systems-hub"].includes(String(t.build)) ? { build: t.build as EventTier["build"] } : {}),
  };
}

export function cleanEvents(input: unknown, serviceIds: Set<string>): StoredEvent[] | string {
  if (!Array.isArray(input)) return "Nothing to save.";
  const out: StoredEvent[] = [];
  const seen = new Set<string>();
  for (const raw of input.slice(0, 30) as Record<string, unknown>[]) {
    const name = str(raw.name, 80);
    if (!name) return "Every event needs a name.";
    const slug = slugify(str(raw.slug, 40) || name);
    if (!slug) return `${name} needs a web address.`;
    if (seen.has(slug)) return `Two events use the address /event/${slug}. Change one.`;
    seen.add(slug);
    const endsAt = str(raw.endsAt, 40);
    if (Number.isNaN(new Date(endsAt).getTime())) return `${name} needs a closing date and time.`;
    const code = str(raw.code, 40);
    // Public events need no room code
    if (raw.open !== true && normalizeCode(code).length < 3) return `${name} needs a room code of at least 3 characters.`;
    const tiers: EventTier[] = [];
    const ids = new Set<string>();
    for (const [i, t] of (Array.isArray(raw.tiers) ? raw.tiers : []).slice(0, 8).entries()) {
      const c = cleanTier(t as Record<string, unknown>, i, serviceIds);
      if (typeof c === "string") return `${name}: ${c}`;
      while (ids.has(c.id)) c.id = `${c.id}-2`;
      ids.add(c.id);
      tiers.push(c);
    }
    if (!tiers.length) return `${name} needs at least one offer.`;
    out.push({ slug, name, endsAt: new Date(endsAt).toISOString(), intro: str(raw.intro, 600), tiers, active: raw.active !== false, code, ...(raw.open === true ? { open: true } : {}), ...(str(raw.headline, 140) ? { headline: str(raw.headline, 140) } : {}), ...(str(raw.details, 200) ? { details: str(raw.details, 200) } : {}), ...(/^(\/|https:\/\/)\S+$/.test(str(raw.image, 300)) ? { image: str(raw.image, 300) } : {}) });
  }
  return out;
}

/* ---------- Limited spots, shared across events by pool name ---------- */
type Hold = { ref: string; clientId: string; at: string; event: string };
const poolKey = (pool: string) => `bb:spots:${pool}`;
export async function spotHolds(pool: string): Promise<Hold[]> { return (await kv().get<Hold[]>(poolKey(pool))) ?? []; }
export async function spotsLeft(t: EventTier): Promise<number | null> {
  if (!t.spots || !t.pool) return null;
  return Math.max(0, t.spots - (await spotHolds(t.pool)).length);
}
/** Count a spot once per payment or Zelle notice */
export async function takeSpot(pool: string, h: Hold) {
  const list = await spotHolds(pool);
  if (list.some((x) => x.ref === h.ref)) return;
  await kv().set(poolKey(pool), [...list, h]);
}
export async function releaseSpot(pool: string, ref: string) {
  await kv().set(poolKey(pool), (await spotHolds(pool)).filter((x) => x.ref !== ref));
}
