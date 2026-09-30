import "server-only";
import crypto from "crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is missing or too short. Add it in Vercel > Settings > Environment Variables.");
  }
  return "dev-only-secret-change-me-before-launch";
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Lookup key for an access code (the code itself is never stored in plain text) */
export function codeIndex(code: string): string {
  return crypto.createHmac("sha256", secret()).update("code:" + normalizeCode(code)).digest("hex");
}

function codeKey(): Buffer {
  return crypto.createHash("sha256").update("enc:" + secret()).digest();
}

/** Encrypted copy so you can see a client's code again in admin */
export function encryptCode(code: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", codeKey(), iv);
  const enc = Buffer.concat([c.update(normalizeCode(code), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptCode(payload: string): string {
  try {
    const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = crypto.createDecipheriv("aes-256-gcm", codeKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function generateCode(prefix = "BLOOM"): string {
  let out = "";
  const bytes = crypto.randomBytes(6);
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${out}`;
}

export function newId(): string {
  return crypto.randomBytes(8).toString("hex");
}

/** Signed, expiring token for cookies: "<value>.<expiresMs>.<sig>" */
export function sign(value: string, maxAgeSeconds: number): string {
  const exp = Date.now() + maxAgeSeconds * 1000;
  const body = `${value}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [value, exp, sig] = parts;
  const expected = crypto.createHmac("sha256", secret()).update(`${value}.${exp}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return value;
}

export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Secret key for your private calendar subscription link */
export function calendarFeedKey(): string {
  return crypto.createHmac("sha256", secret()).update("calendar-feed").digest("hex").slice(0, 32);
}
