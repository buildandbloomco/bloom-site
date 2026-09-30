import { learnerApi } from "@/lib/learn";
import { saveEnrollment } from "@/lib/courses";
import { rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";

// Learner asks to schedule one of their included 1:1 sessions
export async function POST(req: Request, ctx: { params: Promise<{ eid: string }> }) {
  const { eid } = await ctx.params;
  const x = await learnerApi(eid);
  if (!x) return error("Please sign in again.", 401);
  if (!(await rateLimit(`sessreq:${eid}`, 10, 3600))) return error("Too many requests. Try again later.", 429);
  const b = await req.json().catch(() => ({}));
  const times = String(b.times || "").trim().slice(0, 500);
  if (!times) return error("Share a few days and times that work for you.");
  x.enrollment.requests.push({ id: newId(), date: new Date().toISOString(), times, note: String(b.note || "").slice(0, 1000), status: "new" });
  await saveEnrollment(x.enrollment);
  return json({ ok: true });
}
