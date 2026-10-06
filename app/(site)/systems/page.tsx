import Link from "next/link";
import { getCatalog } from "@/lib/data";
import { money } from "@/lib/format";

export const metadata = {
  title: "Custom Client Portals & Systems",
  description: "A private, branded home base for your business. Clients view proposals, sign, pay, and track their work, and you see everything that needs your attention on one screen.",
};

const BUILDS = [
  { id: "systems-landing", tag: "Start here", fit: "You need a clear, professional front door.", gets: ["One branded page on your own domain", "Inquiry form that lands in your inbox", "Booking link for consults", "Written and designed with you"] },
  { id: "systems-portal", tag: "Most requested", fit: "You send proposals and chase payments by hand.", gets: ["Your own admin dashboard", "Proposals clients open with a private link or code", "See who opened it, and how many times", "Accept, sign, and pay in one sitting", "Balances and follow-ups surfaced for you"] },
  { id: "systems-hub", tag: "The full system", fit: "Your business runs out of your head and your inbox.", gets: ["Everything in the Proposal and Payment Portal", "A private portal for every client", "Shared plans, tasks, files, and session notes", "Calendar, reminders, and meeting invites", "Courses, a shop, or staff tools if you need them", "Built around the way your team works"] },
];
const STEPS = [
  ["We map how you work", "A working session, plus a guided questionnaire in your own portal for your brand, colors, links, and what you want on your site and admin side."],
  ["We design it with you", "You see the layout and the flow before anything is built. Two rounds of changes are included."],
  ["We build and test it", "On your own accounts, in your brand. You follow each stage in your portal, see the work in progress, and can request add-ons as you go."],
  ["We hand you the keys", "A walkthrough, a plain-language guide, and support while you settle in. You own it."],
];
const FAQ = [
  ["Do I own it?", "Yes. It is built on accounts in your name: your domain, your hosting, your Claude account, your payment processor. If we ever part ways, it stays with you, and you or anyone you hire can keep improving it."],
  ["What does it cost to run?", "Plan on about $40 a month, paid directly to the providers and not to us: Vercel Pro for hosting ($20) and Claude Pro ($20), the AI assistant your system is built and updated with. Your domain is about $12 to $20 a year. Card payments carry the processor's standard fee. These are in your name, so they are separate from your build price."],
  ["How long does it take?", "A landing page takes about two weeks. A portal takes four to six. A full operations hub takes eight to twelve, depending on what it needs to do."],
  ["What if I need changes later?", "The Systems Care Plan covers updates, small changes, fixes, and backups each month. Larger additions are quoted separately."],
  ["Is this the same as HoneyBook or Dubsado?", "No. Those are tools you rent and bend your business around. This is designed around how you already work, carries your brand, and belongs to you."],
];

export default async function Systems() {
  const catalog = await getCatalog();
  const svc = (id: string) => catalog.services.find((s) => s.id === id && s.active);
  const care = svc("addon-care-plan");
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Custom client portals &amp; systems</p>
          <h1 style={{ marginTop: 16 }}><span className="ink">One home base</span> for your whole business.</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">A private, branded system where your clients view proposals, sign, pay, and track their work, and you see everything that needs your attention on one screen.</p>
          <div className="row" style={{ gap: 12, marginTop: 26 }}>
            <Link className="btn btn-primary" href="/contact?interest=systems-portal">Book a free consult</Link>
            <a className="btn btn-ghost" href="#look">See what it looks like</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="grid-2" style={{ gap: 18 }}>
            {[["Stop chasing proposals", "See who opened yours, how many times, and who needs a nudge."], ["Get paid faster", "Clients accept, sign, and pay in one sitting, without a string of emails."], ["Look as established as you are", "Clients sign in to your portal, in your brand, not a shared folder."], ["Get it out of your head", "Follow-ups, balances, and bookings come to you. Nothing depends on your memory."]].map(([t, d]) => (
              <div className="card" key={t}><h3 style={{ textTransform: "none", letterSpacing: 0, fontSize: "1.25rem", color: "var(--rust)" }}>{t}</h3><p className="muted" style={{ margin: "6px 0 0" }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="look">
        <div className="wrap stack" style={{ gap: 40 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">What it looks like</p>
            <h2>Built for you, and for the people you serve</h2>
            <p className="muted">Sample screens with a made-up business. Yours carries your name, colors, and the steps your clients take.</p>
          </div>
          {[["/systems/dashboard.jpg", "Your side: one screen for the day", "Open proposals, who has viewed them, what is due, and who needs a follow-up. No digging through email to find out where things stand."], ["/systems/proposal.jpg", "Their side: a proposal they can say yes to", "Options side by side, clear pricing, and one button to accept. They can share it with a board or a partner without a single attachment."], ["/systems/portal.jpg", "After yes: a portal that walks them forward", "Sign the agreement, pay the retainer, see the next session, share files. Every client knows exactly what happens next."]].map(([src, t, d], i) => (
            <div className="sys-shot" key={src} style={i % 2 ? { direction: "rtl" } : undefined}>
              <img src={src} alt={`Sample screen. ${t}`} loading="lazy" style={{ direction: "ltr" }} />
              <div className="stack" style={{ gap: 8, direction: "ltr" }}><h3 style={{ textTransform: "none", letterSpacing: 0, fontSize: "1.45rem", color: "var(--rust)" }}>{t}</h3><p style={{ margin: 0 }}>{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head"><p className="eyebrow">How it works</p><h2>From messy to mapped to built</h2></div>
          <ol className="steps">{STEPS.map(([t, d]) => <li key={t}><div><strong>{t}.</strong> {d}</div></li>)}</ol>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head"><p className="eyebrow">Three ways to build</p><h2>Start where you are</h2></div>
          <div className="grid-3">
            {BUILDS.map((b) => {
              const s = svc(b.id);
              if (!s) return null;
              return (
                <article className="card" key={b.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <span className={`tag ${b.id === "systems-portal" ? "gold" : ""}`} style={{ alignSelf: "flex-start" }}>{b.tag}</span>
                  <h3 style={{ fontSize: "1.2rem" }}>{s.name}</h3>
                  <p className="muted" style={{ margin: 0 }}><em>{b.fit}</em></p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>{b.gets.map((g) => <li key={g} style={{ margin: "4px 0" }}>{g}</li>)}</ul>
                  <p className="small" style={{ margin: "auto 0 0", fontWeight: 600 }}>{s.showPrice && s.price !== null ? `Starting at ${money(s.price)}` : "Priced at your consult, based on what you need"}</p>
                </article>
              );
            })}
          </div>
          <p className="muted" style={{ marginTop: 22 }}><strong>Running costs.</strong> Every build runs on accounts in your own name. Plan on about $40 a month, paid directly to the providers: Vercel Pro for hosting ($20) and Claude Pro ($20), plus your domain at about $12 to $20 a year.</p>
          {care && <p className="muted" style={{ marginTop: 8 }}><strong>{care.name}.</strong> {care.description}{care.showPrice && care.price !== null ? ` ${money(care.price)} ${care.unit}.` : ""}</p>}
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head"><p className="eyebrow">Questions</p><h2>Good to know</h2></div>
          <div className="stack" style={{ gap: 10 }}>
            {FAQ.map(([q, a]) => <details className="card" key={q} style={{ padding: "16px 22px" }}><summary style={{ fontWeight: 600, cursor: "pointer" }}>{q}</summary><p style={{ margin: "10px 0 0" }}>{a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap stack" style={{ gap: 18 }}>
          <h2>Ready to run your business from one screen?</h2>
          <p>Start with a free consult. We will walk through how you work now and what a system built for you could take off your plate.</p>
          <div><Link className="btn btn-gold" href="/contact?interest=systems-portal">Book a free consult</Link></div>
        </div>
      </section>
    </>
  );
}
