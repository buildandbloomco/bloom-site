/** The one look for every email the site sends: newsletter style, in Build & Bloom colors.
 *  Used by the Email page (and its live preview in the browser) and by every automatic email.
 *  Built with tables and inline styles so it holds up in Gmail, Outlook, and Apple Mail. */

export interface EmailBrand {
  name: string;
  tagline?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  location?: string;
  /** Absolute link to the site, for the logo and the footer */
  origin: string;
}
export interface EmailButton { label: string; url: string }
export interface EmailContent {
  /** The gray line inbox apps show after the subject */
  preheader?: string;
  /** Small caps line above the heading, e.g. "The Reset Circle" */
  eyebrow?: string;
  heading?: string;
  /** Absolute image URL shown under the header */
  image?: string;
  /** The message. A blank line starts a new paragraph. **bold** and [words](https://link) work. */
  body: string;
  buttons?: EmailButton[];
  /** A short list shown under the message, e.g. tasks or downloads */
  list?: string[];
  /** Small print under the buttons */
  note?: string;
  signoff?: string;
  /** Marketing emails get an unsubscribe link in the footer */
  unsubscribeUrl?: string;
}

const C = { cream: "#f4ede1", card: "#fffdf8", esp: "#2c1b13", rust: "#854327", gold: "#deb547", green: "#2f4a3a", muted: "#6b5a4c", line: "#e4d9c8" };
const SERIF = "Georgia, 'Times New Roman', serif";
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (u: string, origin: string) => (u.startsWith("/") ? origin.replace(/\/$/, "") + u : u);

/** Turn the plain message into email-safe paragraphs */
function richText(body: string, origin: string): string {
  return body.trim().split(/\n\s*\n/).filter(Boolean).map((para) => {
    let h = esc(para.trim());
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, (_m, t, u) => `<a href="${esc(abs(u, origin))}" style="color:${C.rust};text-decoration:underline">${t}</a>`);
    h = h.replace(/\n/g, "<br>");
    return `<p style="margin:0 0 16px;font-family:${SERIF};font-size:17px;line-height:1.6;color:${C.esp}">${h}</p>`;
  }).join("");
}
const plain = (body: string) => body.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

const button = (b: EmailButton, origin: string, primary: boolean) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px"><tr>
<td align="center" bgcolor="${primary ? C.rust : C.card}" style="border-radius:999px;${primary ? "" : `border:2px solid ${C.rust};`}">
<a href="${esc(abs(b.url, origin))}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${SERIF};font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${primary ? "#ffffff" : C.rust};text-decoration:none;border-radius:999px">${esc(b.label)}</a>
</td></tr></table>`;

export function renderEmail(brand: EmailBrand, m: EmailContent): { html: string; text: string } {
  const o = brand.origin;
  const buttons = (m.buttons ?? []).filter((b) => b.label.trim() && b.url.trim());
  const contact = [brand.email, brand.phone].filter(Boolean).join(" · ");
  const links = [brand.website && `<a href="${esc(brand.website)}" style="color:${C.gold};text-decoration:none">Website</a>`, brand.instagram && `<a href="${esc(brand.instagram)}" style="color:${C.gold};text-decoration:none">Instagram</a>`].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(m.heading || brand.name)}</title></head>
<body style="margin:0;padding:0;background:${C.cream}">
${m.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.cream}">${esc(m.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
  <tr><td bgcolor="${C.esp}" style="background:${C.esp};padding:20px 28px;border-radius:0 36px 0 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:12px"><img src="${esc(o)}/logo.png" width="36" height="39" alt="" style="display:block;border:0"></td>
      <td style="font-family:${SERIF};font-size:13px;letter-spacing:4px;color:#f4ede1;font-weight:bold">${esc(brand.name.toUpperCase())}</td>
    </tr></table>
  </td></tr>
  <tr><td height="4" bgcolor="${C.gold}" style="background:${C.gold};font-size:0;line-height:0">&nbsp;</td></tr>
  ${m.image ? `<tr><td bgcolor="${C.card}"><img src="${esc(abs(m.image, o))}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>` : ""}
  <tr><td bgcolor="${C.card}" style="background:${C.card};padding:36px 40px 28px">
    ${m.eyebrow ? `<p style="margin:0 0 10px;font-family:${SERIF};font-size:12px;letter-spacing:4px;text-transform:uppercase;color:${C.rust}">${esc(m.eyebrow)}</p>` : ""}
    ${m.heading ? `<h1 style="margin:0 0 8px;font-family:${SERIF};font-size:32px;line-height:1.2;font-weight:bold;color:${C.green}">${esc(m.heading)}</h1><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 24px"><tr><td width="64" height="3" bgcolor="${C.gold}" style="font-size:0;line-height:0">&nbsp;</td></tr></table>` : ""}
    ${richText(m.body, o)}
    ${m.list?.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px">${m.list.map((x) => `<tr><td width="18" valign="top" style="font-family:${SERIF};font-size:17px;color:${C.gold};padding:3px 0">&#9679;</td><td style="font-family:${SERIF};font-size:16px;line-height:1.5;color:${C.esp};padding:3px 0">${esc(x)}</td></tr>`).join("")}</table>` : ""}
    ${buttons.length ? `<div style="padding:10px 0 6px;text-align:center">${buttons.map((b, i) => button(b, o, i === 0)).join("")}</div>` : ""}
    ${m.note ? `<p style="margin:10px 0 0;font-family:${SERIF};font-size:14px;line-height:1.5;color:${C.muted};text-align:center">${esc(m.note)}</p>` : ""}
    ${m.signoff ? `<p style="margin:26px 0 0;font-family:${SERIF};font-size:17px;line-height:1.5;color:${C.esp};font-style:italic">${esc(m.signoff).replace(/\n/g, "<br>")}</p>` : ""}
  </td></tr>
  <tr><td bgcolor="${C.esp}" style="background:${C.esp};padding:24px 28px;text-align:center">
    ${brand.tagline ? `<p style="margin:0 0 10px;font-family:${SERIF};font-size:14px;font-style:italic;color:#f4ede1">${esc(brand.tagline)}</p>` : ""}
    ${contact ? `<p style="margin:0 0 6px;font-family:${SERIF};font-size:13px;color:#d9ccb8">${esc(contact)}</p>` : ""}
    ${links ? `<p style="margin:0 0 6px;font-family:${SERIF};font-size:13px">${links}</p>` : ""}
    ${brand.location ? `<p style="margin:0 0 6px;font-family:${SERIF};font-size:12px;color:#b8a892">${esc(brand.location)}</p>` : ""}
    ${m.unsubscribeUrl ? `<p style="margin:12px 0 0;font-family:${SERIF};font-size:12px;color:#b8a892">You're getting this because you connected with ${esc(brand.name)}. <a href="${esc(m.unsubscribeUrl)}" style="color:#b8a892;text-decoration:underline">Unsubscribe</a></p>` : ""}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    m.heading ? m.heading.toUpperCase() : "", "",
    plain(m.body.trim()), "",
    ...(m.list?.length ? [...m.list.map((x) => `- ${x}`), ""] : []),
    ...buttons.map((b) => `${b.label}: ${abs(b.url, o)}`),
    m.note ? `\n${m.note}` : "",
    m.signoff ? `\n${m.signoff}` : "",
    "", "--", brand.name, contact, brand.location || "",
    m.unsubscribeUrl ? `Unsubscribe: ${m.unsubscribeUrl}` : "",
  ].filter((x, i, a) => x !== "" || (i > 0 && a[i - 1] !== "")).join("\n").trim();

  return { html, text };
}

/** Replace {first_name} with the person's first name */
export const personalize = (s: string, first: string) => s.replace(/\{first_name\}/gi, first || "there");
