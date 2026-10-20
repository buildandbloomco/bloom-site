import { NextResponse } from "next/server";
import { startClientSession } from "@/lib/auth";
import { sign } from "@/lib/crypto";
import { stripe } from "@/lib/stripe";
import { fulfill, getOrder } from "@/lib/shop";

// Stripe sends buyers here after paying: deliver the order and show the thank-you page
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") || "";
  const s = stripe();
  if (!s || !id.startsWith("cs_")) return NextResponse.redirect(new URL("/shop", req.url));
  try {
    const session = await s.checkout.sessions.retrieve(id);
    const oid = session.metadata?.orderId || "";
    const o = session.metadata?.kind === "shop" && session.payment_status === "paid" ? await getOrder(oid) : null;
    if (!o) return NextResponse.redirect(new URL("/shop", req.url));
    const { order, created } = await fulfill(o, session.id);
    // Only a portal made by this purchase is opened automatically
    if (created && order.clientId) await startClientSession(order.clientId);
    return NextResponse.redirect(new URL(`/shop/thanks?o=${order.id}&k=${encodeURIComponent(sign(order.id, 30 * 24 * 3600))}${created ? "&new=1" : ""}`, req.url));
  } catch {
    return NextResponse.redirect(new URL("/shop", req.url));
  }
}
