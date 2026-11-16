import { bookProps, fmtTime, longDate } from "@/lib/booking";
import { money, shortDate } from "@/lib/format";
import { eventImage } from "@/lib/event-def";
import { certUrl, type Ticket } from "@/lib/ledger";
import type { Client, Settings } from "@/lib/types";
import type { Appointment } from "@/lib/course-types";
import SignOut from "@/components/SignOut";
import Ribbon from "@/components/Ribbon";

const STATUS: Record<Ticket["status"], [string, string]> = {
  paid: ["Paid", "green"],
  comp: ["Complimentary", "green"],
  zelle: ["Zelle on its way", "gold"],
  unpaid: ["Payment not finished", "rust"],
};

/** A simple page for people who came to a personal event: their ticket, receipt, books, and follow-up call.
 *  No Money, business tools, or billing. */
export default function GuestPass({ client, settings, tickets, appts, books, paidBanner }: {
  client: Client;
  settings: Settings;
  tickets: Ticket[];
  appts: Appointment[];
  books: { title: string; href: string; note?: string }[];
  paidBanner: boolean;
}) {
  const first = (client.contactName || client.name).split(" ")[0];
  const receipts = [...client.payments].sort((a, b) => b.date.localeCompare(a.date));
  const book = settings.booking.enabled ? { href: "/book?type=session" } : bookProps(settings);

  return (
    <>
      <Ribbon />
      <header className="topbar">
        <div className="wrap">
          <a href="#top" className="brandmark" style={{ textDecoration: "none", color: "inherit" }}>
            <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
            <span>{settings.brandName.toUpperCase()}</span>
          </a>
          <nav className="topnav" aria-label="Sections">
            <a href="#tickets">Your ticket</a>
            {books.length > 0 && <a href="#books">Your books</a>}
            <a href="#follow-up">Follow-up call</a>
            {receipts.length > 0 && <a href="#receipt">Receipt</a>}
          </nav>
          <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
            <a href="/" className="btn btn-sm btn-ghost">Website</a>
            <SignOut />
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <p className="eyebrow">Your guest pass</p>
            <h1 style={{ marginTop: 16 }}>Hi, {first}</h1>
            <span className="rule" aria-hidden="true" />
            <div className="boxed lede"><p>{client.welcome || "Your ticket and everything you need for the day are right here."}</p></div>
            {paidBanner && <p className="tag green" style={{ marginTop: 16 }}>Payment received. Thank you!</p>}
          </div>
        </section>

        <section className="section" id="tickets">
          <div className="wrap stack" style={{ gap: 24, maxWidth: 820 }}>
            {tickets.length === 0 && <p className="muted">Your ticket will show here as soon as your seat is confirmed.</p>}
            {tickets.map((t) => {
              const img = eventImage(t.e);
              return (
                <article key={`${t.e.slug}-${t.tier?.id}`} className="card stack" style={{ gap: 14, padding: 0, overflow: "hidden" }}>
                  {img && <img src={img} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />}
                  <div className="stack" style={{ gap: 14, padding: "0 28px 28px" }}>
                    <div className="row between" style={{ alignItems: "flex-start", gap: 12 }}>
                      <div className="stack" style={{ gap: 4 }}>
                        <p className="eyebrow" style={{ margin: 0 }}>{t.tier?.name || "Your seat"}</p>
                        <h2 style={{ margin: 0 }}>{t.e.name}</h2>
                        {t.e.details && <p style={{ margin: 0 }}>{t.e.details}</p>}
                      </div>
                      <span className={`tag ${STATUS[t.status][1]}`}>{STATUS[t.status][0]}</span>
                    </div>
                    {t.compCert && (
                      <div className="row between" style={{ gap: 10, background: "var(--cream)", borderRadius: 12, padding: "10px 14px" }}>
                        <span className="small">🎁 Your seat is a gift from {t.compCert.from}.</span>
                        <a className="btn btn-sm btn-ghost" href={certUrl(t.e.slug, t.compCert, t.compCert.from)} target="_blank" rel="noopener noreferrer">Your gift certificate</a>
                      </div>
                    )}
                    {t.gifts.map((g) => (
                      <div key={g.to} className="row between" style={{ gap: 10, background: "var(--cream)", borderRadius: 12, padding: "10px 14px" }}>
                        <span className="small">🎁 This seat is a gift for <strong>{g.to}</strong>.{g.email ? "" : " We'll send her the details through you."}</span>
                        <a className="btn btn-sm btn-ghost" href={certUrl(t.e.slug, g, client.name)} target="_blank" rel="noopener noreferrer">Gift certificate</a>
                      </div>
                    ))}
                    {t.status === "unpaid" && <p className="small" style={{ margin: 0 }}>Your seat isn&rsquo;t saved yet because the payment didn&rsquo;t go through. <a href={`/event/${t.e.slug}`}>Finish getting your seat</a>.</p>}
                    {t.status === "zelle" && <p className="small" style={{ margin: 0 }}>Your seat is held. We&rsquo;ll confirm here as soon as your Zelle payment arrives.</p>}
                    {t.tier && t.tier.includes.length > 0 && (
                      <div className="stack" style={{ gap: 6 }}>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>Your day includes</h3>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>{t.tier.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    )}
                    {t.tier && t.tier.next.length > 0 && (
                      <div className="stack" style={{ gap: 6 }}>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>Good to know</h3>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>{t.tier.next.map((x) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {books.length > 0 && (
          <section className="section alt" id="books">
            <div className="wrap stack" style={{ gap: 14, maxWidth: 820 }}>
              <h2 style={{ margin: 0 }}>Your books</h2>
              {books.map((b) => (
                <div key={b.href} className="card row between" style={{ gap: 12 }}>
                  <div className="stack" style={{ gap: 2 }}><strong>{b.title}</strong>{b.note && <span className="small muted">{b.note}</span>}</div>
                  <a className="btn btn-sm btn-ghost" href={b.href} target="_blank" rel="noopener noreferrer">Open</a>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section" id="follow-up">
          <div className="wrap stack" style={{ gap: 14, maxWidth: 820 }}>
            <h2 style={{ margin: 0 }}>Your free follow-up call</h2>
            {appts.map((x) => (
              <div key={x.id} className="card row between" style={{ gap: 12 }}>
                <span><strong>{longDate(x.date)}</strong>{x.start ? ` at ${fmtTime(x.start)} ET` : ""}</span>
                <span className="row" style={{ gap: 10 }}>
                  {x.link && <a className="btn btn-sm btn-dark" href={x.link} target="_blank" rel="noopener noreferrer">Join</a>}
                  {x.token && <a className="linkbtn small" href={`/book/confirmed?id=${x.id}&t=${x.token}`}>Details or reschedule</a>}
                </span>
              </div>
            ))}
            <div className="card row between" style={{ gap: 16 }}>
              <p style={{ margin: 0, maxWidth: 520 }}>After the event, pick a time for a 20-minute one-on-one call to talk about what came up for you and your next step.</p>
              <a className="btn btn-primary" {...book}>Pick a time</a>
            </div>
          </div>
        </section>

        {receipts.length > 0 && (
          <section className="section alt" id="receipt">
            <div className="wrap stack" style={{ gap: 12, maxWidth: 820 }}>
              <h2 style={{ margin: 0 }}>Receipt</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>For</th><th>Paid by</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
                  <tbody>
                    {receipts.map((p) => (
                      <tr key={p.id}><td>{shortDate(p.date)}</td><td>{p.description.replace(/ \((paid by|Zelle from) [^)]*\)$/, "")}</td><td>{p.method === "Stripe" ? "Card" : p.method}</td><td style={{ textAlign: "right" }}>{money(p.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <section className="section">
          <div className="wrap" style={{ maxWidth: 820 }}>
            <p className="small muted" style={{ margin: 0 }}>Questions about the day? {settings.email ? <>Email <a href={`mailto:${settings.email}`}>{settings.email}</a>.</> : "Reach out any time."} Curious about working together? <a href="/services">See our services</a>.</p>
          </div>
        </section>
      </main>
    </>
  );
}
