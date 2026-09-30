import Link from "next/link";
import { getSettings } from "@/lib/data";
import { bookingContext, slotsFor } from "@/lib/booking-server";
import BookingPicker from "@/components/site/BookingPicker";

export const metadata = {
  title: "Book a time",
  description: "Pick a time for a free consult or your session with Build & Bloom Collective.",
};
export const dynamic = "force-dynamic";

type SP = { type?: string; e?: string; name?: string; email?: string; lane?: string };

export default async function Book({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const ctx = await bookingContext(s, sp);
  const days = ctx.blocked ? [] : await slotsFor(s, ctx.minutes);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{ctx.mode === "consult" ? "Book a consult" : "Book a session"}</p>
          <h1 style={{ marginTop: 16 }}>{ctx.title}</h1>
          <span className="rule" aria-hidden="true" />
          {ctx.intro && <p className="lede">{ctx.intro}</p>}
          {ctx.mode !== "consult" && <p style={{ marginTop: 16 }}><Link href={ctx.backHref}>← {ctx.backLabel}</Link></p>}
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          {ctx.blocked === "signin" ? (
            <div className="card stack" style={{ maxWidth: 620, gap: 12 }}>
              <h3>Please sign in first</h3>
              <p className="muted">Sign in with your access code, then open your course and click Book a time.</p>
              <Link className="btn btn-primary" href="/portal" style={{ alignSelf: "flex-start" }}>Sign in</Link>
            </div>
          ) : ctx.blocked === "nosessions" ? (
            <div className="card stack" style={{ maxWidth: 620, gap: 12 }}>
              <h3>You have used all of your included sessions</h3>
              <p className="muted">Want more time together? Reach out{s.email ? ` at ${s.email}` : ""} and we can add a session to your package.</p>
              <Link className="btn btn-ghost" href={ctx.backHref} style={{ alignSelf: "flex-start" }}>{ctx.backLabel}</Link>
            </div>
          ) : (
            <BookingPicker
              days={days}
              mode={ctx.mode}
              minutes={ctx.minutes}
              title={ctx.title}
              where={s.booking.meetingLink ? "Video call (link on the next screen)" : s.booking.location}
              eid={ctx.eid}
              type={sp.type === "session" ? "session" : ""}
              initial={{ name: ctx.name || String(sp.name ?? "").slice(0, 120), email: ctx.email || String(sp.email ?? "").slice(0, 200), lane: sp.lane === "business" || sp.lane === "other" ? sp.lane : "orgs" }}
              email={s.email}
            />
          )}
        </div>
      </section>
    </>
  );
}
