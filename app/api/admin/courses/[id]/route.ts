import { deleteCourse, getCourse, listEnrollments, saveCourse, uniqueCourseSlug } from "@/lib/courses";
import { sanitizeCourse } from "@/lib/course-sanitize";
import { error, json, requireAdmin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const saved = await getCourse(id);
  if (!saved) return error("Course not found.", 404);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const next = sanitizeCourse(b, saved);
  next.slug = await uniqueCourseSlug(next.slug, id);
  await saveCourse(next);
  return json({ ok: true, course: next });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  if ((await listEnrollments({ courseId: id })).length) {
    return error("This course has learners. Archive it instead so their access and records stay intact.");
  }
  await deleteCourse(id);
  return json({ ok: true });
}
