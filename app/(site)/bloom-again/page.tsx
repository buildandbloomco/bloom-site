import FollowAlongForm from "@/components/site/FollowAlongForm";
import { PRACTICES } from "@/lib/bloom-again-def";
import "@/components/site/wellness.css";
import "@/components/site/bloom-again.css";

export const metadata = {
  title: "Bloom Again: Journal Companion",
  description: "The free companion to Bloom Again, the guided journal by Jadon Thomas: a 30-day email follow-along, the practices step by step, and printable pages.",
};

const PARTS = ["Rest", "Reconnect", "Release", "Root"] as const;
const PRINTABLES = [
  ["Daily check-in", "Keep going after Day 30, or print extras for hard weeks.", "/bloom-again/Bloom-Again-Daily-Check-In.pdf"],
  ["Weekly reflection", "Look back with kindness. Look ahead with intention.", "/bloom-again/Bloom-Again-Weekly-Reflection.pdf"],
  ["Mood tracker", "One circle a day, one page a month.", "/bloom-again/Bloom-Again-Mood-Tracker.pdf"],
  ["The Bloom Check", "Take it again any time you want to see where you are.", "/bloom-again/Bloom-Again-Bloom-Check.pdf"],
];

export default function BloomAgain() {
  return (
    <>
      <section className="page-hero wl-hero">
        <div className="wrap ba-hero">
          <div>
            <p className="eyebrow">The Bloom Again companion</p>
            <h1 style={{ marginTop: 16 }}>
              <span className="ink">You don&rsquo;t have to</span> do this alone.
            </h1>
            <span className="rule" aria-hidden="true" />
            <p className="lede">
              Everything that goes with your journal, free: a 30-day follow-along in your inbox, every practice step by step, and printable pages for when you want more room to write.
            </p>
            <div className="row" style={{ marginTop: 24 }}>
              <a className="btn btn-primary" href="#follow">Start the 30 days</a>
              <a className="btn btn-ghost" href="#practices">The practices</a>
            </div>
          </div>
          <img className="ba-cover" src="/bloom-again/cover.jpg" alt="Bloom Again, a guided journal by Jadon Thomas" width={600} height={900} />
        </div>
      </section>

      <section className="section" id="follow">
        <div className="wrap narrow stack" style={{ gap: 24 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Free 30-day follow-along</p>
            <h2>A short note from me, every morning</h2>
            <p className="muted">
              Each email tells you which page to open, walks you into one practice or prompt, and keeps you company through all four seasons: Rest, Reconnect, Release, and Root. Miss a day? Pick up where you are. There&rsquo;s no falling behind.
            </p>
          </div>
          <FollowAlongForm />
        </div>
      </section>

      <section className="section alt" id="practices">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The eight practices</p>
            <h2>Step by step, whenever you need them</h2>
            <p className="muted">Guided audio in my voice is on the way. Until then, read the steps slowly and take your time.</p>
          </div>
          {PARTS.map((part) => (
            <div key={part} className="ba-part">
              <h3 className="ba-part-name">{part}</h3>
              <div className="ba-grid">
                {PRACTICES.filter((p) => p.part === part).map((p) => (
                  <article key={p.id} id={p.id} className="card stack ba-practice" style={{ gap: 10 }}>
                    <h4 style={{ margin: 0 }}>{p.name}</h4>
                    <p className="small muted" style={{ margin: 0 }}>{p.blurb}</p>
                    <ol className="wl-list">
                      {p.steps.map((s) => <li key={s}>{s}</li>)}
                    </ol>
                    {p.audio ? (
                      <audio controls preload="none" src={p.audio} style={{ width: "100%" }} />
                    ) : (
                      <p className="tiny muted" style={{ margin: 0 }}>Guided audio coming soon</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="printables">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Printables</p>
            <h2>More room to write</h2>
            <p className="muted">Print as many as you like on regular letter paper.</p>
          </div>
          <div className="wl-inside">
            {PRINTABLES.map(([t, d, href]) => (
              <a key={t} href={href} download className="card stack ba-dl" style={{ gap: 8 }}>
                <h3 style={{ margin: 0 }}>{t}</h3>
                <p className="small muted" style={{ margin: 0 }}>{d}</p>
                <span className="ba-link">Download PDF</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Keep blooming</p>
            <h2>When you&rsquo;re ready for more</h2>
          </div>
          <div className="wl-plans">
            <article className="card stack" style={{ gap: 12 }}>
              <h3 style={{ margin: 0 }}>Rest and reset, in person</h3>
              <p className="small" style={{ margin: 0 }}>Retreats and workshops at Peace on the Pond, a 10-acre estate, for women who need a day to slow down and come back to themselves.</p>
              <a className="btn btn-ghost" href="/workshops" style={{ alignSelf: "flex-start" }}>See what&rsquo;s coming up</a>
            </article>
            <article className="dark-card stack" style={{ gap: 12 }}>
              <h3 style={{ margin: 0, color: "var(--gold)" }}>The Wellness Library</h3>
              <p className="small" style={{ margin: 0, color: "var(--on-dark-2)" }}>Guided audio, journaling prompts, coping tools, and readings you can come back to, for you or your whole team.</p>
              <a className="btn btn-gold" href="/wellness-library" style={{ alignSelf: "flex-start" }}>Join the waitlist</a>
            </article>
          </div>
          <p className="wl-privacy">
            <strong>Bringing this to your team?</strong> I help organizations address burnout and build care into the way they work. <a href="/contact">Let&rsquo;s talk.</a>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <p className="small muted" style={{ textAlign: "center", margin: 0 }}>
            Bloom Again is a tool for reflection and self-care, not a substitute for therapy or medical care. If you&rsquo;re in crisis, call or text 988 in the United States, any time.
          </p>
        </div>
      </section>
    </>
  );
}
