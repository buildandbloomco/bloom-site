import { getSettings, rateLimit } from "@/lib/data";
import { getEnrollment, saveAppointment, saveEnrollment } from "@/lib/courses";
import { listLeads, saveLead } from "@/lib/leads";
import { bookingContext, slotsFor } from "@/lib/booking-server";
import { fmtTime, longDate, toMin, toTime } from "@/lib/booking";
import { newId } from "@/lib/crypto";
import { clientIp, error, json } from "@/lib/http";
import type { Appointment } from "@/lib/course-types";
import type { Lead } from "@/lib/types";

const str = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);

// Someone books a time on the booking page. It goes straight onto your admin calendar.
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!(await rateLimit(`book:${ip}`, 8, 60 * 60))) return error("Too many tries. Please email us and we will get you scheduled.", 429);
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  if (str(b.company_url)) return json({ ok: true }); // spam trap

  const settings = await getSettings();
  const ctx = await bookingContext(settings, { type: str(b.type, 20), e: str(b.eid, 40) });
  if (ctx.blocked === "signin") return error("Please sign in again, then book your session.", 401);
  if (ctx.blocked === "nosessions") return error("You have used all of your included sessions.");

  const name = ctx.mode === "consult" ? str(b.name, 120) : ctx.name || str(b.name, 120);
  const email = ctx.mode === "consult" ? str(b.email, 200) : ctx.email || str(b.email, 200);
  if (!name) return error("Please add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please add a valid email address.");

  const date = str(b.date, 10);
  const start = str(b.time, 5);
  const open = await slotsFor(settings, ctx.minutes);
  if (!open.some((d) => d.date === date && d.times.includes(start))) {
    return error("That time was just taken or is no longer available. Please pick another.", 409);
  }
  const end = toTime(toMin(start) + ctx.minutes);
  const topic = str(b.topic);
  const phone = str(b.phone, 60);
  const organization = str(b.organization, 200);

  const a: Appointment = {
    id: newId(),
    title: ctx.mode === "consult" ? `Consult: ${name}${organization ? ` (${organization})` : ""}` : ctx.mode === "learner" ? `1:1 session: ${name} (${ctx.courseTitle})` : `Session: ${name}`,
    date,
    start,
    end,
    kind: ctx.mode === "consult" ? "consult" : "session",
    clientId: ctx.clientId,
    enrollmentId: ctx.eid,
    location: settings.booking.location,
    link: settings.booking.meetingLink,
    notes: [topic && `What they want to talk about: ${topic}`, phone && `Phone: ${phone}`, `Email: ${email}`].filter(Boolean).join("\n"),
    countsAsSession: ctx.mode === "learner",
    createdAt: new Date().toISOString(),
    bookedOnline: true,
    guestName: name,
    guestEmail: email,
    guestPhone: phone,
    token: newId() + newId(),
  };

  if (ctx.mode === "learner") {
    const e = await getEnrollment(ctx.eid);
    if (!e) return error("Please sign in again.", 401);
    e.sessionsUsed += 1;
    e.requests = e.requests.map((r) => (r.status === "new" ? { ...r, status: "scheduled" } : r));
    await saveEnrollment(e);
  }

  if (ctx.mode === "consult") {
    // Add to Leads, or attach to their existing inquiry
    const when = `${longDate(date)} at ${fmtTime(start)} ET`;
    const existing = (await listLeads()).find((l) => l.email.toLowerCase() === email.toLowerCase() && l.status !== "closed");
    const lane = b.lane === "business" || b.lane === "other" ? b.lane : "orgs";
    const lead: Lead = existing ?? {
      id: newId(),
      createdAt: new Date().toISOString(),
      status: "new",
      lane,
      name,
      email,
      phone,
      organization,
      role: str(b.role, 120),
      website: "",
      interests: [],
      goals: topic,
      challenges: "",
      budget: "",
      timeline: "",
      heardFrom: str(b.heardFrom, 200),
      assessment: null,
      notes: "",
      clientId: null,
    };
    if (existing) {
      if (!lead.phone) lead.phone = phone;
      if (!lead.organization) lead.organization = organization;
      if (topic && !lead.goals) lead.goals = topic;
    }
    lead.consult = { date, start, apptId: a.id };
    lead.notes = [lead.notes, `Booked a consult for ${when}.`].filter(Boolean).join("\n");
    a.leadId = lead.id;
    await saveLead(lead);
  }

  await saveAppointment(a);
  return json({ id: a.id, token: a.token });
}
