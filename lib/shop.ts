import "server-only";
import { kv } from "./kv";
import { sign, verify } from "./crypto";
import { getClient, getSettings, saveClient } from "./data";
import { siteOrigin } from "./http";
import { emailReady, sendEmail } from "./invite";
import { findOrCreateClient } from "./enroll";
import { DEFAULT_PRODUCTS, PRODUCT_KINDS, priceLabel, type Order, type Product } from "./shop-def";

const PK = "bb:shop:products";
const OK = "bb:shop:orders";
const OWN = "bb:shop:owned";

export async function listProducts(): Promise<Product[]> {
  return (await kv().get<Product[]>(PK)) ?? DEFAULT_PRODUCTS;
}
export async function saveProducts(p: Product[]) { await kv().set(PK, p); }
export async function getProduct(slugOrId: string) {
  return (await listProducts()).find((p) => p.slug === slugOrId || p.id === slugOrId) ?? null;
}

export async function getOrder(id: string) { return (await kv().hget<Order>(OK, id)) ?? null; }
export async function saveOrder(o: Order) { await kv().hset(OK, o.id, o); }
export async function listOrders(): Promise<Order[]> {
  return Object.values(await kv().hgetall<Order>(OK)).sort((a, b) => b.at.localeCompare(a.at));
}
export async function ownedIds(clientId: string): Promise<string[]> { return (await kv().hget<string[]>(OWN, clientId)) ?? []; }

/** Download links last 90 days */
export const dlToken = (orderId: string, productId: string) => sign(`${orderId}:${productId}`, 90 * 24 * 3600);
export function readDlToken(t: string | null): { orderId: string; productId: string } | null {
  const v = verify(t ?? undefined);
  if (!v) return null;
  const [orderId, productId] = v.split(":");
  return orderId && productId ? { orderId, productId } : null;
}

/** The products an order delivers: the product itself, plus anything a bundle includes */
export async function deliverables(o: Order): Promise<Product[]> {
  const all = await listProducts();
  const p = all.find((x) => x.id === o.productId);
  if (!p) return [];
  return [p, ...(p.alsoGrants ?? []).map((id) => all.find((x) => x.id === id)).filter((x): x is Product => !!x)].filter((x) => x.file);
}

/** Mark an order paid, give the buyer a portal (paid products), and put the products in it. Safe to call twice. */
export async function fulfill(o: Order, sessionId?: string): Promise<{ order: Order; created: boolean }> {
  const fresh = (await getOrder(o.id)) ?? o;
  if (fresh.status === "paid") return { order: fresh, created: false };
  fresh.status = "paid";
  if (sessionId) fresh.sessionId = sessionId;
  let created = false;
  if (fresh.method !== "free" && !fresh.clientId) {
    const r = await findOrCreateClient(fresh.name, fresh.email);
    fresh.clientId = r.client.id;
    created = r.created;
    if (r.created) {
      r.client.billing = "none";
      r.client.welcome = `Welcome, ${r.client.contactName}! Your books and tools live here, along with free tools to help you build.`;
      r.client.notes = [r.client.notes, `Shop customer since ${fresh.at.slice(0, 10)} (${fresh.title}).`].filter(Boolean).join("\n");
      await saveClient(r.client);
    }
  }
  await saveOrder(fresh);
  const items = await deliverables(fresh);
  if (fresh.clientId) {
    const own = new Set(await ownedIds(fresh.clientId));
    const p = await getProduct(fresh.productId);
    for (const id of [fresh.productId, ...(p?.alsoGrants ?? [])]) own.add(id);
    await kv().hset(OWN, fresh.clientId, [...own]);
    const c = await getClient(fresh.clientId);
    const slugs = items.map((x) => x.guideSlug).filter((x): x is string => !!x);
    if (c && slugs.length) {
      c.guideSlugs = Array.from(new Set([...(c.guideSlugs ?? ["client-guidebook"]), ...slugs]));
      await saveClient(c);
    }
  }
  await emailDownloads(fresh, items);
  return { order: fresh, created };
}

async function emailDownloads(o: Order, items: Product[]) {
  try {
    if (!emailReady() || !items.length) return;
    const [s, origin] = await Promise.all([getSettings(), siteOrigin()]);
    const links = items.map((p) => ({ title: p.title, url: `${origin}/api/shop/download?t=${encodeURIComponent(dlToken(o.id, p.id))}` }));
    await sendEmail({
      to: [o.email],
      subject: `Your download: ${o.title}`,
      text: [`Hi ${o.name.split(" ")[0]},`, "", `Thank you for your order. Here ${links.length > 1 ? "are your downloads" : "is your download"}:`, ...links.map((l) => `${l.title}: ${l.url}`), "", "These links work for 90 days.", "", s.brandName].join("\n"),
      html: `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2C1B13;max-width:560px"><p>Hi ${o.name.split(" ")[0].replace(/</g, "")},</p><p>Thank you for your order. Here ${links.length > 1 ? "are your downloads" : "is your download"}:</p>${links.map((l) => `<p><a href="${l.url}" style="display:inline-block;background:#2C1B13;color:#fff;padding:9px 18px;border-radius:999px;text-decoration:none">Download ${l.title.replace(/</g, "")}</a></p>`).join("")}<p style="color:#6a574b;font-size:14px">These links work for 90 days.</p><p>${s.brandName}</p></div>`,
    });
  } catch {
    /* the order is still fulfilled; the download is on their thank-you page and in their portal */
  }
}

/* ---------- Cleaning what admin sends ---------- */
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const okUrl = (u: string) => !u || u.startsWith("/") || /^https:\/\//.test(u);

export function cleanProducts(input: unknown): Product[] | string {
  if (!Array.isArray(input)) return "Nothing to save.";
  const out: Product[] = [];
  const slugs = new Set<string>(), ids = new Set<string>();
  for (const raw of input.slice(0, 100) as Record<string, unknown>[]) {
    const title = str(raw.title, 120);
    if (!title) return "Every product needs a title.";
    let slug = slugify(str(raw.slug, 60) || title);
    while (slugs.has(slug)) slug = `${slug}-2`;
    slugs.add(slug);
    let id = slugify(str(raw.id, 60)) || slug;
    while (ids.has(id)) id = `${id}-2`;
    ids.add(id);
    const price = Math.max(0, Math.round(Number(raw.price) * 100) / 100 || 0);
    if (price > 0 && price < 1) return `${title}: paid products need a price of at least $1.`;
    const was = Math.round(Number(raw.was) * 100) / 100 || 0;
    const cover = str(raw.cover, 600), file = str(raw.file, 600);
    if (!okUrl(cover) || !okUrl(file)) return `${title}: links must start with https://, or upload the file.`;
    const status = (["live", "soon", "hidden"] as const).includes(raw.status as "live") ? (raw.status as Product["status"]) : "hidden";
    if (status === "live" && !file) return `${title}: add the file buyers get before making it live, or set it to Coming soon.`;
    out.push({
      id, slug, title, subtitle: str(raw.subtitle, 240), description: str(raw.description, 4000), price,
      ...(was > price ? { was } : {}),
      kind: (PRODUCT_KINDS as readonly string[]).includes(String(raw.kind)) ? String(raw.kind) : "Guide",
      cover, file, ...(str(raw.guideSlug, 60) ? { guideSlug: str(raw.guideSlug, 60) } : {}),
      ...(Array.isArray(raw.alsoGrants) && raw.alsoGrants.length ? { alsoGrants: raw.alsoGrants.map(String).slice(0, 20) } : {}),
      includes: (Array.isArray(raw.includes) ? raw.includes : []).map((x) => str(x, 200)).filter(Boolean).slice(0, 12),
      ...(str(raw.pages, 40) ? { pages: str(raw.pages, 40) } : {}),
      status, featured: raw.featured === true,
    });
  }
  return out;
}

export const label = priceLabel;
