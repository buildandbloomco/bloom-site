import "server-only";
import { createHash } from "crypto";
import { kv } from "./kv";

/** A document a client reads and signs in their portal by typing their name */
export interface Agreement {
  id: string;
  title: string;
  body: string;
  status: "draft" | "sent" | "signed";
  /** Card payments in the portal are blocked until this is signed */
  requiredToPay: boolean;
  createdAt: string;
  sentAt: string | null;
  signedAt: string | null;
  signedName: string;
  signedTitle: string;
  signedIp: string;
  /** Fingerprint of the exact text that was signed */
  signedHash: string;
}

const KEY = "bb:agreements";
export async function listAgreements(clientId: string): Promise<Agreement[]> {
  return (await kv().hget<Agreement[]>(KEY, clientId)) ?? [];
}
export async function saveAgreements(clientId: string, list: Agreement[]) {
  await kv().hset(KEY, clientId, list);
}
export const fingerprint = (a: Pick<Agreement, "title" | "body">) => createHash("sha256").update(`${a.title}\n\n${a.body}`).digest("hex");
export const needsSignature = (list: Agreement[]) => list.filter((a) => a.status === "sent");
export const blocksPayment = (list: Agreement[]) => list.some((a) => a.status === "sent" && a.requiredToPay);

/** A plain starting point. Have a lawyer review your agreement before you rely on it. */
export const AGREEMENT_TEMPLATE = (clientName: string, brand: string) => `This agreement is between ${brand} ("we") and ${clientName} ("you").

1. Services
We will provide the services described in your proposal in your client portal. Any change in scope will be agreed in writing in the portal or by email.

2. Term
This agreement begins on the date you sign it and continues until the services are complete, or until either of us ends it under section 7.

3. Fees and payment
You agree to pay the fees shown in your proposal. A retainer, if listed, is due before work begins. Remaining balances are due as shown in your portal. Payments are non-refundable once the work they cover has been delivered.

4. Your part
You agree to provide information we need in a reasonable time, attend scheduled sessions or give at least 24 hours notice to reschedule, and name one person who can make decisions.

5. Confidentiality
We will keep your business information confidential and use it only to do this work. Anonymous team survey responses are shared with you only as group results.

6. What this is not
Our work is consulting, education, and organizational support. It is not therapy, legal advice, or financial advice. Results depend on many factors, and we do not guarantee specific outcomes.

7. Ending the agreement
Either of us may end this agreement with 14 days written notice. You will owe fees for work completed through the end date.

8. Materials
You own the final deliverables we create for you once they are paid for. We keep ownership of our methods, templates, and tools, and you may keep using what we share with you inside your organization.

9. Entire agreement
This agreement and your proposal are the full agreement between us. Changes must be in writing.

By typing your name below, you agree to these terms.`;
