import type Stripe from "stripe";
import { recordCheckoutSession, stripe } from "@/lib/stripe";
import { recordEnrollmentPayment } from "@/lib/enroll";

// In Stripe: Developers > Webhooks > Add endpoint: https://YOUR-SITE/api/stripe/webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded (Klarna/Affirm), invoice.paid (monthly courses)
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return new Response("Stripe is not configured", { status: 503 });
  const sig = req.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await recordCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }
  // Monthly course packages: record each renewal
  if (event.type === "invoice.paid") {
    const inv = event.data.object as Stripe.Invoice;
    const enrollmentId = inv.parent?.subscription_details?.metadata?.enrollmentId;
    if (enrollmentId && inv.billing_reason !== "subscription_create") {
      await recordEnrollmentPayment(enrollmentId, (inv.amount_paid ?? 0) / 100, inv.id ?? `inv-${Date.now()}`, "Monthly renewal");
    }
  }
  return new Response("ok");
}
