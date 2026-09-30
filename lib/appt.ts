import type { Appointment } from "./course-types";

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max);

export function cleanAppt(b: Partial<Appointment>, base: Appointment): Appointment {
  return {
    ...base,
    title: str(b.title, 200) || "Appointment",
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(b.date)) ? str(b.date) : base.date,
    start: /^\d{2}:\d{2}$/.test(str(b.start)) ? str(b.start) : "",
    end: /^\d{2}:\d{2}$/.test(str(b.end)) ? str(b.end) : "",
    kind: (["session", "consult", "event", "other"] as const).includes(b.kind as never) ? (b.kind as Appointment["kind"]) : "other",
    clientId: str(b.clientId, 40),
    enrollmentId: str(b.enrollmentId, 40),
    location: str(b.location, 300),
    link: /^https?:\/\//.test(str(b.link)) ? str(b.link, 1000) : "",
    notes: str(b.notes, 3000),
    countsAsSession: !!b.countsAsSession && !!str(b.enrollmentId),
    blocksDay: !!b.blocksDay,
  };
}

