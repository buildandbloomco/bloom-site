import { getClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import { applyAccounts, applyAdmin, applyIntake, cleanLink, getBuild, saveBuild } from "@/lib/builds";

// Everything you do on a client's build: turn it on, move the stage, post updates, answer add-on requests,
// and fill in the intake yourself during a consultation.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!(await getClient(id))) return error("Not found.", 404);
  const x = await req.json().catch(() => ({}));
  const b = await getBuild(id);
  applyAdmin(b, x);
  applyIntake(b, x.intake);
  applyAccounts(b, x.accounts);
  if (x.update && String(x.update.text || "").trim()) b.updates = [{ id: newId(), at: new Date().toISOString(), text: String(x.update.text).trim().slice(0, 3000), link: cleanLink(x.update.link) }, ...b.updates].slice(0, 100);
  if (typeof x.removeUpdate === "string") b.updates = b.updates.filter((u) => u.id !== x.removeUpdate);
  if (x.request && typeof x.request.id === "string") {
    const r = b.requests.find((q) => q.id === x.request.id);
    if (r) {
      if (["new", "quoted", "added", "declined"].includes(x.request.status)) r.status = x.request.status;
      if (typeof x.request.reply === "string") r.reply = x.request.reply.slice(0, 2000);
    }
  }
  if (x.reopenIntake === true) b.intakeSubmittedAt = null;
  await saveBuild(id, b);
  return json(b);
}
