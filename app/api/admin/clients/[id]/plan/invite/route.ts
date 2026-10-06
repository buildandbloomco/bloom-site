import { getClient, getSettings } from "@/lib/data";
import { error, json, requireAdmin, siteOrigin } from "@/lib/http";
import { getPlan, savePlan } from "@/lib/workspace";
import { fromAddress, inviteIcs, sendEmail, sessionMinutes, whenText } from "@/lib/invite";

const isEmail = (v: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(v);
const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Email the client a real calendar invitation for a strategy session
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const plan = await getPlan(id);
  const s = plan.sessions.find((x) => x.id === String(b.sid));
  if (!s) return error("Session not found.", 404);
  if (!s.date || !s.start) return error("Set the date and time on the session first.");
  const to = [...new Set([client.email, ...String(b.extra || "").split(/[,\s]+/)].map((x) => x.trim()).filter(isEmail))].slice(0, 10);
  if (!to.length) return error("Add the client's email on their client page first, or type an address.");
  const [settings, origin] = await Promise.all([getSettings(), siteOrigin()]);
  const minutes = sessionMinutes(s);
  const when = whenText(s.date, s.start, minutes);
  const room = `${origin}/p/${client.slug}/room/${s.id}`;
  const note = String(b.note || "").trim().slice(0, 1500);
  const first = client.contactName || "there";
  const seq = (s.inviteSeq ?? 0) + (s.invitedAt ? 1 : 0);
  const text = [`Hi ${first},`, "", `Our next strategy session is ${when}.`, ...(s.goal ? [`Focus: ${s.goal}`] : []), ...(s.link ? [`Join the call: ${s.link}`] : []), "", `Your strategy room: ${room}`, `(Sign in with your portal code at ${origin}/portal first.)`, ...(note ? ["", note] : []), "", "The calendar invite is attached.", "", settings.brandName].filter((x, i, arr) => x !== "" || (i > 0 && arr[i - 1] !== "")).join("\n");
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2C1B13;max-width:560px">
<p>Hi ${h(first)},</p><p>Our next strategy session is <strong>${h(when)}</strong>.</p>
${s.goal ? `<p><strong>Focus:</strong> ${h(s.goal)}</p>` : ""}
${s.link ? `<p><a href="${h(s.link)}" style="display:inline-block;background:#854327;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none">Join the call</a></p>` : ""}
<p><a href="${h(room)}">Open your strategy room</a><br><span style="color:#6b5a4c;font-size:14px">Sign in with your portal code at ${h(origin)}/portal first.</span></p>
${note ? `<p>${h(note).replace(/\n/g, "<br>")}</p>` : ""}
<p style="color:#6b5a4c;font-size:14px">The calendar invite is attached.</p><p>${h(settings.brandName)}</p></div>`;
  const ics = inviteIcs({
    uid: `ps-${s.id}`, title: `${s.title} with ${settings.brandName}`, date: s.date, start: s.start, minutes, link: s.link || "", sequence: seq,
    description: [s.goal, s.link ? `Join the call: ${s.link}` : "", `Your strategy room: ${room}`].filter(Boolean).join("\n"),
    organizer: { name: settings.brandName, email: settings.email || fromAddress() }, attendees: to,
  });
  const sent = await sendEmail({ to, subject: `${s.invitedAt ? "Updated: " : ""}Strategy session, ${when}`, text, html, replyTo: settings.email || undefined, ics });
  if (!sent.ok) return error(sent.error || "Could not send.", 503);
  s.invitedAt = new Date().toISOString();
  s.invitedTo = to.join(", ");
  s.inviteSeq = seq;
  await savePlan(plan);
  return json({ ok: true, invitedAt: s.invitedAt, invitedTo: s.invitedTo });
}
