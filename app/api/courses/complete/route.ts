import { NextResponse } from "next/server";
import { startClientSession } from "@/lib/auth";
import { getEnrollment } from "@/lib/courses";
import { recordCheckoutSession, stripe } from "@/lib/stripe";

// Stripe sends people here after paying: record it, sign them in, open the course
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") || "";
  const s = stripe();
  if (!s || !id.startsWith("cs_")) return NextResponse.redirect(new URL("/portal", req.url));
  try {
    const session = await s.checkout.sessions.retrieve(id);
    const eid = session.metadata?.enrollmentId;
    if (!eid || session.payment_status !== "paid") return NextResponse.redirect(new URL("/portal", req.url));
    await recordCheckoutSession(session);
    const e = await getEnrollment(eid);
    if (!e?.clientId) return NextResponse.redirect(new URL("/portal", req.url));
    await startClientSession(e.clientId);
    return NextResponse.redirect(new URL(`/learn/${e.id}?welcome=1`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
}
