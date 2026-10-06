import { listClients, getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { getPlan, savePlan } from "@/lib/workspace";
import { emailReady, sendEmail, sessionMinutes, whenText } from "@/lib/invite";

export const dynamic = "force-dynamic";
const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Runs once a day (see vercel.json). Emails each client the day before a strategy session
// with the time, the call link, and what they still have open. Each session is reminded once.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!emailReady()) return Response.json({ ok: true, sent: 0, note: "Email is not set up, so no reminders went out." });

  const today = nowET().date;
  const t = new Date(`${today}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  const tomorrow = t.toISOString().slice(0, 10);
  const origin = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const settings = await getSettings();
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
      const text = [`Hi ${first},`, "", `A reminder that our strategy session is ${when}.`, s.goal ? `Focus: ${s.goal}` : "", s.link ? `Join the call: ${s.link}` : "", "",
        ...(open.length ? ["Still open on your side:", ...open.map((x) => `- ${x.title}${x.due ? ` (due ${x.due})` : ""}`), ""] : []),
        `Your strategy room: ${room}`, `(Sign in with your portal code at ${origin}/portal first.)`, "", settings.brandName].filter((x, i, a) => x !== "" || (i > 0 && a[i - 1] !== "")).join("\n");
      const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2C1B13;max-width:560px">
<p>Hi ${h(first)},</p><p>A reminder that our strategy session is <strong>${h(when)}</strong>.</p>
${s.goal ? `<p><strong>Focus:</strong> ${h(s.goal)}</p>` : ""}
${s.link ? `<p><a href="${h(s.link)}" style="display:inline-block;background:#854327;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none">Join the call</a></p>` : ""}
${open.length ? `<p style="margin-bottom:4px"><strong>Still open on your side</strong></p><ul>${open.map((x) => `<li>${h(x.title)}${x.due ? ` <span style="color:#6b5a4c">(due ${h(x.due)})</span>` : ""}</li>`).join("")}</ul>` : ""}
<p><a href="${h(room)}">Open your strategy room</a><br><span style="color:#6b5a4c;font-size:14px">Sign in with your portal code at ${h(origin)}/portal first.</span></p>
<p>${h(settings.brandName)}</p></div>`;
      const r = await sendEmail({ to: [client.email], subject: `Reminder: strategy session ${when}`, text, html, replyTo: settings.email || undefined });
      if (r.ok) { s.remindedFor = s.date; changed = true; sent++; } else failed.push(client.name);
    }
    if (changed) await savePlan(plan);
  }
  return Response.json({ ok: true, date: tomorrow, sent, failed });
}
