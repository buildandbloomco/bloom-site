import { clientIp, error, json } from "@/lib/http";
import { rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { addResponse, assessmentByToken, cleanAnswers } from "@/lib/workspace";
import { ITEM_COUNT, OPEN_QUESTIONS, ROLE_GROUPS } from "@/lib/assessment-def";
import { nowET } from "@/lib/booking";

type Ctx = { params: Promise<{ token: string }> };

// Anonymous team survey. No names, emails, or IP addresses are stored with answers.
export async function POST(req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const a = await assessmentByToken(token);
  if (!a || !a.enabled) return error("This survey link isn't active.", 404);
  if (a.status === "review" || a.status === "shared" || (a.closesOn && nowET().date > a.closesOn)) return error("This survey has closed. Thank you!", 410);
  if (!(await rateLimit(`teamsurvey:${token}:${await clientIp()}`, 6, 60 * 60))) return error("Too many submissions from this device. Try again later.", 429);
  const b = await req.json().catch(() => ({}));
  const answers = cleanAnswers(b.answers);
  if (Object.keys(answers).length < ITEM_COUNT) return error("Please answer every statement before submitting.");
  await addResponse(a.clientId, {
    id: newId(), at: new Date().toISOString(), role: ROLE_GROUPS.includes(b.role) ? b.role : "Prefer not to say", answers,
    open: OPEN_QUESTIONS.map((_, i) => String((Array.isArray(b.open) ? b.open[i] : "") || "").slice(0, 2000)),
  });
  return json({ ok: true });
}
