import { getCourse, saveEnrollment } from "@/lib/courses";
import { quote } from "@/lib/course-logic";
import { activate, findOrCreateClient, newEnrollment } from "@/lib/enroll";
import { rateLimit } from "@/lib/data";
import { saveLead } from "@/lib/leads";
import { newId } from "@/lib/crypto";
import { startClientSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { clientIp, error, json, siteOrigin } from "@/lib/http";

export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`enroll:${ip}`, 12, 3600))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => ({}));
  const course = await getCourse(String(b.courseId || ""));
  if (!course || course.status !== "published") return error("This course is not open for enrollment.");
  const name = String(b.name || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().slice(0, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email.");
  const addOnIds: string[] = Array.isArray(b.addOnIds) ? b.addOnIds.map(String) : [];
  const planId = String(b.planId || "");
  const coupon = String(b.coupon || "");
  const q = quote(course, { packageId: String(b.packageId || ""), planId, addOnIds, couponCode: coupon });
  if (!q.pkg) return error("Choose a package.");
  if (q.error) return error(q.error);

  const e = newEnrollment(course, q, { name, email, clientId: "", addOnIds, planId, couponCode: coupon && !q.error ? coupon.toUpperCase() : "" });

  // Free (or fully discounted): open it right away
  if (q.total <= 0 && !q.monthly) {
    const r = await findOrCreateClient(name, email);
    e.clientId = r.client.id;
    e.showCode = r.created;
    await activate(e);
    await saveEnrollment(e);
    await startClientSession(r.client.id);
    return json({ url: `/learn/${e.id}?welcome=1` });
  }

  const s = stripe();
  if (!s) {
    // Payments not connected yet: save it as a lead so nothing is lost
    await saveLead({
      id: newId(), createdAt: new Date().toISOString(), status: "new", lane: "other", name, email, phone: "", organization: "", role: "", website: "",
      interests: [], goals: `Wants to enroll in ${course.title}: ${q.pkg.name}${q.installments > 1 ? ` (${q.installments} payments)` : ""}.`,
      challenges: "", budget: "", timeline: "", heardFrom: "Course page", assessment: null, notes: "", clientId: null,
    });
    return json({ message: "Thank you! Online enrollment is opening soon. We saved your spot and will email you to finish enrolling." });
  }

  await saveEnrollment(e);
  const origin = await siteOrigin();
  const common = {
    customer_email: email,
    metadata: { kind: "course", enrollmentId: e.id, note: q.monthly ? "First month" : q.installments > 1 ? `Payment 1 of ${q.installments}` : "Paid in full" },
    success_url: `${origin}/api/courses/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/courses/${course.slug}?canceled=1`,
  };
  const session = q.monthly
    ? await s.checkout.sessions.create({
        ...common,
        mode: "subscription",
        line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(q.total * 100), recurring: { interval: "month" }, product_data: { name: `${course.title}: ${q.pkg.name}` } } }],
        subscription_data: { metadata: { enrollmentId: e.id } },
      })
    : await s.checkout.sessions.create({
        ...common,
        mode: "payment",
        line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: Math.round(q.firstPayment * 100), product_data: { name: q.installments > 1 ? `${course.title}: ${q.pkg.name} (payment 1 of ${q.installments})` : `${course.title}: ${q.pkg.name}${addOnIds.length ? " + add-ons" : ""}` } } }],
      });
  return json({ url: session.url });
}
