import "server-only";
import { kv } from "./kv";
import { codeIndex, encryptCode, newId, normalizeCode } from "./crypto";
import { DEFAULT_CATALOG, DEFAULT_SETTINGS, NEW_ORG_SERVICES } from "./seed";
import type { Catalog, Client, PublicClient, Settings } from "./types";
import { normalizeConsult } from "./consult";

const K = {
  seeded: "bb:seeded",
  settings: "bb:settings",
  catalog: "bb:catalog",
  clients: "bb:clients",
  codes: "bb:codes",
};

export const DEMO_CODE = "BLOOM-DEMO";

let seeding: Promise<void> | null = null;
async function ensureSeeded() {
  if (!seeding) {
    seeding = (async () => {
      if (await kv().get(K.seeded)) return;
      await kv().set(K.settings, DEFAULT_SETTINGS);
      await kv().set(K.catalog, DEFAULT_CATALOG);
      const demo = blankClient("Sample Client Co.", DEFAULT_SETTINGS);
      demo.slug = "sample-client";
      demo.contactName = "Jordan";
      demo.status = "draft";
      demo.welcome =
        "Thank you for making space to talk about what you are building. This portal holds everything for our work together: your package, your investment, add-ons, resources, and next steps. Take your time, and reach out with any questions.";
      demo.package = {
        title: "Strategy & Operations Foundations",
        summary:
          "A 3 month engagement to clarify your vision, design the systems that carry it, and set your team up to grow without burning out.",
        format: "3 month retainer",
        duration: "12 weeks",
        startDate: "",
        serviceIds: ["strategy", "operations"],
        customItems: [{ title: "Bi-weekly working sessions", detail: "Six 60-minute sessions with Jadon" }],
      };
      demo.investment = {
        total: 3000,
        retainer: 1000,
        lineItems: [
          { label: "Strategy & Capacity Consulting (3 months)", amount: 1800 },
          { label: "Operations setup and documentation", amount: 1200 },
        ],
        note: "Sample numbers. Edit or delete this client in Admin.",
      };
      demo.addOnIds = DEFAULT_CATALOG.services.filter((s) => s.kind === "addon").map((s) => s.id);
      await saveClient(demo);
      await setClientCode(demo, DEMO_CODE);
      await kv().set(K.seeded, true);
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

export function blankClient(name: string, settings: Settings): Client {
  const now = new Date().toISOString();
  return {
    id: newId(),
    slug: "",
    name,
    contactName: "",
    email: "",
    status: "draft",
    codeEnc: "",
    codeIndex: "",
    welcome: "",
    package: { title: "", summary: "", format: "", duration: "", startDate: "", serviceIds: [], customItems: [] },
    investment: { total: 0, retainer: 0, lineItems: [], note: "" },
    addOnIds: [],
    libraryIds: [],
    deliverables: [],
    updates: [],
    milestones: [],
    progressOverride: null,
    driveFolderUrl: "",
    consults: [],
    nextSteps: [...settings.defaultNextSteps],
    showBooking: true,
    notes: "",
    payments: [],
    requests: [],
    createdAt: now,
    updatedAt: now,
    lastViewedAt: null,
  };
}

/** Bring records saved by older versions up to date */
export function normalizeClient(c: Client): Client {
  if (!Array.isArray(c.deliverables)) {
    c.deliverables = (c.links ?? []).map((l) => ({
      id: newId(),
      title: l.title,
      type: guessType(l.url),
      url: l.url,
      note: l.note,
      status: "final" as const,
      date: (c.updatedAt || new Date().toISOString()).slice(0, 10),
      dueDate: "",
      group: "",
    }));
  }
  if (!Array.isArray(c.updates)) c.updates = [];
  if (!Array.isArray(c.milestones)) c.milestones = [];
  for (const d of c.deliverables) d.dueDate ??= "";
  if (c.progressOverride === undefined) c.progressOverride = null;
  if (typeof c.driveFolderUrl !== "string") c.driveFolderUrl = "";
  if (!Array.isArray(c.consults)) c.consults = [];
  c.consults = c.consults.map(normalizeConsult);
  if (c.tier !== "business" && c.tier !== "org") c.tier = "";
  if (c.billing !== "none") c.billing = "standard";
  delete c.links;
  return c;
}

export function guessType(url: string): Client["deliverables"][number]["type"] {
  const u = url.toLowerCase();
  if (u.includes("drive.google.com/drive/folders") || u.includes("dropbox.com/sh")) return "folder";
  if (u.includes("docs.google.com/presentation") || u.includes("canva.com")) return "presentation";
  if (u.includes("docs.google.com") || u.endsWith(".pdf")) return "document";
  if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com") || u.includes("loom.com")) return "video";
  if (u.includes("figma.com")) return "design";
  return "other";
}

export async function getSettings(): Promise<Settings> {
  await ensureSeeded();
  const saved = (await kv().get<Settings>(K.settings)) ?? ({} as Partial<Settings>);
  return { ...DEFAULT_SETTINGS, ...saved, booking: { ...DEFAULT_SETTINGS.booking, ...(saved.booking ?? {}) } };
}
export async function saveSettings(s: Settings) {
  await kv().set(K.settings, s);
}

export async function getCatalog(): Promise<Catalog> {
  await ensureSeeded();
  await migrateV2();
  await migratePricing();
  const cat = (await kv().get<Catalog>(K.catalog)) ?? DEFAULT_CATALOG;
  for (const s of cat.services) {
    s.showOnSite ??= s.kind === "core";
    s.lane ??= "both";
    s.showPrice ??= s.kind === "addon";
    if (s.priceOrg === undefined) s.priceOrg = null;
  }
  for (const l of cat.library) l.showOnSite ??= l.kind !== "resource";
  return cat;
}

/** One-time update for the new positioning: adds the organizational wellness offers and new tagline */
let migrating: Promise<void> | null = null;
function migrateV2() {
  if (!migrating) {
    migrating = (async () => {
      if (await kv().get("bb:mig:v2")) return;
      const cat = (await kv().get<Catalog>(K.catalog)) ?? DEFAULT_CATALOG;
      const add = NEW_ORG_SERVICES.filter((n) => !cat.services.some((s) => s.id === n.id));
      cat.services = [...add, ...cat.services];
      const lanes: Record<string, "orgs" | "business" | "both"> = { events: "business", strategy: "both", operations: "both", workshops: "both", integrated: "both" };
      for (const s of cat.services) if (!s.lane && lanes[s.id]) s.lane = lanes[s.id];
      await kv().set(K.catalog, cat);
      const settings = await kv().get<Settings>(K.settings);
      if (settings && settings.tagline === "Strategy, structure, and community care for Black entrepreneurs.") {
        settings.tagline = DEFAULT_SETTINGS.tagline;
        await kv().set(K.settings, settings);
      }
      await kv().set("bb:mig:v2", true);
    })().catch((e) => {
      migrating = null;
      throw e;
    });
  }
  return migrating;
}
/** One-time: add suggested small business and organization prices where a price was still blank */
export const SUGGESTED_PRICES: Record<string, { business: number | null; org: number | null; unit?: string }> = {
  masterclass: { business: 3000, org: 4500, unit: "3-session team program" },
  "org-assessment": { business: 2500, org: 6000, unit: "project" },
  strategy: { business: 2400, org: 4500, unit: "three-session plan" },
  operations: { business: 1500, org: 2800, unit: "per month" },
  workshops: { business: 1500, org: 2500, unit: "per session" },
  events: { business: 2500, org: 4000, unit: "per event, starting" },
  integrated: { business: null, org: null },
  "addon-intensive": { business: 350, org: 475 },
  "addon-sops": { business: 900, org: 1500 },
  "addon-offer": { business: 300, org: 400 },
  "addon-team-workshop": { business: 900, org: 1500 },
  "addon-checkin": { business: 200, org: 275 },
  "addon-dayof": { business: 800, org: 1200 },
};
let pricing: Promise<void> | null = null;
function migratePricing() {
  if (!pricing) {
    pricing = (async () => {
      if (await kv().get("bb:mig:pricing1")) return;
      const cat = (await kv().get<Catalog>(K.catalog)) ?? DEFAULT_CATALOG;
      for (const s of cat.services) {
        const p = SUGGESTED_PRICES[s.id];
        if (!p) continue;
        if (s.price === null || s.price === undefined) { s.price = p.business; if (p.unit && p.business !== null) s.unit = p.unit; }
        if (s.priceOrg === null || s.priceOrg === undefined) s.priceOrg = p.org;
        // A la carte services and their prices go on the Services page
        if (s.kind === "addon") { s.showOnSite = true; s.showPrice = true; }
      }
      await kv().set(K.catalog, cat);
      await kv().set("bb:mig:pricing1", true);
    })().catch((e) => {
      pricing = null;
      throw e;
    });
  }
  return pricing;
}
export async function saveCatalog(c: Catalog) {
  await kv().set(K.catalog, c);
}

export async function listClients(): Promise<Client[]> {
  await ensureSeeded();
  const all = await kv().hgetall<Client>(K.clients);
  return Object.values(all).map(normalizeClient).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClient(id: string): Promise<Client | null> {
  await ensureSeeded();
  const c = await kv().hget<Client>(K.clients, id);
  return c ? normalizeClient(c) : null;
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const all = await listClients();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function findClientByCode(code: string): Promise<Client | null> {
  await ensureSeeded();
  if (!normalizeCode(code)) return null;
  const id = await kv().hget<string>(K.codes, codeIndex(code));
  if (!id) return null;
  return getClient(id);
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "client"
  );
}

export async function uniqueSlug(base: string, selfId?: string): Promise<string> {
  const all = await listClients();
  const taken = new Set(all.filter((c) => c.id !== selfId).map((c) => c.slug));
  let slug = slugify(base);
  let n = 2;
  while (taken.has(slug)) slug = `${slugify(base)}-${n++}`;
  return slug;
}

export async function saveClient(c: Client) {
  c.updatedAt = new Date().toISOString();
  await kv().hset(K.clients, c.id, c);
}

/** Touch without bumping updatedAt (used for "last viewed") */
export async function writeClientRaw(c: Client) {
  await kv().hset(K.clients, c.id, c);
}

export async function deleteClient(c: Client) {
  if (c.codeIndex) await kv().hdel(K.codes, c.codeIndex);
  await kv().hdel(K.clients, c.id);
}

export class CodeTakenError extends Error {}

export async function setClientCode(c: Client, code: string) {
  const norm = normalizeCode(code);
  if (norm.length < 6) throw new Error("Access codes need at least 6 characters.");
  if (!/^[A-Z0-9-]+$/.test(norm)) throw new Error("Use only letters, numbers, and dashes in access codes.");
  const idx = codeIndex(norm);
  const owner = await kv().hget<string>(K.codes, idx);
  if (owner && owner !== c.id) throw new CodeTakenError("That access code is already used by another client.");
  if (c.codeIndex && c.codeIndex !== idx) await kv().hdel(K.codes, c.codeIndex);
  await kv().hset(K.codes, idx, c.id);
  c.codeIndex = idx;
  c.codeEnc = encryptCode(norm);
  await saveClient(c);
}

export function toPublic(c: Client): PublicClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { codeEnc, codeIndex, notes, ...rest } = c;
  return {
    ...rest,
    // Only sheets you chose to share, and never your private notes
    // The starting price only goes along when you chose to share it
    consults: c.consults.filter((x) => x.shared).map((x) => ({ ...x, privateNotes: "", quote: x.quote.share ? x.quote : { ...x.quote, prices: {}, qty: {}, discount: 0, discountNote: "", note: "" } })),
  };
}

export function amountPaid(c: Client): number {
  return round2(c.payments.filter((p) => p.kind !== "addon").reduce((s, p) => s + (Number(p.amount) || 0), 0));
}

export function totalCollected(c: Client): number {
  return round2(c.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const n = await kv().incr(`bb:rl:${key}`, windowSeconds);
  return n <= limit;
}
