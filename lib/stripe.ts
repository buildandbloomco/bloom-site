import "server-only";
import Stripe from "stripe";
import { getClient, round2, saveClient } from "./data";
import { newId } from "./crypto";
import { recordEnrollmentPayment } from "./enroll";

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

/** Save a completed Checkout Session onto the client's record (safe to call more than once) */
export async function recordCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid") return false;
  if (session.metadata?.kind === "course" && session.metadata.enrollmentId) {
    const e = await recordEnrollmentPayment(
      session.metadata.enrollmentId,
      round2((session.amount_total ?? 0) / 100),
      session.id,
      session.metadata.note || "Course payment"
    );
    return !!e;
  }
  const clientId = session.metadata?.clientId;
  if (!clientId) return false;
  const client = await getClient(clientId);
  if (!client) return false;
  if (client.payments.some((p) => p.stripeSessionId === session.id)) return true;

  const total = round2((session.amount_total ?? 0) / 100);
  const addOnTotal = round2(Number(session.metadata?.addOnTotal || 0));
  const packageAmount = round2(Number(session.metadata?.packageAmount || 0));
  const addOnIds = (session.metadata?.addOnIds || "").split(",").filter(Boolean);
  const date = new Date((session.created ?? Date.now() / 1000) * 1000).toISOString();
  const payer = session.metadata?.payerName ? ` (paid by ${session.metadata.payerName})` : "";

  if (packageAmount > 0) {
    client.payments.push({
      id: newId(),
      kind: "package",
      amount: packageAmount,
      description: (session.metadata?.optionLabel || "Payment toward package") + payer,
      date,
      method: "Stripe",
      stripeSessionId: session.id,
    });
  }
  if (addOnTotal > 0) {
    client.payments.push({
      id: newId(),
      kind: "addon",
      amount: addOnTotal,
      description: "Add-ons" + payer,
      date,
      method: "Stripe",
      stripeSessionId: session.id,
    });
    client.requests.push({
      id: newId(),
      addOnIds,
      note: `Paid $${addOnTotal.toFixed(2)} for these add-ons through Stripe.`,
      date,
      status: "new",
    });
  }
  if (packageAmount <= 0 && addOnTotal <= 0 && total > 0) {
    client.payments.push({ id: newId(), kind: "package", amount: total, description: "Stripe payment" + payer, date, method: "Stripe", stripeSessionId: session.id });
  }
  if (client.status === "draft" || client.status === "sent") client.status = "active";
  await saveClient(client);
  return true;
}
