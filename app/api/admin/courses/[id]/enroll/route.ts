import { getCourse, saveEnrollment } from "@/lib/courses";
import { quote } from "@/lib/course-logic";
import { activate, findOrCreateClient, newEnrollment } from "@/lib/enroll";
import { getClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

// Enroll someone yourself (paid another way, a scholarship, or an existing client)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const course = await getCourse(id);
  if (!course) return error("Course not found.", 404);
  const b = await req.json().catch(() => ({}));
  let name = String(b.name || "").trim().slice(0, 120);
  let email = String(b.email || "").trim().slice(0, 200);
  let clientId = "";
  let created = false;
  if (b.clientId) {
    const c = await getClient(String(b.clientId));
    if (!c) return error("Client not found.");
    clientId = c.id;
    name = name || c.contactName || c.name;
    email = email || c.email;
  } else {
    if (!name) return error("Add the learner's name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Add a valid email.");
    const r = await findOrCreateClient(name, email);
    clientId = r.client.id;
    created = r.created;
  }
  const addOnIds: string[] = Array.isArray(b.addOnIds) ? b.addOnIds.map(String) : [];
  const q = quote(course, { packageId: String(b.packageId), planId: String(b.planId || ""), addOnIds });
  if (!q.pkg) return error("Choose a package.");
  const e = newEnrollment(course, q, { name, email, clientId, addOnIds, planId: String(b.planId || ""), couponCode: "", comped: b.payment === "comped" });
  e.showCode = created;
  if (b.payment === "paid" || b.payment === "first") {
    const amount = b.payment === "paid" ? q.total : q.firstPayment;
    e.payments.push({ id: newId(), amount, date: new Date().toISOString().slice(0, 10), method: String(b.method || "Manual"), note: b.payment === "paid" ? "Paid in full" : "First payment" });
  }
  if (b.payment !== "pending") await activate(e);
  await saveEnrollment(e);
  return json({ enrollmentId: e.id, clientId, newClient: created });
}
