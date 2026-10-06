import { currentClient } from "@/lib/auth";
import { getCatalog, rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";
import { applyAccounts, applyIntake, getBuild, saveBuild } from "@/lib/builds";
import { intakeProgress } from "@/lib/build-def";
import { notifyAdmin } from "@/lib/notify";

// The client fills in their build questionnaire, checks off accounts, and asks for add-ons
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (!(await rateLimit(`build:${client.id}`, 900, 60 * 60))) return error("Too many saves at once. Give it a minute.", 429);
  const b = await getBuild(client.id);
  if (!b.enabled) return error("Your build workspace isn't open yet.", 404);
  const x = await req.json().catch(() => ({}));
  applyIntake(b, x.intake);
  applyAccounts(b, x.accounts);
  const desk = `/admin/clients/${client.id}/build`;
  let after: (() => Promise<void>) | null = null;
  if (x.submit === true) {
    b.intakeSubmittedAt = new Date().toISOString();
    const p = intakeProgress(b);
    after = () => notifyAdmin(`${client.name} sent their build questionnaire`, [`${client.contactName || client.name} submitted the build questionnaire (${p.done} of ${p.total} answered).`], desk);
  }
  if (x.request) {
    if (b.requests.filter((r) => r.status === "new").length >= 20) return error("You have several requests waiting. We will answer those first.");
    const catalog = await getCatalog();
    const svc = catalog.services.find((s) => s.id === String(x.request.addOnId) && s.kind === "addon" && s.active && s.id.startsWith("sysadd-"));
    const note = String(x.request.note || "").trim().slice(0, 2000);
    if (!svc && !note) return error("Choose an add-on or describe what you'd like.");
    const label = svc?.name ?? "Something else";
    b.requests = [{ id: newId(), at: new Date().toISOString(), addOnId: svc?.id ?? "", label, note, status: "new" as const, reply: "" }, ...b.requests].slice(0, 60);
    after = () => notifyAdmin(`${client.name} requested a build add-on`, [`Add-on: ${label}`, note], desk);
  }
  await saveBuild(client.id, b);
  if (after) await after();
  return json(b);
}
