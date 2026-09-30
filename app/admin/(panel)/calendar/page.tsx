import { calendarItems } from "@/lib/calendar";
import { getCourse, listEnrollments } from "@/lib/courses";
import { getSettings, listClients } from "@/lib/data";
import { calendarFeedKey } from "@/lib/crypto";
import { siteOrigin } from "@/lib/http";
import CalendarView from "@/components/admin/CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ enrollment?: string; request?: string }> }) {
  const sp = await searchParams;
  const [items, enrollments, clients, origin, settings] = await Promise.all([calendarItems(), listEnrollments(), listClients(), siteOrigin(), getSettings()]);
  const active = await Promise.all(
    enrollments.filter((e) => e.status === "active" || e.status === "completed").map(async (e) => {
      const c = await getCourse(e.courseId);
      return { id: e.id, label: `${e.learnerName}: ${c?.title ?? "Course"} (${e.sessionsUsed}/${e.sessionsIncluded} sessions)`, name: e.learnerName, requests: e.requests.filter((r) => r.status === "new").map((r) => ({ id: r.id, times: r.times, note: r.note })) };
    })
  );
  const requests = active.flatMap((a) => a.requests.map((r) => ({ ...r, enrollmentId: a.id, name: a.name })));
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Calendar</h2>
        <p className="muted small">Your sessions, consults, and events, plus class dates, client deadlines, workshops, and payment due dates.</p>
      </div>
      <CalendarView
        items={items}
        enrollments={active.map(({ id, label }) => ({ id, label }))}
        clients={clients.filter((c) => c.status !== "archived").map((c) => ({ id: c.id, name: c.name }))}
        requests={requests}
        prefill={{ enrollmentId: sp.enrollment ?? "", requestId: sp.request ?? "" }}
        bookingOn={settings.booking.enabled}
        feedUrl={`${origin}/api/calendar/feed?key=${calendarFeedKey()}`}
      />
    </div>
  );
}
