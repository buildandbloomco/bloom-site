import "server-only";
import { listAppointments, listCourses, listEnrollments } from "./courses";
import { getCatalog, listClients } from "./data";
import { nextPayment } from "./course-logic";
import { listContent } from "./content";
import { contentTypeLabel } from "./content-types";
import { planCalendarItems } from "./workspace";

export interface CalItem {
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
  kind: "session" | "consult" | "event" | "other" | "class" | "milestone" | "deliverable" | "workshop" | "payment" | "content";
  detail: string;
  href: string;
  apptId: string;
  link: string;
}

/** Everything with a date: appointments, class sessions, client deadlines, workshops, installment due dates */
export async function calendarItems(): Promise<CalItem[]> {
  const [appts, courses, enrollments, clients, catalog] = await Promise.all([listAppointments(), listCourses(), listEnrollments(), listClients(), getCatalog()]);
  const items: CalItem[] = [];
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
  for (const a of appts) {
    items.push({ id: `a-${a.id}`, date: a.date, start: a.start, end: a.end, title: a.title, kind: a.kind, detail: [a.bookedOnline ? "Booked online" : "", clientName(a.clientId) || a.guestName || "", a.location, a.notes].filter(Boolean).join("\n"), href: a.leadId ? `/admin/leads/${a.leadId}` : "", apptId: a.id, link: a.link });
  }
  for (const c of courses.filter((x) => x.status !== "archived")) {
    for (const s of c.liveSessions) {
      items.push({ id: `l-${s.id}`, date: s.date, start: s.start, end: s.end, title: `${c.title}: ${s.title}`, kind: "class", detail: s.location, href: `/admin/courses/${c.id}?tab=schedule`, apptId: "", link: s.link });
    }
  }
  for (const cl of clients.filter((x) => x.status !== "archived")) {
    for (const m of cl.milestones) if (m.due && !m.done) items.push({ id: `m-${m.id}`, date: m.due, start: "", end: "", title: `${cl.name}: ${m.title}`, kind: "milestone", detail: "Milestone due", href: `/admin/clients/${cl.id}`, apptId: "", link: "" });
    for (const d of cl.deliverables) if (d.dueDate && d.status !== "final") items.push({ id: `d-${d.id}`, date: d.dueDate, start: "", end: "", title: `${cl.name}: ${d.title}`, kind: "deliverable", detail: "Deliverable due", href: `/admin/clients/${cl.id}`, apptId: "", link: "" });
  }
  for (const l of catalog.library) if (l.date && l.active) items.push({ id: `w-${l.id}`, date: l.date, start: "", end: "", title: l.title, kind: "workshop", detail: l.priceLabel, href: "/admin/library", apptId: "", link: l.url });
  for (const e of enrollments.filter((x) => x.status === "active")) {
    const np = nextPayment(e);
    const c = courses.find((x) => x.id === e.courseId);
    if (np && c) items.push({ id: `p-${e.id}`, date: np.due, start: "", end: "", title: `${e.learnerName}: payment due`, kind: "payment", detail: `${c.title} · $${np.amount}`, href: `/admin/courses/${c.id}/learners/${e.id}`, apptId: "", link: "" });
  }
  for (const p of await listContent()) {
    if (!p.date || p.status === "posted") continue;
    items.push({ id: `c-${p.id}`, date: p.date, start: "", end: "", title: /^(youtube|face slot|story|reel)/i.test(p.title) ? p.title : `${contentTypeLabel(p.type)}: ${p.title}`, kind: "content", detail: p.type === "face" ? "Face content: plan and record" : `Status: ${p.status}`, href: `/admin/content/${p.id}`, apptId: "", link: "" });
  }
  // Strategy plan sessions (skipped when a real appointment is already booked that day) and your plan tasks
  for (const x of await planCalendarItems()) {
    if (x.kind === "session" && appts.some((a) => a.clientId === x.clientId && a.date === x.date)) continue;
    items.push({ id: x.id, date: x.date, start: x.start, end: "", title: x.title, kind: x.kind, detail: x.detail, href: x.href, apptId: "", link: x.link || "" });
  }
  return items.filter((i) => i.date).sort((a, b) => (a.date + (a.start || "00")).localeCompare(b.date + (b.start || "00")));
}
