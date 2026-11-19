import "server-only";
import { kv } from "./kv";
import { nowET } from "./booking";
import { getSettings } from "./data";
import { emailReady, sendEmail } from "./invite";
import { renderEmail } from "./email-template";
import { emailBrand, unsubToken, unsubscribed } from "./email";
import { firstName } from "./format";
import { DAYS } from "./bloom-again-def";

/** Readers following along with the Bloom Again journal by email */
export interface Reader { email: string; name: string; startedAt: string; /** Last day sent, 0 to 30 */ day: number; /** ET date the last day went out */ sentOn: string }

const KEY = "bb:bloomagain";
const norm = (e: string) => e.trim().toLowerCase();

export async function listReaders(): Promise<Reader[]> {
  return Object.values(await kv().hgetall<Reader>(KEY)).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
export const getReader = (email: string) => kv().hget<Reader>(KEY, norm(email));
const saveReader = (r: Reader) => kv().hset(KEY, norm(r.email), r);

/** Join, or start over once the 30 days are done. Sends Day 1 right away. */
export async function joinFollowAlong(name: string, email: string, origin: string): Promise<{ status: "started" | "already" | "restarted"; day: number; sent: boolean }> {
  const existing = await getReader(email);
  if (existing && existing.day < DAYS.length) {
    if (existing.name !== name) await saveReader({ ...existing, name });
    return { status: "already", day: existing.day, sent: false };
  }
  const r: Reader = { email: email.trim(), name, startedAt: new Date().toISOString(), day: 0, sentOn: "" };
  const sent = await sendDay(r, 1, origin);
  if (sent) { r.day = 1; r.sentOn = nowET().date; }
  await saveReader(r);
  return { status: existing ? "restarted" : "started", day: r.day, sent };
}

async function sendDay(r: Reader, n: number, origin: string): Promise<boolean> {
  const d = DAYS[n - 1];
  if (!d || !emailReady()) return false;
  const [brand, s] = await Promise.all([emailBrand(origin), getSettings()]);
  const unsubscribeUrl = `${origin}/unsubscribe?t=${encodeURIComponent(unsubToken(r.email))}`;
  const last = n === DAYS.length;
  const { html, text } = renderEmail(brand, {
    preheader: d.preheader,
    eyebrow: `Set It Down · Day ${n} of ${DAYS.length}`,
    heading: d.heading,
    body: `Hi ${firstName(r.name) || "friend"},\n\n${d.body}`,
    list: [`Today in your journal: ${d.today}`],
    buttons: last
      ? [{ label: "Upcoming retreats", url: "/workshops" }, { label: "The Wellness Library", url: "/wellness-library" }, { label: "Talk with Jadon", url: "/contact" }]
      : [{ label: "Practices and printables", url: "/bloom-again" }],
    signoff: "With care,\nJadon",
    unsubscribeUrl,
  });
  const res = await sendEmail({ to: [r.email], subject: d.subject, html, text, replyTo: s.email || undefined });
  return res.ok;
}

/** Runs from the daily cron: each reader gets their next day, once per day, until Day 30 */
export async function sendFollowAlong(origin: string): Promise<{ sent: number; failed: number }> {
  if (!emailReady()) return { sent: 0, failed: 0 };
  const today = nowET().date;
  const out = await unsubscribed();
  let sent = 0, failed = 0;
  for (const r of await listReaders()) {
    if (r.day >= DAYS.length || r.sentOn === today || out.has(norm(r.email))) continue;
    const n = r.day + 1;
    if (await sendDay(r, n, origin)) { await saveReader({ ...r, day: n, sentOn: today }); sent++; } else failed++;
  }
  return { sent, failed };
}
