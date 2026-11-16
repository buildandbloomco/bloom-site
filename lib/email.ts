import "server-only";
import { kv } from "./kv";
import { sign, verify, newId } from "./crypto";
import { getSettings } from "./data";
import { siteOrigin } from "./http";
import { emailReady } from "./invite";
import type { EmailBrand } from "./email-template";

/** Your brand details for the email header and footer */
export async function emailBrand(origin?: string): Promise<EmailBrand> {
  const [s, o] = await Promise.all([getSettings(), origin ? Promise.resolve(origin) : siteOrigin()]);
  return { name: s.brandName, tagline: s.tagline, email: s.email, phone: s.phone, website: s.website, instagram: s.instagram, location: s.location, origin: o };
}

/* ---------- Unsubscribe ---------- */
const UNSUB = "bb:email:unsub";
const norm = (e: string) => e.trim().toLowerCase();
// The address is encoded because signed values can't contain dots
export const unsubToken = (email: string) => sign(`unsub:${Buffer.from(norm(email)).toString("base64url")}`, 10 * 365 * 24 * 3600);
export function readUnsubToken(t: string | null): string | null {
  const v = verify(t ?? undefined);
  if (!v?.startsWith("unsub:")) return null;
  try { return Buffer.from(v.slice(6), "base64url").toString("utf8"); } catch { return null; }
}
export async function unsubscribed(): Promise<Set<string>> { return new Set(Object.keys(await kv().hgetall<string>(UNSUB))); }
export async function unsubscribe(email: string) { await kv().hset(UNSUB, norm(email), new Date().toISOString()); }
export async function resubscribe(email: string) { await kv().hdel(UNSUB, norm(email)); }

/* ---------- Sending many at once ---------- */
export interface OneEmail { to: string; subject: string; html: string; text: string; replyTo?: string; unsubscribeUrl?: string }
/** Send up to thousands of emails, 100 per request through Resend's batch endpoint */
export async function sendMany(list: OneEmail[]): Promise<{ sent: number; failed: string[]; error?: string }> {
  if (!emailReady()) return { sent: 0, failed: list.map((x) => x.to), error: "Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM in Vercel." };
  let sent = 0; const failed: string[] = []; let lastError = "";
  const base = (process.env.RESEND_API_URL || "https://api.resend.com/emails").replace(/\/$/, "");
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    try {
      const res = await fetch(`${base}/batch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map((x) => ({ from: process.env.EMAIL_FROM, to: [x.to], subject: x.subject, html: x.html, text: x.text, ...(x.replyTo ? { reply_to: x.replyTo } : {}), ...(x.unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${x.unsubscribeUrl.replace("/unsubscribe?", "/api/email/unsubscribe?")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}) }))),
      });
      if (res.ok) sent += chunk.length;
      else { failed.push(...chunk.map((x) => x.to)); lastError = ((await res.json().catch(() => ({}))) as { message?: string }).message || res.statusText; }
    } catch { failed.push(...chunk.map((x) => x.to)); lastError = "Could not reach the email service."; }
  }
  return { sent, failed, ...(lastError ? { error: `The email service said: ${lastError}` } : {}) };
}

/* ---------- What you've sent ---------- */
export interface SentLog { id: string; at: string; subject: string; audience: string; count: number; sent: number; failed: number }
const LOG = "bb:email:log";
export async function listSent(): Promise<SentLog[]> { return (await kv().get<SentLog[]>(LOG)) ?? []; }
export async function logSent(e: Omit<SentLog, "id" | "at">) { await kv().set(LOG, [{ id: newId(), at: new Date().toISOString(), ...e }, ...(await listSent())].slice(0, 200)); }

/* ---------- Drafts ---------- */
const DRAFT = "bb:email:draft";
export async function getDraft<T>(): Promise<T | null> { return kv().get<T>(DRAFT); }
export async function saveDraft(d: unknown) { await kv().set(DRAFT, d); }
