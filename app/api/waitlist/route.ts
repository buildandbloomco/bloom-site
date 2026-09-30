import { rateLimit } from "@/lib/data";
import { listWaitlist, saveWaitlistEntry } from "@/lib/waitlist";
import { WELLNESS_INTERESTS, TEAM_SIZES } from "@/lib/wellness";
import { newId } from "@/lib/crypto";
import { clientIp, error, json } from "@/lib/http";
import type { WaitlistEntry } from "@/lib/types";

const str = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);

// Wellness Library waitlist. Joining twice with the same email updates the first entry.
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`waitlist:${ip}`, 8, 60 * 60))) return error("Too many tries. Please try again later.", 429);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  if (str(b.company_url)) return json({ ok: true }); // spam trap
  const name = str(b.name, 120);
  const email = str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email address.");
  const plan = b.plan === "team" ? "team" : "individual";
  if (plan === "team" && !str(b.organization)) return error("Please add your organization.");
  const ids = new Set(WELLNESS_INTERESTS.map(([k]) => k));
  const interests = (Array.isArray(b.interests) ? b.interests : []).map(String).filter((x: string) => ids.has(x));
  const now = new Date().toISOString();
  const existing = (await listWaitlist()).find((x) => x.email.toLowerCase() === email.toLowerCase());
  const entry: WaitlistEntry = {
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    plan,
    name,
    email,
    organization: plan === "team" ? str(b.organization, 200) : str(b.organization, 200),
    role: str(b.role, 120),
    teamSize: plan === "team" && TEAM_SIZES.includes(str(b.teamSize)) ? str(b.teamSize) : "",
    interests,
    note: str(b.note),
    heardFrom: str(b.heardFrom, 200),
    status: existing?.status ?? "waiting",
  };
  await saveWaitlistEntry(entry);
  return json({ ok: true, updated: !!existing });
}
