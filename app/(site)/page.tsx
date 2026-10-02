import "@/components/site/wellness.css";
import { bookProps } from "@/lib/booking";
import Link from "next/link";
import { getCatalog, getSettings } from "@/lib/data";
import FounderArch from "@/components/site/FounderArch";
import { shortDate } from "@/lib/format";

export default async function Home() {
  const [s, catalog] = await Promise.all([getSettings(), getCatalog()]);
  const upcoming = catalog.library.filter((l) => l.active && l.showOnSite).slice(0, 3);

  return (
    <>
      <section className="site-hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">Organizational wellness &amp; strategy</p>
            <h1 style={{ marginTop: 16 }}>
              <span className="ink">Infrastructure</span> is care.
            </h1>
            <span className="rule" aria-hidden="true" />
            <p className="lede">
              Build &amp; Bloom Collective redesigns the systems, schedules, and structures that quietly burn people out, so
              mental health practices, helping organizations, Black entrepreneurs, and community organizations can do their best work and last.
            </p>
            <div className="row cta" style={{ marginTop: 32 }}>
              <a className="btn btn-primary" {...bookProps(s)}>Book a free consult</a>
              <Link className="btn btn-ghost" href="/masterclass">Explore the Masterclass</Link>
            </div>
          </div>
          <FounderArch pill="Psychology of Care" logoOnly />
        </div>
      </section>

      <section className="band">
        <div className="wrap stack" style={{ gap: 24 }}>
          <p className="eyebrow gold">Why we exist</p>
          <blockquote>
            Too many helping organizations teach wellness to the people they serve <em>while their own structure wears their staff down.</em>
          </blockquote>
          <p>
            Pizza parties and meditation apps can&rsquo;t fix a workload, a schedule, or a supervision model. Burnout is rarely a
            personal failure. It is usually an operational problem, and operational problems can be redesigned.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Who we work with</p>
            <h2>Two ways we partner</h2>
          </div>
          <div className="grid-2">
            <article className="card lane">
              <span className="tag gold" style={{ alignSelf: "flex-start" }}>Organizations</span>
              <h3>Mental health practices &amp; helping organizations</h3>
              <p className="muted">Group practices, community agencies, nonprofits, and universities whose people carry heavy work.</p>
              <ul>
                <li>The Sustained Healer Masterclass for your team</li>
                <li>Organizational wellness assessment</li>
                <li>Scheduling, workflow &amp; supervision redesign</li>
                <li>Leadership and team workshops</li>
              </ul>
              <div className="foot"><Link className="btn btn-dark btn-sm" href="/services#orgs">Organizational services</Link></div>
            </article>
            <article className="card lane">
              <span className="tag rust" style={{ alignSelf: "flex-start" }}>Community</span>
              <h3>Black entrepreneurs, community organizations &amp; events</h3>
              <p className="muted">Founders, collectives, and community-rooted organizations building sustainable, culturally grounded work.</p>
              <ul>
                <li>Strategy &amp; capacity consulting</li>
                <li>Operations, admin systems &amp; documentation</li>
                <li>Offer and pricing design</li>
                <li>Community events, retreats &amp; experience design</li>
              </ul>
              <div className="foot"><Link className="btn btn-dark btn-sm" href="/services#business">Community services</Link></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Our approach</p>
            <h2>Build. Bloom. Equity.</h2>
          </div>
          <div className="grid-3">
            <div className="pillar">
              <span className="num">01</span>
              <h3>Build</h3>
              <p><strong>Systemic sustainability.</strong> We find the friction points in intake, admin load, and scheduling, and redesign them so the structure carries the weight instead of your people.</p>
            </div>
            <div className="pillar">
              <span className="num">02</span>
              <h3>Bloom</h3>
              <p><strong>Team practices that hold.</strong> Transition routines, protected decompression time, and peer consultation that people actually use, built into the workday.</p>
            </div>
            <div className="pillar">
              <span className="num">03</span>
              <h3>Equity</h3>
              <p><strong>Identity-conscious infrastructure.</strong> Workplaces designed around the cultural realities of the people inside them, because how work is built shapes who gets to thrive.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <div className="stack" style={{ gap: 18 }}>
            <p className="eyebrow">Signature program</p>
            <h2 style={{ textTransform: "none", letterSpacing: 0 }}>The Sustained Healer Masterclass</h2>
            <span className="rule" aria-hidden="true" />
            <p style={{ fontSize: "1.15rem" }}>
              A 3-part program for mental health and helping teams that moves burnout from a personal problem to a shared,
              solvable one.
            </p>
            <ol className="steps" style={{ marginTop: 8 }}>
              <li>The Anatomy of Burnout: systemic risk in helping workplaces</li>
              <li>De-Rolling: shared transition and decompression practices</li>
              <li>Identity-Conscious Infrastructure: building the sustainable practice</li>
            </ol>
            <div className="row" style={{ marginTop: 8 }}>
              <Link className="btn btn-primary" href="/masterclass">See the full program</Link>
              <Link className="btn btn-ghost" href="/contact?lane=orgs&interest=masterclass">Request the framework</Link>
            </div>
          </div>
          <div className="boxed stack" style={{ gap: 14 }}>
            <p className="eyebrow">Built for</p>
            <p>Group practices &middot; Community mental health agencies &middot; University counseling centers &middot; Nonprofits in the helping professions &middot; Social service teams</p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap hero-grid">
          <FounderArch />
          <div className="stack" style={{ gap: 18 }}>
            <p className="eyebrow">Meet the founder</p>
            <h2 style={{ textTransform: "none", letterSpacing: 0 }}>
              <span className="ink">Hi, I&rsquo;m</span> Jadon Thomas.
            </h2>
            <span className="rule" aria-hidden="true" />
            <p style={{ fontSize: "1.15rem" }}>
              I&rsquo;m an Organizational Wellness Strategist, psychology professor, and mental health advocate with a
              master&rsquo;s in forensic psychology and more than a decade in mental health and academic spaces. I started
              Build &amp; Bloom Collective because how work is built directly shapes how people feel and thrive inside it.
            </p>
            <div><Link className="btn btn-ghost" href="/about">My story</Link></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap wl-band">
          <div className="stack" style={{ gap: 16 }}>
            <p className="eyebrow">Coming soon</p>
            <h2 style={{ textTransform: "none", letterSpacing: 0 }}><span className="ink">The</span> Wellness Library</h2>
            <span className="rule" aria-hidden="true" />
            <p style={{ fontSize: "1.15rem" }}>
              Guided audio, journaling prompts, coping tools, and readings for the people doing the work. For you, or for your whole team.
            </p>
            <div className="row">
              <Link className="btn btn-primary" href="/wellness-library#join">Join the waitlist</Link>
              <Link className="btn btn-ghost" href="/wellness-library">Learn more</Link>
            </div>
          </div>
          <div className="dark-card stack" style={{ gap: 10 }}>
            <span className="eyebrow gold">Inside the library</span>
            <ul className="wl-list light" style={{ fontSize: "1.05rem" }}>
              <li>Guided audio and meditations</li>
              <li>Private journaling prompts</li>
              <li>Coping tools for hard moments</li>
              <li>Readings on rest and collective care</li>
              <li>Team check-ins for staff meetings</li>
            </ul>
          </div>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Workshops, events &amp; resources</p>
              <h2>Gather and learn with us</h2>
            </div>
            <div className="grid-3">
              {upcoming.map((l) => (
                <article className="card lib-card" key={l.id}>
                  <span className={`tag ${l.kind === "workshop" ? "rust" : ""}`} style={{ alignSelf: "flex-start" }}>
                    {l.kind === "workshop" ? "Workshop" : l.kind === "product" ? "Digital product" : "Resource"}
                  </span>
                  <h3 style={{ fontSize: "1.1rem" }}>{l.title}</h3>
                  {l.date && <p className="small muted">{shortDate(l.date)}</p>}
                  <p className="small">{l.description}</p>
                  <div className="foot">
                    <span className="small"><strong>{l.priceLabel}</strong></span>
                    {l.url && <a className="btn btn-dark btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">View</a>}
                  </div>
                </article>
              ))}
            </div>
            <div style={{ marginTop: 28 }}><Link className="btn btn-ghost" href="/workshops">All workshops &amp; events</Link></div>
          </div>
        </section>
      )}

      <section className="cta-band">
        <div className="wrap stack" style={{ gap: 18 }}>
          <h2>Let&rsquo;s build something that lasts</h2>
          <p>Start with a free consult. We&rsquo;ll talk through what you&rsquo;re carrying, what you&rsquo;re building, and whether we&rsquo;re the right fit.</p>
          <div className="row">
            <a className="btn btn-gold" {...bookProps(s)}>Book a free consult</a>
            <Link className="btn btn-ghost-light" href="/contact">Send an inquiry</Link>
          </div>
        </div>
      </section>
    </>
  );
}
