import { getClient, saveClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

// Record a payment made outside the portal (invoice, Zelle, cash...), or remove one.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const b = await req.json().catch(() => ({}));
  const amount = Math.round((Number(b.amount) || 0) * 100) / 100;
  if (amount <= 0) return error("Enter an amount.");
  c.payments.push({
    id: newId(),
    kind: b.kind === "addon" ? "addon" : "package",
    amount,
    description: String(b.description || "Payment").slice(0, 300),
    date: String(b.date || new Date().toISOString().slice(0, 10)),
    method: String(b.method || "Manual").slice(0, 60),
  });
  await saveClient(c);
  return json({ payments: c.payments });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const c = await getClient(id);
  if (!c) return error("Client not found.", 404);
  const pid = new URL(req.url).searchParams.get("paymentId");
  c.payments = c.payments.filter((p) => p.id !== pid);
  await saveClient(c);
  return json({ payments: c.payments });
}
