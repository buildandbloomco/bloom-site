import "server-only";
import { getSettings } from "./data";
import { siteOrigin } from "./http";
import { emailReady, sendEmail } from "./invite";
import { renderEmail } from "./email-template";
import { emailBrand } from "./email";


/** Tell you by email when a client does something. Does nothing (quietly) until email is set up. Never blocks or breaks the client's action. */
export async function notifyAdmin(subject: string, lines: string[], path = "/admin") {
  try {
    if (!emailReady()) return;
    const [s, origin] = await Promise.all([getSettings(), siteOrigin()]);
    const to = (process.env.NOTIFY_EMAIL || s.notifyEmail || s.email || "").trim();
    if (!to) return;
    const body = lines.filter(Boolean);
    const { html, text } = renderEmail(await emailBrand(origin), { eyebrow: "Your portal", heading: subject, body: body.join("\n\n"), buttons: [{ label: "Open in admin", url: path }] });
    await sendEmail({ to: [to], subject: `[Portal] ${subject}`.slice(0, 180), text, html });
  } catch {
    /* a failed notification must never fail the thing that triggered it */
  }
}
