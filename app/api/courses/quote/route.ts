import { getCourse } from "@/lib/courses";
import { quote } from "@/lib/course-logic";
import { error, json } from "@/lib/http";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const c = await getCourse(String(b.courseId || ""));
  if (!c || c.status !== "published") return error("Course not found.", 404);
  const q = quote(c, { packageId: String(b.packageId || ""), planId: String(b.planId || ""), addOnIds: Array.isArray(b.addOnIds) ? b.addOnIds.map(String) : [], couponCode: String(b.coupon || "") });
  return json({ ...q, pkg: undefined });
}
