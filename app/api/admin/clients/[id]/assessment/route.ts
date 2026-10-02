import { getClient } from "@/lib/data";
import { listLeads } from "@/lib/leads";
import { error, json, requireAdmin } from "@/lib/http";
import { blankAssessment, cleanAnswers, cleanProfile, getAssessment, saveAssessment } from "@/lib/workspace";
import { newId } from "@/lib/crypto";
import { DOMAINS, PRIORITIES, priorityRank, type Priority } from "@/lib/assessment-def";

type Ctx = { params: Promise<{ id: string }> };

// Turn on the assessment for this client. Pre-fills what they told you on the inquiry form.
export async function POST(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const client = await getClient(id);
  if (!client) return error("Not found.", 404);
  let a = await getAssessment(id);
  if (!a) {
    a = blankAssessment(id, client);
    const lead = (await listLeads()).find((l) => l.clientId === id);
    if (lead) {
      a.profile.orgName = lead.organization || client.name;
      const s = lead.assessment;
      if (s) {
        const total = [s.staffLicensed, s.staffInterns, s.staffAdmin].map(Number).filter((n) => n > 0).reduce((x, y) => x + y, 0);
        a.profile.teamSize = total ? String(total) : "";
        a.profile.roles = [s.staffLicensed && `${s.staffLicensed} direct-service`, s.staffInterns && `${s.staffInterns} interns or trainees`, s.staffAdmin && `${s.staffAdmin} admin and support`].filter(Boolean).join(", ");
        a.profile.services = s.serviceAreas.join(", ");
        a.profile.priorities = [s.modelConflict, s.outcomes.length ? `Hoped-for outcomes: ${s.outcomes.join(", ")}` : ""].filter(Boolean).join("\n");
      }
      a.profile.success = a.profile.success || lead.goals;
    }
  }
  a.enabled = true;
  await saveAssessment(a);
  return json(a);
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const a = await getAssessment(id);
  if (!a) return error("Turn on the assessment first.", 404);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  if (typeof b.enabled === "boolean") a.enabled = b.enabled;
  if (["leader", "team", "review", "shared"].includes(b.status)) {
    if (b.status === "shared" && a.status !== "shared") a.sharedAt = new Date().toISOString();
    a.status = b.status;
  }
  if (typeof b.closesOn === "string") a.closesOn = /^\d{4}-\d{2}-\d{2}$/.test(b.closesOn) ? b.closesOn : "";
  if (b.profile) a.profile = cleanProfile(b.profile, a.profile);
  if (b.leaderAnswers) a.leaderAnswers = cleanAnswers(b.leaderAnswers);
  if (typeof b.summary === "string") a.summary = b.summary.slice(0, 20000);
  if (typeof b.shareComments === "boolean") a.shareComments = b.shareComments;
  if (Array.isArray(b.recommendations)) {
    a.recommendations = b.recommendations.slice(0, 40).map((r: Record<string, string>) => ({
      id: String(r.id || newId()).slice(0, 40), domain: DOMAINS.some((d) => d.id === r.domain) ? r.domain : "",
      title: String(r.title || "").slice(0, 300), detail: String(r.detail || "").slice(0, 3000), taskId: String(r.taskId || "").slice(0, 40),
      priority: (PRIORITIES.some((p) => p.id === r.priority) ? r.priority : "next") as Priority,
    })).filter((r: { title: string }) => r.title.trim())
      // Keep the list ranked: Now, then Next, then Later (your order is kept inside each group)
      .map((r: { priority: string }, i: number) => ({ r, i })).sort((x: { r: { priority: string }; i: number }, y: { r: { priority: string }; i: number }) => priorityRank(x.r.priority) - priorityRank(y.r.priority) || x.i - y.i).map((x: { r: unknown }) => x.r);
  }
  if (b.newLink) {
    const { randomBytes } = await import("crypto");
    a.token = randomBytes(12).toString("base64url");
  }
  await saveAssessment(a);
  return json(a);
}
