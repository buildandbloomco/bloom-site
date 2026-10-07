/** The contract every client gets automatically. Words in {{DOUBLE BRACES}} are filled in for each client. */

export interface ContractSettings {
  /** send = goes to their portal right away. draft = waits for you to review and send. off = you create agreements by hand. */
  mode: "send" | "draft" | "off";
  /** Hold card payment in the portal until it is signed */
  requiredToPay: boolean;
  /** The state whose law governs the agreement */
  state: string;
  /** Your master template. Empty = use the built-in one. */
  template: string;
}
export const DEFAULT_CONTRACT_SETTINGS: ContractSettings = { mode: "send", requiredToPay: true, state: "Georgia", template: "" };

export const PLACEHOLDERS: [string, string][] = [
  ["{{BRAND}}", "Your business name"],
  ["{{CLIENT}}", "The client or organization name"],
  ["{{DATE}}", "The date the agreement is created"],
  ["{{SCOPE}}", "Their services, from their package"],
  ["{{FEES}}", "Their total, retainer, and price lines"],
  ["{{SERVICE_TERMS}}", "Extra terms that match their services (sessions, operations, workshops, systems builds, and so on)"],
  ["{{STATE}}", "The governing state you set above"],
];

/** Lines that start with "# " are section headings. They are numbered automatically, and a section with nothing in it is left out. */
export const DEFAULT_TEMPLATE = `CLIENT SERVICES AGREEMENT

This Client Services Agreement (the "Agreement") is between {{BRAND}} ("we" or "us") and {{CLIENT}} ("you"). It is dated {{DATE}} and takes effect on the date you sign it.

# Services
We will provide the following services:

{{SCOPE}}

Anything not listed here is outside this Agreement. Changes or additions will be agreed in writing, in your client portal or by email, before that work begins. Changes may affect your fees and timeline.

# Fees and payment
{{FEES}}

Payments are made through your client portal or by another method we both agree to. If a payment is more than 14 days late, we may pause the work until the account is current. Because our time is reserved for you, payments are non-refundable once the work they cover has been delivered or the session they cover has taken place.

# Scheduling
Sessions are scheduled through your client portal or by email. Please give at least 24 hours notice to reschedule. A session missed without notice counts as a session used. If we need to reschedule, we will offer you the next available time at no cost.

# Your part
So the work can move, you agree to:
- share the information, documents, and access we need in a reasonable time
- name one person who can make decisions and give approvals
- review drafts and respond within 5 business days
- tell us promptly if something is not working for you

Delays in these may extend the timeline.

# Confidentiality
Each of us will keep the other's non-public business information confidential and use it only for this work. This continues after the Agreement ends. It does not cover information that is already public, that either of us already knew, or that must be disclosed by law.

# What our services are, and are not
Our work is consulting, education, and organizational support. It is not therapy or clinical care, and it is not legal, tax, accounting, human resources compliance, or financial advice. We do not guarantee specific results, because results depend on many factors outside our control. You remain responsible for the decisions you make for your business.

# Ownership of the work
Once they are paid for in full, the final deliverables we create for you are yours. We keep ownership of our methods, frameworks, templates, and tools, including any we share with you, and you may keep using what we share inside your own organization. Please do not resell or distribute our materials outside your organization. We may describe this work in general terms in our portfolio, without sharing your confidential information, unless you ask us in writing not to.

# Terms for your services
{{SERVICE_TERMS}}

# Term and ending the Agreement
This Agreement begins when you sign it and continues until the services are complete, or until either of us ends it. Either of us may end it with 14 days written notice by email. You will owe fees for work completed and sessions held through the end date. The sections on confidentiality, ownership, and limits of liability continue after the Agreement ends.

# Limits of liability
To the extent the law allows, our total liability under this Agreement is limited to the fees you paid us in the three months before the claim arose, and neither of us is liable to the other for indirect or consequential losses, such as lost profits.

# Independent contractor
We are an independent contractor, not your employee, partner, or agent. We are responsible for our own taxes, tools, and insurance.

# General
This Agreement and the proposal in your client portal are the full agreement between us and replace earlier discussions. Changes must be in writing and agreed by both of us. If one part of this Agreement cannot be enforced, the rest still applies. If we disagree, we will first talk it through in good faith, and try mediation before going to court. This Agreement is governed by the laws of the State of {{STATE}}. An electronic signature is as valid as a handwritten one.

By typing your name below, you confirm that you have read this Agreement, that you agree to it, and that you are authorized to sign for {{CLIENT}}.`;

/** Extra terms added only when the client's package includes that kind of service */
export const SERVICE_TERMS: { id: string; match: (ids: string[], hasPlan: boolean) => boolean; text: string }[] = [
  { id: "strategy", match: (ids, plan) => plan || ids.some((i) => ["strategy", "integrated", "addon-intensive", "addon-checkin", "addon-offer"].includes(i)),
    text: "Strategy sessions. Sessions are working meetings. We keep shared notes, decisions, and tasks in your client portal so you always have a record. Between sessions we answer email within 2 business days. Unused sessions do not carry past the end of your engagement unless we agree otherwise in writing." },
  { id: "operations", match: (ids) => ids.some((i) => ["operations", "integrated", "addon-sops"].includes(i)),
    text: "Operations and organizing support. You may give us access to your accounts, files, and systems so we can do this work. We will use that access only for the work, and you may remove it at any time. Please share passwords through a secure method and keep your own backups of important records. When the engagement ends, we will hand back or delete access as you direct." },
  { id: "assessment", match: (ids) => ids.includes("org-assessment"),
    text: "Organizational Wellness Assessment. Team survey responses are anonymous. We report results to you as group findings and do not share any individual's answers. The assessment is an organizational review, not a clinical evaluation of any person and not a legal or compliance audit." },
  { id: "training", match: (ids) => ids.some((i) => ["masterclass", "workshops", "addon-team-workshop", "sysadd-training", "sysadd-courses"].includes(i)),
    text: "Workshops and trainings. Materials are for your participants' internal use. Please ask before recording a session. To move a scheduled workshop, give at least 7 days notice. With less notice, the session fee still applies and we will work with you to find a new date." },
  { id: "events", match: (ids) => ids.some((i) => ["events", "addon-dayof"].includes(i)),
    text: "Events. Unless your proposal says otherwise, venues and vendors contract with you directly, and their fees are separate from ours. Date or scope changes within 14 days of an event may carry added costs, which we will confirm with you first." },
  { id: "systems", match: (ids) => ids.some((i) => i.startsWith("systems-") || i.startsWith("sysadd-") || i === "addon-care-plan"),
    text: "Systems builds. Your site or system is built on accounts in your name, so you own it. You pay third-party costs directly to those providers, including hosting, your AI assistant subscription, your domain, and payment processing. We use AI-assisted tools in our build process, and we review and test the work before it reaches you. Two rounds of revisions are included. We will fix defects in what we built at no charge if you report them within 30 days of launch. Later changes are covered by a care plan or quoted separately. Third-party services can change or go down in ways we do not control. You are responsible for the content you provide and for making sure your site meets the legal requirements for your business, such as privacy notices. The system is not designed to store protected health information unless we agree to that in writing." },
];

export interface ContractInput { brand: string; client: string; date: string; state: string; scope: string[]; fees: string; serviceIds: string[]; hasPlan: boolean }

export function buildContract(template: string, x: ContractInput): string {
  const terms = SERVICE_TERMS.filter((t) => t.match(x.serviceIds, x.hasPlan)).map((t) => t.text).join("\n\n");
  const fill = (s: string) => s
    .replaceAll("{{BRAND}}", x.brand).replaceAll("{{CLIENT}}", x.client).replaceAll("{{DATE}}", x.date).replaceAll("{{STATE}}", x.state || "Georgia")
    .replaceAll("{{SCOPE}}", x.scope.map((s) => `- ${s}`).join("\n")).replaceAll("{{FEES}}", x.fees).replaceAll("{{SERVICE_TERMS}}", terms);
  const [intro, ...sections] = (template.trim() || DEFAULT_TEMPLATE).split(/^# /m);
  let n = 0;
  const out = [fill(intro).trim()];
  for (const sec of sections) {
    const nl = sec.indexOf("\n");
    const title = (nl === -1 ? sec : sec.slice(0, nl)).trim();
    const body = fill(nl === -1 ? "" : sec.slice(nl + 1)).trim();
    if (!body) continue; // nothing to say for this client, so leave the section out
    out.push(`${++n}. ${title}\n${body}`);
  }
  // A client name that ends in a period ("Co.") should not leave two in a row
  return out.join("\n\n").replace(/([^.])\.\.(?=\s|$)/g, "$1.");
}
