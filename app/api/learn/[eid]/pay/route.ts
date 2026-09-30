import { learnerApi } from "@/lib/learn";
import { nextPayment } from "@/lib/course-logic";
import { stripe } from "@/lib/stripe";
import { error, json, siteOrigin } from "@/lib/http";

// Pay the next installment (or the first payment of a pending enrollment)
export async function POST(_req: Request, ctx: { params: Promise<{ eid: string }> }) {
  const { eid } = await ctx.params;
  const x = await learnerApi(eid);
  if (!x) return error("Please sign in again.", 401);
  const s = stripe();
  if (!s) return error("Online payments are not turned on yet. Please reach out and we will send an invoice.", 503);
  const e = x.enrollment;
  const np = nextPayment(e);
  if (!np) return error("Nothing is due right now.");
  const origin = await siteOrigin();
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: e.email || undefined,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(np.amount * 100), product_data: { name: `${x.course.title}: payment ${e.payments.length + 1} of ${e.installments}` } } }],
    metadata: { kind: "course", enrollmentId: e.id, note: `Payment ${e.payments.length + 1} of ${e.installments}` },
    success_url: `${origin}/learn/${e.id}?paid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/learn/${e.id}`,
  });
  return json({ url: session.url });
}
