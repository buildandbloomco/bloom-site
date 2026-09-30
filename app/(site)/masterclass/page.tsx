import { bookProps } from "@/lib/booking";
import Link from "next/link";
import { getCatalog, getSettings } from "@/lib/data";
import { priceLabel } from "@/lib/format";

export const metadata = {
  title: "The Sustained Healer Masterclass",
  description:
    "A 3-part organizational wellness program for mental health practices and helping teams: the systemic roots of burnout, shared transition practices, and identity-conscious operations.",
};

const MODULES = [
  {
    title: "The Anatomy of Burnout",
    sub: "Systemic risk in helping workplaces",
    focus:
      "We map the specific pressures built into your practice: workload intensity, intake volume, documentation load, and the moments where the structure leaves people to absorb the weight alone.",
    outcome: "A shared understanding of burnout as an operational bottleneck your practice can solve together, not a personal failure.",
    who: "Whole team",
  },
  {
    title: "De-Rolling",
    sub: "Shared transition and decompression practices",
    focus:
      "Practical routines for stepping out of the helper role between sessions and at the end of the day, using environment, schedule, and simple team rituals. Built to fit real calendars.",
    outcome: "A shared decompression toolkit your whole staff uses the same way, so no one is managing it alone.",
    who: "Whole team",
  },
  {
    title: "Identity-Conscious Infrastructure",
    sub: "Building the sustainable practice",
    focus:
      "Working session with leadership and senior staff on the structures themselves: peer consultation and supervision design, boundary-conscious scheduling, and realistic productivity expectations.",
    outcome: "A prioritized plan to shift your operations so they protect your practice's most important asset: the people doing the work.",
    who: "Leadership & senior staff",
  },
];

const FAQ: [string, string][] = [
  [
    "Who is it for?",
    "Group practices, community mental health agencies, university counseling centers, social service teams, and nonprofits in the helping professions.",
  ],
  [
    "How is it delivered?",
    "Three sessions for your team, on site or virtually, scheduled around your team. Modules 1 and 2 are for the whole team; Module 3 is a working session for leadership.",
  ],
  [
    "How is it priced?",
    "Pricing is based on team size and format. It can be booked on its own or as part of an ongoing organizational retainer. Book a consult or send an inquiry and we will send a proposal.",
  ],
];

export default async function Masterclass() {
  const [catalog, s] = await Promise.all([getCatalog(), getSettings()]);
  const svc = catalog.services.find((x) => x.id === "masterclass");

  return (
    <>
      <section className="page-hero">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Signature program for helping organizations</p>
            <h1 style={{ marginTop: 16 }}>
              <span className="ink">The Sustained</span> Healer Masterclass
            </h1>
            <span className="rule" aria-hidden="true" />
            <p className="lede">
              Your team spends every day holding space for heavy work. This 3-part program helps your practice build the
              structure that holds them back.
            </p>
            <div className="row" style={{ marginTop: 28 }}>
              <Link className="btn btn-primary" href="/contact?lane=orgs&interest=masterclass">Request the framework</Link>
              <a className="btn btn-ghost" {...bookProps(s)}>Book a consult</a>
            </div>
          </div>
          <div className="boxed stack" style={{ gap: 12 }}>
            <p className="eyebrow">At a glance</p>
            <ul className="lines">
              <li><span>Format</span><strong>3 sessions</strong></li>
              <li><span>For</span><strong>Mental health &amp; helping teams</strong></li>
              <li><span>Delivery</span><strong>On site or virtual</strong></li>
              <li><span>Investment</span><strong>{svc && svc.price !== null ? priceLabel(svc.price, "") : "Based on team size"}</strong></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap stack" style={{ gap: 20 }}>
          <blockquote>
            Knowing the theory of mental health <em>doesn&rsquo;t mean your schedule, your intake flow, or your team are protected</em> from compassion fatigue.
          </blockquote>
          <p>Individual self-care can&rsquo;t outrun a structure that depends on people running on empty. The Masterclass works on both: the practices your team shares and the systems your practice runs on.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The curriculum</p>
            <h2>Three modules</h2>
          </div>
          <div className="stack" style={{ gap: 22 }}>
            {MODULES.map((m, i) => (
              <article className="card module" key={m.title}>
                <span className="num">0{i + 1}</span>
                <div className="stack" style={{ gap: 10 }}>
                  <div className="row between">
                    <div className="stack" style={{ gap: 2 }}>
                      <h3 style={{ marginBottom: 0 }}>{m.title}</h3>
                      <span className="italic" style={{ fontSize: "1.15rem" }}>{m.sub}</span>
                    </div>
                    <span className="tag">{m.who}</span>
                  </div>
                  <p>{m.focus}</p>
                  <p><strong>Your team leaves with:</strong> {m.outcome}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap narrow">
          <div className="section-head">
            <p className="eyebrow">Questions</p>
            <h2>Good to know</h2>
          </div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap stack" style={{ gap: 18 }}>
          <h2>Bring it to your team</h2>
          <p>Tell us a little about your practice and we will send the full framework and a proposal sized to your team.</p>
          <div className="row">
            <Link className="btn btn-gold" href="/contact?lane=orgs&interest=masterclass">Request the framework</Link>
            <a className="btn btn-ghost-light" {...bookProps(s)}>Book a consult</a>
          </div>
        </div>
      </section>
    </>
  );
}
