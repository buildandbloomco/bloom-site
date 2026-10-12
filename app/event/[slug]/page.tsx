import { notFound } from "next/navigation";
import { eventOpen, getEvent } from "@/lib/event-def";
import { eventAccess } from "@/lib/events";
import { getSettings } from "@/lib/data";
import { bookProps } from "@/lib/booking";
import Ribbon from "@/components/Ribbon";
import EventGate from "@/components/event/EventGate";
import EventOffers from "@/components/event/EventOffers";
import "@/components/event/event.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guest offers", robots: { index: false, follow: false } };

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ canceled?: string }> }) {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) notFound();
  const s = await getSettings();
  const inside = await eventAccess(slug);
  const open = eventOpen(e);
  const ends = new Date(e.endsAt).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

  return (
    <main className="gate ev">
      <Ribbon />
      <header className="gate-head">
        <span className="brandmark"><img src="/logo.png" alt="" /><span>{s.brandName.toUpperCase()}</span></span>
        <span className="eyebrow" style={{ fontSize: "0.75rem" }}>Guests only</span>
      </header>
      {!open ? (
        <div className="ev-narrow stack" style={{ gap: 18 }}>
          <p className="eyebrow">{e.name}</p>
          <h1>These offers have <span className="ink">closed.</span></h1>
          <span className="rule" aria-hidden="true" />
          <p>Thank you for being in the room. You can still work with us at our regular rates. Book a free consult and we will find the right place to start.</p>
          <div><a className="btn btn-primary" {...bookProps(s)}>Book a free consult</a></div>
        </div>
      ) : !inside ? (
        <div className="ev-narrow stack" style={{ gap: 22 }}>
          <div className="stack" style={{ gap: 12 }}>
            <p className="eyebrow">Welcome, guests of {e.name}</p>
            <h1>Your offers, <span className="ink">just for this room.</span></h1>
            <span className="rule" aria-hidden="true" />
          </div>
          <div className="gate-card boxed">
            <p style={{ fontSize: "1.15rem", margin: 0 }}>Enter the room code from Jadon&rsquo;s share.</p>
            <EventGate slug={e.slug} />
            <p className="small muted" style={{ margin: 0 }}>Open through {ends} Eastern.</p>
          </div>
        </div>
      ) : (
        <EventOffers event={e} ends={ends} canceled={(await searchParams).canceled === "1"} contact={{ email: s.email, phone: s.phone }} />
      )}
    </main>
  );
}
