import { currentClient } from "@/lib/auth";
import { amountPaid, getCatalog, rateLimit } from "@/lib/data";
import { error, json, siteOrigin } from "@/lib/http";
import { buildCharge, payChoices, type PayOption } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  const s = stripe();
  if (!s) return error("Online payments are not turned on yet. Please reach out and we will send an invoice.", 503);
  if (!(await rateLimit(`pay:${client.id}`, 30, 60 * 60))) return error("Too many tries. Try again later.", 429);

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email for your receipt.");

  const catalog = await getCatalog();
  const offered = new Set(client.addOnIds);
  const addOns = catalog.services.filter(
    (sv) => sv.kind === "addon" && sv.active && offered.has(sv.id) && (Array.isArray(body.addOnIds) ? body.addOnIds : []).includes(sv.id) && typeof sv.price === "number"
  );
  const paid = amountPaid(client);
  const option = String(body.option) as PayOption;
  const charge = buildCharge({
    inv: client.investment,
    paid,
    option,
    customAmount: Number(body.customAmount),
    addOns,
    packageTitle: client.package.title,
  });
  if (charge.error) return error(charge.error);

  const addOnTotal = addOns.reduce((t, a) => t + (a.price || 0), 0);
  const packageAmount = Math.round((charge.total - addOnTotal) * 100) / 100;
  const optionLabel = payChoices(client.investment, paid).find((c) => c.id === option)?.label || "Payment";
  const origin = await siteOrigin();

  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: charge.lines.map((l) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(l.amount * 100),
        product_data: { name: l.label.slice(0, 250) },
      },
    })),
    metadata: {
      clientId: client.id,
      payerName: name,
      option,
      optionLabel,
      packageAmount: packageAmount.toFixed(2),
      addOnTotal: addOnTotal.toFixed(2),
      addOnIds: addOns.map((a) => a.id).join(","),
    },
    payment_intent_data: {
      description: `${client.name}: ${charge.lines.map((l) => l.label).join(", ")}`.slice(0, 500),
      metadata: { clientId: client.id },
    },
    success_url: `${origin}/p/${client.slug}?paid={CHECKOUT_SESSION_ID}#pay`,
    cancel_url: `${origin}/p/${client.slug}?canceled=1#pay`,
  });
  return json({ url: session.url });
}
