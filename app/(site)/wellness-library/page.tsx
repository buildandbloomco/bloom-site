import WaitlistForm from "@/components/site/WaitlistForm";
import "@/components/site/wellness.css";

export const metadata = {
  title: "The Wellness Library",
  description: "Guided audio, journaling prompts, coping tools, and readings for the people doing the work. For you, or for your whole team. Join the waitlist.",
};

const INSIDE = [
  ["Guided audio", "Grounding practices and meditations, 3 to 15 minutes, for the start of the day, between meetings, or the drive home."],
  ["Journaling", "Prompt sets for reflection, rest, and hard weeks. Write right in the library, and your entries stay private to you."],
  ["Coping tools", "Quick, practical tools for stressful moments, and for before and after hard conversations."],
  ["Readings", "Short reads on rest, boundaries, sustainable work, and collective care, rooted in Black culture and community."],
];

export default async function WellnessLibrary({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const sp = await searchParams;
  const plan = sp.plan === "team" ? "team" : "individual";
  return (
    <>
      <section className="page-hero wl-hero">
        <div className="wrap">
          <p className="eyebrow">Coming soon &middot; The Wellness Library</p>
          <h1 style={{ marginTop: 16 }}>
            <span className="ink">Care you can</span> come back to.
          </h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">
            A growing library of guided audio, journaling prompts, coping tools, and readings for the people doing the work.
            For you, or for your whole team. New pieces every month.
          </p>
          <div className="row" style={{ marginTop: 24 }}>
            <a className="btn btn-primary" href="#join">Join the waitlist</a>
            <a className="btn btn-ghost" href="#plans">See the plans</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">What&rsquo;s inside</p>
            <h2>Small practices, real support</h2>
          </div>
          <div className="wl-inside">
            {INSIDE.map(([t, d], i) => (
              <article key={t} className="card stack" style={{ gap: 10 }}>
                <span className="wl-num" aria-hidden="true">0{i + 1}</span>
                <h3 style={{ margin: 0 }}>{t}</h3>
                <p className="small" style={{ margin: 0 }}>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="plans">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Two ways to join</p>
            <h2>For you, or for your team</h2>
          </div>
          <div className="wl-plans">
            <article className="card stack" style={{ gap: 14 }}>
              <span className="tag" style={{ alignSelf: "flex-start" }}>Individual</span>
              <h3 style={{ margin: 0 }}>Just for me</h3>
              <p className="small muted" style={{ margin: 0 }}>For entrepreneurs, helpers, and anyone carrying a lot.</p>
              <ul className="wl-list">
                <li>The full library, with new pieces every month</li>
                <li>Private journaling saved to your account</li>
                <li>Listen and read on your phone or computer</li>
                <li>Monthly or yearly membership</li>
              </ul>
              <a className="btn btn-ghost" href="?plan=individual#join" style={{ alignSelf: "flex-start" }}>Join as an individual</a>
            </article>
            <article className="dark-card stack" style={{ gap: 14 }}>
              <span className="tag gold" style={{ alignSelf: "flex-start" }}>Teams</span>
              <h3 style={{ margin: 0, color: "var(--gold)" }}>For my whole team</h3>
              <p className="small" style={{ margin: 0, color: "var(--on-dark-2)" }}>For practices, nonprofits, agencies, and community organizations.</p>
              <ul className="wl-list light">
                <li>Everything in Individual, for every staff member</li>
                <li>Team check-ins and tools for staff meetings</li>
                <li>Simple invites and seat management for your team lead</li>
                <li>Optional live group sessions with Build &amp; Bloom</li>
                <li>One monthly price based on team size</li>
              </ul>
              <a className="btn btn-gold" href="?plan=team#join" style={{ alignSelf: "flex-start" }}>Join as a team</a>
            </article>
          </div>
          <p className="wl-privacy">
            <strong>Your reflections stay yours.</strong> On team plans, leaders see seat counts and overall use, never what anyone writes.
          </p>
        </div>
      </section>

      <section className="section" id="join">
        <div className="wrap narrow stack" style={{ gap: 24 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Founding members</p>
            <h2>Join the waitlist</h2>
            <p className="muted">Founding members get first access and a founding rate. Tell us what would help most and we will build it in.</p>
          </div>
          <WaitlistForm initialPlan={plan} />
          <p className="tiny muted">The Wellness Library is made for everyday care and reflection, alongside the other support in your life.</p>
        </div>
      </section>
    </>
  );
}
