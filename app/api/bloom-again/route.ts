import { rateLimit } from "@/lib/data";
import { joinFollowAlong } from "@/lib/bloom-again";
import { clientIp, error, json, siteOrigin } from "@/lib/http";

const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

// Bloom Again journal readers join the free 30-day email follow-along
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`bloomagain:${ip}`, 8, 60 * 60))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  if (str(b.company_url)) return json({ ok: true, status: "started" }); // spam trap
  const name = str(b.name, 120);
  const email = str(b.email);
  if (!name) return error("Please add your first name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email address.");
  const origin = (process.env.SITE_URL || (await siteOrigin())).replace(/\/$/, "");
  const r = await joinFollowAlong(name, email, origin);
  return json({ ok: true, ...r });
}
