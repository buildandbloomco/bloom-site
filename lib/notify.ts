import "server-only";
import { getSettings } from "./data";
import { siteOrigin } from "./http";
import { emailReady, sendEmail } from "./invite";

const h = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Tell you by email when a client does something. Does nothing (quietly) until email is set up. Never blocks or breaks the client's action. */
export async function notifyAdmin(subject: string, lines: string[], path = "/admin") {
  try {
    if (!emailReady()) return;
    const [s, origin] = await Promise.all([getSettings(), siteOrigin()]);
    const to = (process.env.NOTIFY_EMAIL || s.email || "").trim();
    if (!to) return;
    const link = `${origin}${path}`;
    const body = lines.filter(Boolean);
    await sendEmail({
      to: [to], subject: `[Portal] ${subject}`.slice(0, 180),
      text: [...body, "", `Open: ${link}`].join("\n"),
      html: `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2C1B13;max-width:560px">${body.map((l) => `<p style="margin:0 0 10px">${h(l)}</p>`).join("")}<p><a href="${h(link)}" style="display:inline-block;background:#2C1B13;color:#fff;padding:9px 18px;border-radius:999px;text-decoration:none">Open in admin</a></p></div>`,
    });
  } catch {
    /* a failed notification must never fail the thing that triggered it */
  }
}
