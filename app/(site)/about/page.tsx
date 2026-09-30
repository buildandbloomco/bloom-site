import { bookProps } from "@/lib/booking";
import Link from "next/link";
import { getSettings } from "@/lib/data";
import FounderArch from "@/components/site/FounderArch";

export const metadata = {
  title: "About",
  description: "Build & Bloom Collective is an organizational wellness and strategy firm founded by Jadon Thomas, rooted in the Psychology of Care.",
};

const VALUES: [string, string][] = [
  ["Rooted in justice", "We design with equity at the center, not as an afterthought."],
  ["Centered in Black culture", "Our work honors the communities, histories, and ways of knowing our clients come from."],
  ["Collective care", "Wellness is a shared responsibility, and the structure should carry its share."],
  ["Intentional growth", "Sustainable beats fast. We build for the long haul."],
];

const PROCESS: [string, string][] = [
  ["Consult", "A free conversation about what you are carrying and what you want to build."],
  ["Assess", "We look closely at your workload, workflows, and structure to find the real friction points."],
  ["Plan", "You get a clear, prioritized plan with scope, timeline, and investment."],
  ["Build", "We design and install the systems, trainings, and practices together with your team."],
  ["Sustain", "Check-ins and resources in your client portal so the changes hold."],
];

export default async function About() {
  const s = await getSettings();
  return (
    <>
      <section className="page-hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">About the collective</p>
            <h1 style={{ marginTop: 16 }}>
              <span className="ink">Centered in justice,</span> rooted in care.
            </h1>
            <span className="rule" aria-hidden="true" />
            <p className="lede">
              Build &amp; Bloom Collective is an organizational wellness and strategy firm born at the intersection of
              psychology, social justice, and community-based practice. We help the people who hold everyone else build
              workplaces that hold them too.
            </p>
          </div>
          <FounderArch />
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow stack" style={{ gap: 20, fontSize: "1.12rem" }}>
          <p className="eyebrow">The founder</p>
          <h2 style={{ textTransform: "none", letterSpacing: 0 }}>Jadon Thomas</h2>
          <p className="small muted" style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Organizational Wellness Strategist</p>
          <p>
            Jadon Thomas is a psychology professor and mental health advocate with a master&rsquo;s degree in forensic
            psychology and more than a decade of experience in mental health and academic spaces. Jadon&rsquo;s work sits where
            business design meets behavioral infrastructure: how the way work is organized affects the people doing it.
          </p>
          <p>
            Through Build &amp; Bloom Collective, Jadon partners with mental health practices and helping organizations to
            reduce burnout at the source, and with Black entrepreneurs, community organizations, and event hosts to build
            sustainable, culturally grounded work and gatherings. The signature lens is the Psychology of Care: treating
            infrastructure (schedules, workflows, supervision, documentation) as an act of care for the people inside it.
          </p>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">What we stand on</p>
            <h2>Our values</h2>
          </div>
          <div className="grid-2">
            {VALUES.map(([t, d]) => (
              <div className="card" key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <p className="eyebrow">How we work</p>
            <h2>From first call to lasting change</h2>
          </div>
          <ol className="steps">
            {PROCESS.map(([t, d]) => (
              <li key={t}>
                <span><strong>{t}.</strong> {d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap stack" style={{ gap: 18 }}>
          <h2>Start with a conversation</h2>
          <p>No pitch, no pressure. Just a clear look at what would help.</p>
          <div className="row">
            <a className="btn btn-gold" {...bookProps(s)}>Book a free consult</a>
            <Link className="btn btn-ghost-light" href="/services">See services</Link>
          </div>
        </div>
      </section>
    </>
  );
}
