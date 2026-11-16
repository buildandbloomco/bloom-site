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
  // Accents and punctuation are dropped so a name works as a code: "José O'Neil" -> "JOSEONEIL".
  // Codes are only ever letters, numbers, and dashes, so this doesn't change any existing code.
  return code.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
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

// Access codes are a flower, a garden word, and three numbers, e.g. PEONY-MEADOW-418:
// easy to read out and type, and about 3.7 million combinations, so they can't be guessed.
const FLOWERS = ["ASTER", "AZALEA", "BEGONIA", "BLUEBELL", "CAMELLIA", "CLOVER", "COSMOS", "DAHLIA", "DAISY", "FERN", "FREESIA", "GARDENIA", "HAZEL", "HEATHER", "HIBISCUS", "HOLLY", "IRIS", "IVY", "JASMINE", "JUNIPER", "LAVENDER", "LILAC", "LILY", "LOTUS", "MAGNOLIA", "MAPLE", "MARIGOLD", "MIMOSA", "MINT", "MYRTLE", "OLIVE", "ORCHID", "PANSY", "PEONY", "PERIWINKLE", "POPPY", "PRIMROSE", "ROSE", "SAFFRON", "SAGE", "SORREL", "SUNFLOWER", "THYME", "TULIP", "VIOLET", "WILLOW", "WISTERIA", "YARROW", "ZINNIA", "ACACIA", "ALOE", "BASIL", "CEDAR", "CYPRESS", "ELDER", "FIG", "GINGER", "HONEYSUCKLE", "LAUREL", "MOSS", "PINE", "ROSEMARY", "SEQUOIA", "TANSY"];
const GARDEN = ["MEADOW", "RIVER", "GARDEN", "SUNRISE", "HARBOR", "MORNING", "BREEZE", "SPRING", "BLOSSOM", "ORCHARD", "PRAIRIE", "VALLEY", "CANYON", "COAST", "DAWN", "DEW", "EMBER", "FIELD", "GROVE", "HAVEN", "HILL", "HOLLOW", "ISLAND", "LAKE", "LANTERN", "MEADOWLARK", "MESA", "MIST", "MOON", "NEST", "OCEAN", "PATH", "PEBBLE", "POND", "RAIN", "RIDGE", "ROOT", "SEED", "SHORE", "SKY", "SPROUT", "STAR", "STONE", "STREAM", "SUMMER", "SUN", "THICKET", "TIDE", "TRAIL", "WATER", "WAVE", "WILD", "WIND", "WINTER", "AUTUMN", "BROOK", "CLOUD", "CREEK", "FOREST", "GLADE", "HARVEST", "LIGHT", "PETAL", "SOIL"];
const pick = <T,>(list: T[]) => list[crypto.randomInt(list.length)];
export function generateCode(): string {
  return `${pick(FLOWERS)}-${pick(GARDEN)}-${crypto.randomInt(100, 1000)}`;
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
