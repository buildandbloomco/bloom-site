import { error, json, requireAdmin } from "@/lib/http";
import { getSettings } from "@/lib/data";
import { audiences, type Person } from "@/lib/email-audience";
import { emailBrand, logSent, saveDraft, sendMany, unsubscribed, unsubToken } from "@/lib/email";
import { personalize, renderEmail, type EmailContent } from "@/lib/email-template";
import { firstName } from "@/lib/format";

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const okUrl = (u: string) => u.startsWith("/") || /^https?:\/\//.test(u);

function cleanContent(b: Record<string, unknown>): (EmailContent & { subject: string }) | string {
  const subject = str(b.subject, 160);
  const body = str(b.body, 12000);
  if (!subject) return "Add a subject.";
  if (!body) return "Write your message.";
  const buttons = (Array.isArray(b.buttons) ? b.buttons : []).slice(0, 2).map((x: Record<string, unknown>) => ({ label: str(x?.label, 40), url: str(x?.url, 600) })).filter((x) => x.label && x.url);
  if (buttons.some((x) => !okUrl(x.url))) return "Button links need to start with https:// or /.";
  const image = str(b.image, 600);
  return {
    subject, body, buttons,
    preheader: str(b.preheader, 200), eyebrow: str(b.eyebrow, 60), heading: str(b.heading, 140),
    ...(image && okUrl(image) ? { image } : {}),
    signoff: str(b.signoff, 200),
  };
}

// Write, test, and send emails in your template from Admin > Email
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.action === "draft") { await saveDraft(b.draft ?? null); return json({ ok: true }); }

  const c = cleanContent((b.content ?? {}) as Record<string, unknown>);
  if (typeof c === "string") return error(c);
  const [brand, settings] = await Promise.all([emailBrand(), getSettings()]);
  const replyTo = settings.email || undefined;
  const build = (p: Person) => {
    const unsubscribeUrl = `${brand.origin}/unsubscribe?t=${encodeURIComponent(unsubToken(p.email))}`;
    const { html, text } = renderEmail(brand, {
      ...c,
      body: personalize(c.body, p.first), heading: personalize(c.heading || "", p.first), preheader: personalize(c.preheader || "", p.first),
      unsubscribeUrl,
    });
    return { to: p.email, subject: personalize(c.subject, p.first), html, text, replyTo, unsubscribeUrl };
  };

  if (b.action === "test") {
    const to = str(b.to, 200) || process.env.NOTIFY_EMAIL || settings.notifyEmail || settings.email || "";
    if (!isEmail(to)) return error("Add an email address for the test.");
    const r = await sendMany([build({ email: to, name: "Test", first: str(b.first, 60) || "Jadon", tag: "Test" })].map((x) => ({ ...x, subject: `[Test] ${x.subject}` })));
    return r.sent ? json({ ok: true, to }) : error(r.error || "The test didn't send.", 503);
  }

  if (b.action !== "send") return error("Bad request.");
  // Work out who it goes to here, never from the browser's list
  let people: Person[] = [];
  let label = "";
  if (b.audienceId) {
    const a = (await audiences()).find((x) => x.id === b.audienceId);
    if (!a) return error("Choose who to send it to.");
    people = a.people; label = a.label;
  } else {
    const emails = (Array.isArray(b.emails) ? b.emails : []).map((x) => str(x, 200)).filter(isEmail).slice(0, 200);
    const known = new Map((await audiences()).find((x) => x.id === "everyone")!.people.map((p) => [p.email.toLowerCase(), p]));
    people = [...new Set(emails.map((e) => e.toLowerCase()))].map((e) => known.get(e) ?? { email: e, name: e, first: firstName(e.split("@")[0]), tag: "" });
    label = people.length === 1 ? people[0].name : `${people.length} people`;
  }
  const unsub = await unsubscribed();
  const skipped = people.filter((p) => unsub.has(p.email.toLowerCase())).length;
  people = people.filter((p) => !unsub.has(p.email.toLowerCase()));
  if (!people.length) return error(skipped ? "Everyone on that list has unsubscribed." : "There's no one with an email on that list.");
  if (b.confirmCount !== people.length) return error(`The list changed: it's now ${people.length} ${people.length === 1 ? "person" : "people"}. Check it and send again.`, 409);

  const r = await sendMany(people.map(build));
  await logSent({ subject: c.subject, audience: label, count: people.length, sent: r.sent, failed: r.failed.length });
  if (!r.sent) return error(r.error || "Nothing was sent.", 503);
  return json({ ok: true, sent: r.sent, failed: r.failed, skipped, error: r.error });
}
