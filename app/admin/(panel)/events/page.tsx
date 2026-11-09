import Link from "next/link";
import { getCatalog } from "@/lib/data";
import { listEvents } from "@/lib/events";
import { eventSummaries, type GuestStatus } from "@/lib/ledger";
import { siteOrigin } from "@/lib/http";
import { money, shortDate } from "@/lib/format";
import EventsEditor from "@/components/admin/EventsEditor";

export const dynamic = "force-dynamic";

const TABS = [["guests", "Who's coming & payments"], ["offers", "Edit event pages"]] as const;
const STATUS: Record<GuestStatus, [string, string]> = { paid: ["Paid", "green"], zelle: ["Zelle to confirm", "gold"], unpaid: ["Didn't finish paying", "rust"] };
const STATE: Record<string, [string, string]> = { open: ["Open", "green"], closed: ["Closed", ""], off: ["Turned off", ""] };

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ tab?: string; show?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "offers" ? "offers" : "guests";

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Events</h2>
        <p className="small muted" style={{ margin: 0 }}>See who signed up for each event and what they paid, and edit the event pages guests buy from.</p>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/events${k === "guests" ? "" : `?tab=${k}`}`} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""}>{label}</Link>
        ))}
      </div>
      {tab === "offers" ? <Offers /> : <Guests showAll={sp.show === "all"} />}
    </div>
  );
}

async function Offers() {
  const [events, catalog, origin] = await Promise.all([listEvents(), getCatalog(), siteOrigin()]);
  const services = catalog.services.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name, price: s.price ?? null }));
  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="small muted" style={{ margin: 0 }}>Private offer pages for events. Guests scan the QR code, enter the room code, and can pay and become clients right there. Your regular prices live under Services &amp; add-ons.</p>
      <EventsEditor initial={events} services={services} origin={origin} />
    </div>
  );
}

async function Guests({ showAll }: { showAll: boolean }) {
  const all = await eventSummaries();
  // Events nobody signed up for and that are no longer open are hidden unless you ask for them
  const list = showAll ? all : all.filter((s) => s.state === "open" || s.guests.length > 0);
  const hidden = all.length - list.length;
  const paidCount = all.reduce((n, s) => n + s.guests.filter((g) => g.status === "paid").length, 0);
  const pending = all.reduce((n, s) => n + s.pending, 0);
  const unpaid = all.reduce((n, s) => n + s.guests.filter((g) => g.status === "unpaid").length, 0);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stat-tiles">
        <div className="panel"><span className="muted small">Open now</span><span className="v">{all.filter((s) => s.state === "open").length}</span></div>
        <div className="panel"><span className="muted small">Paid sign-ups</span><span className="v">{paidCount}</span></div>
        <div className="panel"><span className="muted small">Event revenue</span><span className="v">{money(all.reduce((n, s) => n + s.revenue, 0))}</span></div>
        <div className="panel"><span className="muted small">To follow up</span><span className="v">{pending + unpaid}</span></div>
      </div>

      {list.length === 0 && <p className="muted">No events are open right now. Turn one on under <Link href="/admin/events?tab=offers">Edit event pages</Link>.</p>}

      {list.map((s) => (
        <section key={s.e.slug} className="panel stack" style={{ gap: 14 }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div className="stack" style={{ gap: 4 }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{s.label}</h3>
                <span className={`tag ${STATE[s.state][1]}`}>{STATE[s.state][0]}</span>
                {s.e.open ? <span className="tag">Public · no code</span> : <span className="tag">Private · room code</span>}
              </div>
              {s.e.details && <span className="small">{s.e.details}</span>}
              <span className="tiny muted">{s.state === "open" ? "Sales close" : "Closed"} {when(s.e.endsAt)} · <a href={`/event/${s.e.slug}`} target="_blank" rel="noopener noreferrer">/event/{s.e.slug} ↗</a></span>
            </div>
            <div className="stack" style={{ gap: 2, textAlign: "right" }}>
              <span className="tiny muted">Collected</span>
              <strong style={{ fontSize: "1.5rem", color: "var(--rust)" }}>{money(s.revenue)}</strong>
            </div>
          </div>

          {s.seats.length > 0 && (
            <div className="stack" style={{ gap: 8 }}>
              {s.seats.map((x) => (
                <div key={x.tier} className="stack" style={{ gap: 4 }}>
                  <span className="small"><strong>{x.taken} of {x.total}</strong> seats taken · {x.tier}{x.taken >= x.total ? " · Sold out" : ` · ${x.total - x.taken} left`}</span>
                  <div className="bar sm"><span style={{ width: `${Math.min(100, Math.round((x.taken / Math.max(1, x.total)) * 100))}%` }} /></div>
                </div>
              ))}
              {s.seats.length > 0 && <span className="tiny muted">Seats are shared with any other event that uses the same spot pool, and Zelle sign-ups hold a seat until you confirm or dismiss them.</span>}
            </div>
          )}

          {s.guests.length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>No one has signed up yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Name</th><th>Offer</th><th>Status</th><th style={{ textAlign: "right" }}>Paid</th><th>Date</th><th><span className="sr-only">Open</span></th></tr></thead>
                <tbody>
                  {s.guests.map((g) => (
                    <tr key={`${g.clientId}-${g.tier}`}>
                      <td><strong>{g.name}</strong><div className="tiny muted">{[g.email, g.phone].filter(Boolean).join(" · ")}</div></td>
                      <td className="small">{g.tier}</td>
                      <td><span className={`tag ${STATUS[g.status][1]}`}>{STATUS[g.status][0]}</span></td>
                      <td style={{ textAlign: "right" }}>{g.paid ? money(g.paid) : "—"}</td>
                      <td className="small muted" style={{ whiteSpace: "nowrap" }}>{shortDate(g.date)}</td>
                      <td>
                        <Link className="btn btn-sm btn-ghost" href={g.status === "zelle" ? `/admin/clients/${g.clientId}/desk` : `/admin/clients/${g.clientId}`}>{g.status === "zelle" ? "Confirm" : "Open"}</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.guests.some((g) => g.status === "unpaid") && <p className="tiny muted" style={{ margin: 0 }}>&ldquo;Didn&rsquo;t finish paying&rdquo; means they picked an offer and went to checkout but the payment never came through. A quick follow-up email often helps.</p>}
        </section>
      ))}

      {hidden > 0 && !showAll && <Link className="small" href="/admin/events?show=all">Show {hidden} past {hidden === 1 ? "event" : "events"} with no sign-ups</Link>}
    </div>
  );
}
