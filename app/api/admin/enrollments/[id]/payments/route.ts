import { getEnrollment, saveEnrollment } from "@/lib/courses";
import { activate } from "@/lib/enroll";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const e = await getEnrollment(id);
  if (!e) return error("Enrollment not found.", 404);
  const b = await req.json().catch(() => ({}));
  const amount = Math.round((Number(b.amount) || 0) * 100) / 100;
  if (amount <= 0) return error("Enter an amount.");
  e.payments.push({ id: newId(), amount, date: String(b.date || new Date().toISOString().slice(0, 10)).slice(0, 10), method: String(b.method || "Manual").slice(0, 40), note: String(b.note || "").slice(0, 200) });
  await activate(e);
  await saveEnrollment(e);
  return json(e);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const e = await getEnrollment(id);
  if (!e) return error("Enrollment not found.", 404);
  const pid = new URL(req.url).searchParams.get("paymentId");
  e.payments = e.payments.filter((p) => p.id !== pid);
  await saveEnrollment(e);
  return json(e);
}
