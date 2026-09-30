import { rateLimit } from "@/lib/data";
import { saveLead } from "@/lib/leads";
import { newId } from "@/lib/crypto";
import { clientIp, error, json } from "@/lib/http";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 3000) => String(v ?? "").trim().slice(0, max);
const list = (v: unknown, max = 20) => (Array.isArray(v) ? v.map((x) => str(x, 200)).filter(Boolean).slice(0, max) : []);

// Website inquiry form. Each submission shows up in Admin > Leads.
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`inquiry:${ip}`, 6, 60 * 60))) return error("Too many submissions. Please email us instead.", 429);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  if (str(b.company_url)) return json({ ok: true }); // spam trap
  const name = str(b.name, 120);
  const email = str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email address.");
  const lane = b.lane === "business" || b.lane === "other" ? b.lane : "orgs";
  const a = b.assessment && lane === "orgs" ? b.assessment : null;

  const lead: Lead = {
    id: newId(),
    createdAt: new Date().toISOString(),
    status: "new",
    lane,
    name,
    email,
    phone: str(b.phone, 60),
    organization: str(b.organization, 200),
    role: str(b.role, 120),
    website: str(b.website, 300),
    interests: list(b.interests),
    goals: str(b.goals),
    challenges: str(b.challenges),
    budget: str(b.budget, 60),
    timeline: str(b.timeline, 60),
    heardFrom: str(b.heardFrom, 200),
    assessment: a
      ? {
          staffLicensed: str(a.staffLicensed, 10),
          staffInterns: str(a.staffInterns, 10),
          staffAdmin: str(a.staffAdmin, 10),
          serviceAreas: list(a.serviceAreas),
          caseIntensity: str(a.caseIntensity, 5),
          fatigueSigns: list(a.fatigueSigns),
          crisisProtocol: str(a.crisisProtocol),
          billableHours: str(a.billableHours, 40),
          decompression: str(a.decompression, 200),
          supervision: str(a.supervision, 200),
          modelConflict: str(a.modelConflict),
          outcomes: list(a.outcomes),
          identityDynamics: str(a.identityDynamics),
        }
      : null,
    notes: "",
    clientId: null,
  };
  await saveLead(lead);
  return json({ ok: true });
}
