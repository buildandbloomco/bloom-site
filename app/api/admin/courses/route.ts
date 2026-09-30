import { blankCourse, saveCourse, uniqueCourseSlug } from "@/lib/courses";
import { error, json, requireAdmin } from "@/lib/http";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || "").trim().slice(0, 200);
  if (!title) return error("Give the course a title.");
  const c = blankCourse(title);
  c.slug = await uniqueCourseSlug(title);
  await saveCourse(c);
  return json({ id: c.id });
}
