import { listClients, getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { getPlan, savePlan } from "@/lib/workspace";
import { emailReady, sendEmail, sessionMinutes, whenText } from "@/lib/invite";
import { renderEmail } from "@/lib/email-template";
import { emailBrand } from "@/lib/email";
import { sendFollowAlong } from "@/lib/bloom-again";

export const dynamic = "force-dynamic";

// Runs once a day (see vercel.json). Emails each client the day before a strategy session
// with the time, the call link, and what they still have open. Each session is reminded once.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!emailReady()) return Response.json({ ok: true, sent: 0, note: "Email is not set up, so no reminders went out." });

  const origin0 = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  // Bloom Again readers get their next daily note
  const bloomAgain = await sendFollowAlong(origin0).catch(() => ({ sent: 0, failed: -1 }));

  const today = nowET().date;
  const t = new Date(`${today}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  const tomorrow = t.toISOString().slice(0, 10);
  const origin = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const settings = await getSettings();
  const brand = await emailBrand(origin);
  let sent = 0;
  const failed: string[] = [];

  for (const client of await listClients()) {
    if (client.status === "archived" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email || "")) continue;
    const plan = await getPlan(client.id);
    if (!plan.enabled) continue;
    let changed = false;
    for (const s of plan.sessions) {
      if (s.status === "done" || s.date !== tomorrow || s.remindedFor === s.date) continue;
      const when = whenText(s.date, s.start, sessionMinutes(s));
      const open = plan.tasks.filter((x) => x.owner === "client" && x.status !== "done").slice(0, 12);
      const room = `${origin}/p/${client.slug}/room/${s.id}`;
      const first = client.contactName || "there";
      const { html, text } = renderEmail(brand, {
        eyebrow: "Tomorrow", heading: s.title || "Strategy session",
        body: [`Hi ${first},`, `A reminder that our strategy session is **${when}**.`, s.goal ? `**Focus:** ${s.goal}` : "", open.length ? "**Still open on your side:**" : ""].filter(Boolean).join("\n\n"),
        list: open.map((x) => `${x.title}${x.due ? ` (due ${x.due})` : ""}`),
        buttons: [...(s.link ? [{ label: "Join the call", url: s.link }] : []), { label: "Open your strategy room", url: room }],
        note: `Sign in with your portal code at ${origin}/portal first.`,
        signoff: `See you tomorrow,\n${settings.brandName}`,
      });
      const r = await sendEmail({ to: [client.email], subject: `Reminder: strategy session ${when}`, text, html, replyTo: settings.email || undefined });
      if (r.ok) { s.remindedFor = s.date; changed = true; sent++; } else failed.push(client.name);
    }
    if (changed) await savePlan(plan);
  }
  return Response.json({ ok: true, date: tomorrow, sent, failed, bloomAgain });
}
