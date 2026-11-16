import { audiences, directory } from "@/lib/email-audience";
import { emailBrand, getDraft, listSent, unsubscribed } from "@/lib/email";
import { emailReady, fromAddress } from "@/lib/invite";
import { getSettings } from "@/lib/data";
import { listEvents } from "@/lib/events";
import { eventImage, eventOpen } from "@/lib/event-def";
import { listProducts } from "@/lib/shop";
import { bookHref } from "@/lib/booking";
import { shortDate } from "@/lib/format";
import EmailComposer, { type Draft } from "@/components/admin/EmailComposer";

export const dynamic = "force-dynamic";

export default async function EmailPage() {
  const [groups, people, brand, sent, draft, unsub, settings, events, products] = await Promise.all([
    audiences(), directory(), emailBrand(), listSent(), getDraft<Draft>(), unsubscribed(), getSettings(), listEvents(), listProducts(),
  ]);
  const live = <T extends { email: string }>(list: T[]) => list.filter((p) => !unsub.has(p.email.toLowerCase()));
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Email</h2>
        <p className="small muted" style={{ margin: 0 }}>Write an email in your Build &amp; Bloom template, add buttons to an event, a booking, or anything else, and send it to a group or a few people. Replies come to {settings.email || "your business email"}.</p>
      </div>
      {!emailReady() && <div className="banner warn">Email isn&rsquo;t set up yet. Add RESEND_API_KEY and EMAIL_FROM in Vercel, then redeploy.</div>}
      <EmailComposer
        brand={brand}
        from={fromAddress()}
        testTo={process.env.NOTIFY_EMAIL || settings.notifyEmail || settings.email || ""}
        initial={draft}
        groups={groups.map((g) => ({ id: g.id, label: g.label, hint: g.hint, people: live(g.people).map((p) => ({ name: p.name, email: p.email, first: p.first })), unsub: g.people.length - live(g.people).length }))}
        people={live(people).map((p) => ({ name: p.name, email: p.email, first: p.first, tag: p.tag }))}
        events={events.filter((e) => e.active !== false).map((e) => ({ slug: e.slug, name: e.name, details: e.details || "", image: eventImage(e), open: eventOpen(e), public: !!e.open }))}
        products={products.filter((p) => p.status === "live").map((p) => ({ slug: p.slug, title: p.title }))}
        bookUrl={bookHref(settings, "?type=session")}
      />
      <section className="stack" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>Sent</h3>
        {sent.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Nothing sent from here yet.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Subject</th><th>To</th><th style={{ textAlign: "right" }}>Sent</th></tr></thead>
              <tbody>{sent.map((x) => (
                <tr key={x.id}><td className="small" style={{ whiteSpace: "nowrap" }}>{shortDate(x.at)}</td><td>{x.subject}</td><td className="small">{x.audience}</td><td style={{ textAlign: "right" }}>{x.sent}{x.failed ? <span className="small" style={{ color: "var(--rust)" }}> · {x.failed} failed</span> : ""}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {unsub.size > 0 && <p className="tiny muted" style={{ margin: 0 }}>{unsub.size} {unsub.size === 1 ? "person has" : "people have"} unsubscribed. They&rsquo;re left off every send automatically.</p>}
      </section>
    </div>
  );
}
