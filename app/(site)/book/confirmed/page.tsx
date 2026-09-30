import Link from "next/link";
import { getAppointment, getEnrollment } from "@/lib/courses";
import { getClient, getSettings } from "@/lib/data";
import { fmtTime, longDate, toMin } from "@/lib/booking";
import { safeEqual } from "@/lib/crypto";
import CancelBooking from "@/components/site/CancelBooking";

export const metadata = { title: "You're booked", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Confirmed({ searchParams }: { searchParams: Promise<{ id?: string; t?: string }> }) {
  const sp = await searchParams;
  const a = await getAppointment(String(sp.id ?? ""));
  const ok = !!a && !!a.token && safeEqual(a.token, String(sp.t ?? ""));
  if (!a || !ok) {
    return (
      <section className="section">
        <div className="wrap narrow stack" style={{ gap: 16 }}>
          <h1>Booking not found</h1>
          <p className="muted">It may have been cancelled. You can always pick a new time.</p>
          <Link className="btn btn-primary" href="/book" style={{ alignSelf: "flex-start" }}>Book a time</Link>
        </div>
      </section>
    );
  }
  const s = await getSettings();
  let back = { href: "/", label: "Back to the website" };
  let rebook = "/book";
  if (a.enrollmentId) {
    back = { href: `/learn/${a.enrollmentId}`, label: "Back to your course" };
    rebook = `/book?e=${a.enrollmentId}`;
  } else if (a.clientId && a.kind === "session") {
    const c = await getClient(a.clientId);
    if (c) back = { href: `/p/${c.slug}`, label: "Back to your portal" };
    rebook = "/book?type=session";
  }
  if (a.enrollmentId && !(await getEnrollment(a.enrollmentId))) back = { href: "/portal", label: "Sign in" };
  const icsHref = `/api/book/ics?id=${a.id}&t=${a.token}`;
  const mins = a.end ? toMin(a.end) - toMin(a.start) : 0;
  const first = (a.guestName || "").split(" ")[0];

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Confirmed</p>
          <h1 style={{ marginTop: 16 }}>You&rsquo;re booked{first ? `, ${first}` : ""}.</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">We look forward to talking with you. Bookmark this page: it is where you can add the call to your calendar, or change the time.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap narrow stack" style={{ gap: 20 }}>
          <div className="card stack" style={{ gap: 14 }}>
            <h3 style={{ margin: 0 }}>{a.kind === "consult" ? s.booking.consultTitle || "Consult" : "Your session"}</h3>
            <p style={{ fontSize: "1.2rem", margin: 0 }}><strong>{longDate(a.date)}</strong> at <strong>{fmtTime(a.start)} ET</strong>{mins > 0 ? ` · ${mins} minutes` : ""}</p>
            {a.link ? (
              <p style={{ margin: 0 }}>Join here: <a href={a.link} target="_blank" rel="noopener noreferrer">{a.link}</a></p>
            ) : (
              <p className="muted" style={{ margin: 0 }}>{a.location ? `${a.location}. ` : ""}We will send the details before our call.</p>
            )}
            <div className="row">
              <a className="btn btn-primary" href={icsHref}>Add to my calendar</a>
              <Link className="btn btn-ghost" href={back.href}>{back.label}</Link>
            </div>
          </div>
          <div className="panel">
            <h3>Need a different time?</h3>
            <CancelBooking id={a.id} token={a.token!} rebook={rebook} />
          </div>
          {s.email && <p className="small muted">Questions? Email <a href={`mailto:${s.email}`}>{s.email}</a>.</p>}
        </div>
      </section>
    </>
  );
}
