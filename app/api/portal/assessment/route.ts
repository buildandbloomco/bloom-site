import { notifyAdmin } from "@/lib/notify";
import { currentClient } from "@/lib/auth";
import { rateLimit } from "@/lib/data";
import { error, json } from "@/lib/http";
import { cleanAnswers, cleanProfile, getAssessment, saveAssessment } from "@/lib/workspace";
import { ITEM_COUNT } from "@/lib/assessment-def";

// The leader saves or submits their questionnaire
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (!(await rateLimit(`assess:${client.id}`, 200, 60 * 60))) return error("Too many saves. Try again in a bit.", 429);
  const a = await getAssessment(client.id);
  if (!a || !a.enabled) return error("The assessment isn't open yet.", 404);
  if (a.status === "review" || a.status === "shared") return error("Your answers are locked while we review results.", 403);
  const b = await req.json().catch(() => ({}));
  a.profile = cleanProfile(b.profile, a.profile);
  a.leaderAnswers = cleanAnswers(b.answers ?? a.leaderAnswers);
  if (b.action === "submit") {
    const name = String(b.name || "").trim().slice(0, 120);
    if (!name) return error("Add your name to submit.");
    if (Object.keys(a.leaderAnswers).length < ITEM_COUNT) return error("Please answer every statement before submitting.");
    a.leaderName = name;
    a.leaderSubmittedAt = new Date().toISOString();
    if (a.status === "leader") a.status = "team";
  }
  await saveAssessment(a);
  if (b.action === "submit") await notifyAdmin(`${client.name} submitted the leader questionnaire`, [`${a.leaderName} finished the leader questionnaire for ${client.name}.`], `/admin/clients/${client.id}/assessment`);
  return json({ ok: true, leaderSubmittedAt: a.leaderSubmittedAt, status: a.status });
}
