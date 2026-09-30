import { learnerApi } from "@/lib/learn";
import { saveEnrollment } from "@/lib/courses";
import { allLessons } from "@/lib/course-logic";
import { error, json } from "@/lib/http";

// Autosave workbook answers
export async function POST(req: Request, ctx: { params: Promise<{ eid: string }> }) {
  const { eid } = await ctx.params;
  const x = await learnerApi(eid);
  if (!x) return error("Please sign in again.", 401);
  const b = await req.json().catch(() => null);
  if (!b || typeof b.answers !== "object") return error("Bad request.");
  const valid = new Set(allLessons(x.course).flatMap((l) => l.lesson.prompts.map((p) => p.id)));
  for (const [k, v] of Object.entries(b.answers as Record<string, unknown>)) {
    if (!valid.has(k)) continue;
    if (typeof v === "string") x.enrollment.answers[k] = v.slice(0, 20000);
    else if (Array.isArray(v)) x.enrollment.answers[k] = JSON.parse(JSON.stringify(v).slice(0, 50000));
  }
  await saveEnrollment(x.enrollment);
  return json({ ok: true });
}
