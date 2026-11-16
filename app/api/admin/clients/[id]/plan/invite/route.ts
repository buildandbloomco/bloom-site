import { getClient, getSettings } from "@/lib/data";
import { error, json, requireAdmin, siteOrigin } from "@/lib/http";
import { getPlan, savePlan } from "@/lib/workspace";
import { fromAddress, inviteIcs, sendEmail, sessionMinutes, whenText } from "@/lib/invite";
import { renderEmail } from "@/lib/email-template";
import { emailBrand } from "@/lib/email";

const isEmail = (v: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(v);

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
  const { html, text } = renderEmail(await emailBrand(origin), {
    eyebrow: s.invitedAt ? "Updated session" : "Your next session", heading: s.title || "Strategy session",
    body: [`Hi ${first},`, `Our next strategy session is **${when}**.`, s.goal ? `**Focus:** ${s.goal}` : "", note].filter(Boolean).join("\n\n"),
    buttons: [...(s.link ? [{ label: "Join the call", url: s.link }] : []), { label: "Open your strategy room", url: room }],
    note: `Sign in with your portal code at ${origin}/portal first. The calendar invite is attached.`,
    signoff: `See you then,\n${settings.brandName}`,
  });
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
