import { learnerApi } from "@/lib/learn";
import { saveEnrollment } from "@/lib/courses";
import { allLessons, courseProgress } from "@/lib/course-logic";
import { error, json } from "@/lib/http";

export async function POST(req: Request, ctx: { params: Promise<{ eid: string }> }) {
  const { eid } = await ctx.params;
  const x = await learnerApi(eid);
  if (!x) return error("Please sign in again.", 401);
  const b = await req.json().catch(() => ({}));
  const lessonId = String(b.lessonId || "");
  if (!allLessons(x.course).some((l) => l.lesson.id === lessonId)) return error("Lesson not found.");
  const e = x.enrollment;
  if (b.done === false) delete e.completed[lessonId];
  else if (b.done === true) e.completed[lessonId] ??= new Date().toISOString();
  e.lastLessonId = lessonId;
  const p = courseProgress(x.course, e);
  if (p.total && p.done === p.total && e.status === "active") {
    e.status = "completed";
    e.completedAt = new Date().toISOString();
  }
  await saveEnrollment(e);
  return json({ ok: true, percent: p.percent, next: p.next?.id ?? null, completed: e.status === "completed" });
}
