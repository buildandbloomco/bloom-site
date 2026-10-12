import { NextResponse } from "next/server";
import { startClientSession } from "@/lib/auth";
import { recordCheckoutSession, stripe } from "@/lib/stripe";

// Stripe sends guests here after paying: record it, sign new clients in, and show the welcome page
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") || "";
  const s = stripe();
  if (!s || !id.startsWith("cs_")) return NextResponse.redirect(new URL("/portal", req.url));
  try {
    const session = await s.checkout.sessions.retrieve(id);
    const m = session.metadata ?? {};
    if (m.kind !== "event" || session.payment_status !== "paid" || !m.clientId) return NextResponse.redirect(new URL("/portal", req.url));
    await recordCheckoutSession(session);
    // Only a portal created in this checkout is opened automatically. Existing clients sign in with their code.
    if (m.newClient === "1") await startClientSession(m.clientId);
    return NextResponse.redirect(new URL(`/event/${m.slug}/welcome?t=${m.tierId}${m.newClient === "1" ? "" : "&existing=1"}`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/portal", req.url));
  }
}
