import { error, json, requireAdmin } from "@/lib/http";
import { fulfill, getOrder, saveOrder } from "@/lib/shop";

// Confirm a Zelle order (delivers it and opens their portal) or cancel it
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const o = await getOrder(String(b.orderId || ""));
  if (!o) return error("Order not found.", 404);
  if (o.status !== "pending") return error("That order was already handled.");
  if (b.action === "paid") { const r = await fulfill(o); return json({ ok: true, order: r.order }); }
  if (b.action === "cancel") { o.status = "canceled"; await saveOrder(o); return json({ ok: true, order: o }); }
  return error("Bad request.");
}
