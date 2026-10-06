import "server-only";
import type { PlanSession } from "./plan-types";

/** Email is optional. It turns on when these two settings exist in Vercel (see the README). */
export const emailReady = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

/** An Eastern Time date and clock time as a real moment */
export function etToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = (time || "09:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const offset = (ms: number) => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms));
    const g = (k: string) => Number(p.find((x) => x.type === k)!.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - ms;
  };
  return new Date(guess - offset(guess - offset(guess)));
}

const esc = (s = "") => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
export const sessionMinutes = (s: Pick<PlanSession, "minutes">) => (s.minutes && s.minutes >= 15 ? s.minutes : 60);

export interface InviteInput { uid: string; title: string; date: string; start: string; minutes: number; link: string; description: string; organizer?: { name: string; email: string }; attendees?: string[]; sequence?: number }

/** A calendar file. With an organizer and attendees it is a real invitation that Gmail, Outlook, and Apple Mail show with Yes / No buttons. */
export function inviteIcs(i: InviteInput): string {
  const from = etToUtc(i.date, i.start), to = new Date(from.getTime() + i.minutes * 60000);
  const invite = !!i.organizer && !!i.attendees?.length;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Build & Bloom Collective//Portal//EN", "CALSCALE:GREGORIAN", `METHOD:${invite ? "REQUEST" : "PUBLISH"}`,
    "BEGIN:VEVENT", `UID:${i.uid}@buildandbloomcollective`, `DTSTAMP:${stamp(new Date())}`, `SEQUENCE:${i.sequence ?? 0}`,
    `DTSTART:${stamp(from)}`, `DTEND:${stamp(to)}`, `SUMMARY:${esc(i.title)}`,
    ...(i.link ? [`LOCATION:${esc(i.link)}`, `URL:${i.link}`] : []),
    `DESCRIPTION:${esc(i.description)}`,
    ...(invite ? [`ORGANIZER;CN=${esc(i.organizer!.name)}:mailto:${i.organizer!.email}`, ...i.attendees!.map((a) => `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`)] : []),
    "STATUS:CONFIRMED", "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function whenText(date: string, start: string, minutes: number) {
  const d = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (!start) return d;
  const [h, m] = start.split(":").map(Number);
  const t = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  return `${d} at ${t} Eastern (${minutes} minutes)`;
}

/** The address inside EMAIL_FROM, which may be written as: Name <you@yourdomain.com> */
export const fromAddress = () => (process.env.EMAIL_FROM || "").match(/<([^>]+)>/)?.[1] ?? (process.env.EMAIL_FROM || "").trim();

export async function sendEmail(opts: { to: string[]; subject: string; text: string; html: string; replyTo?: string; ics?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!emailReady()) return { ok: false, error: "Email isn't set up yet. Add RESEND_API_KEY and EMAIL_FROM in Vercel (see the README), or copy the invite message instead." };
  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
        ...(opts.ics ? { attachments: [{ filename: "invite.ics", content: Buffer.from(opts.ics, "utf8").toString("base64"), content_type: "text/calendar; charset=utf-8; method=REQUEST" }] } : {}),
      }),
    });
    if (res.ok) return { ok: true };
    const d = await res.json().catch(() => ({}));
    return { ok: false, error: `The email service said: ${d.message || res.statusText}` };
  } catch {
    return { ok: false, error: "Could not reach the email service. Try again in a minute." };
  }
}
