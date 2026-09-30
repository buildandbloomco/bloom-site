import "server-only";
import { currentClient } from "./auth";
import { deleteAppointment, getEnrollment, listAppointments, listCourses, saveEnrollment } from "./courses";
import { getLead, saveLead } from "./leads";
import { learnerApi } from "./learn";
import { openSlots, type Busy } from "./booking";
import type { Appointment } from "./course-types";
import type { Settings } from "./types";

export type BookMode = "consult" | "learner" | "client";

export interface BookCtx {
  mode: BookMode;
  minutes: number;
  title: string;
  intro: string;
  name: string;
  email: string;
  eid: string;
  clientId: string;
  courseTitle: string;
  sessionsLeft: number;
  backHref: string;
  backLabel: string;
  /** Shown instead of the calendar (not signed in, no sessions left) */
  blocked: string;
}

/** Everything already on your calendar that should block a booking */
export async function busyTimes(): Promise<Busy[]> {
  const [appts, courses] = await Promise.all([listAppointments(), listCourses()]);
  const busy: Busy[] = [];
  for (const a of appts) {
    if (a.blocksDay) busy.push({ date: a.date, start: "", end: "", allDay: true });
    else if (a.start) busy.push({ date: a.date, start: a.start, end: a.end || a.start });
  }
  for (const c of courses.filter((x) => x.status !== "archived")) {
    for (const s of c.liveSessions) if (s.start) busy.push({ date: s.date, start: s.start, end: s.end || s.start });
  }
  return busy;
}

export async function slotsFor(settings: Settings, minutes: number) {
  return openSlots(settings.booking, minutes, await busyTimes());
}

/** Who is booking and what kind of appointment it is */
export async function bookingContext(settings: Settings, q: { type?: string; e?: string }): Promise<BookCtx> {
  const b = settings.booking;
  const base: BookCtx = {
    mode: "consult",
    minutes: b.consultMinutes || 30,
    title: b.consultTitle || "Free consult",
    intro: b.consultIntro,
    name: "",
    email: "",
    eid: "",
    clientId: "",
    courseTitle: "",
    sessionsLeft: 0,
    backHref: "/",
    backLabel: "Back to the website",
    blocked: "",
  };
  if (q.e) {
    const x = await learnerApi(q.e);
    if (!x) return { ...base, mode: "learner", title: "Book your 1:1 session", blocked: "signin", backHref: "/portal", backLabel: "Sign in" };
    const pkg = x.course.packages.find((p) => p.id === x.enrollment.packageId);
    const left = Math.max(0, x.enrollment.sessionsIncluded - x.enrollment.sessionsUsed);
    return {
      ...base,
      mode: "learner",
      minutes: pkg?.sessionMinutes || b.sessionMinutes || 60,
      title: "Book your 1:1 session",
      intro: `Part of ${x.course.title}. You have ${left} session${left === 1 ? "" : "s"} left.`,
      name: x.enrollment.learnerName,
      email: x.enrollment.email,
      eid: x.enrollment.id,
      clientId: x.client.id,
      courseTitle: x.course.title,
      sessionsLeft: left,
      backHref: `/learn/${x.enrollment.id}`,
      backLabel: "Back to your course",
      blocked: left > 0 ? "" : "nosessions",
    };
  }
  if (q.type === "session") {
    const client = await currentClient();
    if (client) {
      return {
        ...base,
        mode: "client",
        minutes: b.sessionMinutes || 60,
        title: "Book a session",
        intro: "A working session, kickoff, or check-in for our work together.",
        name: client.contactName || client.name,
        email: client.email,
        clientId: client.id,
        backHref: `/p/${client.slug}`,
        backLabel: "Back to your portal",
      };
    }
  }
  return base;
}

/** Remove an appointment and undo what it counted toward */
export async function cancelAppointment(a: Appointment, note: string) {
  if (a.countsAsSession && a.enrollmentId) {
    const e = await getEnrollment(a.enrollmentId);
    if (e) {
      e.sessionsUsed = Math.max(0, e.sessionsUsed - 1);
      await saveEnrollment(e);
    }
  }
  if (a.leadId) {
    const l = await getLead(a.leadId);
    if (l) {
      if (l.consult?.apptId === a.id) l.consult = null;
      l.notes = [l.notes, note].filter(Boolean).join("\n");
      await saveLead(l);
    }
  }
  await deleteAppointment(a.id);
}
