import { checkAdminPassword, startAdminSession, adminPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/data";
import { clientIp, error, json } from "@/lib/http";

export async function POST(req: Request) {
  if (!adminPassword()) return error("ADMIN_PASSWORD is not set. Add it in Vercel > Settings > Environment Variables.", 500);
  const ip = await clientIp();
  if (!(await rateLimit(`admin:${ip}`, 8, 15 * 60))) return error("Too many tries. Wait 15 minutes.", 429);
  const body = await req.json().catch(() => ({}));
  if (!checkAdminPassword(String(body.password || ""))) return error("Wrong password.", 401);
  await startAdminSession();
  return json({ ok: true });
}
