import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug } from "@/lib/courses";
import { allLessons, FORMAT_LABEL } from "@/lib/course-logic";
import { shortDate } from "@/lib/format";
import EnrollForm from "@/components/course/EnrollForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCourseBySlug(slug);
  return c ? { title: c.title, description: c.subtitle || c.description.slice(0, 160) } : {};
}

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ canceled?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getCourseBySlug(slug);
  if (!c || c.status !== "published") notFound();
  const lessons = allLessons(c).length;
  const pkgs = c.packages.filter((p) => p.active);
  const today = new Date().toISOString().slice(0, 10);
  const sessions = c.liveSessions.filter((s) => s.date >= today);

  return (
    <>
      <section className="page-hero">
        <div className="wrap split">
          <div>
            <p className="eyebrow">{FORMAT_LABEL[c.format]} course</p>
            <h1 style={{ marginTop: 16 }}>{c.title}</h1>
            <span className="rule" aria-hidden="true" />
            {c.subtitle && <p className="lede italic">{c.subtitle}</p>}
            <div className="row" style={{ marginTop: 26 }}>
              <a className="btn btn-primary" href="#enroll">Enroll</a>
              <a className="btn btn-ghost" href="#inside">See what&rsquo;s inside</a>
            </div>
          </div>
          <div className="boxed stack" style={{ gap: 10 }}>
            <p className="eyebrow">At a glance</p>
            <ul className="lines">
              <li><span>Format</span><strong>{FORMAT_LABEL[c.format]}</strong></li>
              <li><span>Curriculum</span><strong>{c.modules.length} modules · {lessons} lessons</strong></li>
              {c.pace && <li><span>Pace</span><strong style={{ textAlign: "right" }}>{c.pace}</strong></li>}
              <li><span>Includes</span><strong style={{ textAlign: "right" }}>Online workbook{c.printableWorkbook ? " + printable copy" : ""}</strong></li>
              {pkgs.some((p) => p.sessions > 0) && <li><span>Support</span><strong>1:1 sessions available</strong></li>}
            </ul>
          </div>
        </div>
      </section>

      {c.description && (
        <section className="section">
          <div className="wrap narrow" style={{ fontSize: "1.15rem" }}>
            {c.description.split(/\n\s*\n/).map((p, i) => <p key={i} style={{ marginBottom: 14 }}>{p}</p>)}
          </div>
        </section>
      )}

      <section className="section alt" id="inside">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The curriculum</p>
            <h2>What&rsquo;s inside</h2>
          </div>
          <div className="grid-2">
            {c.modules.map((m, i) => (
              <article className="card" key={m.id}>
                <span className="eyebrow">Module {i + 1}</span>
                <h3 style={{ marginTop: 6 }}>{m.title}</h3>
                {m.summary && <p className="small muted">{m.summary}</p>}
                <ul className="small" style={{ margin: "10px 0 0", paddingLeft: 18 }}>{m.lessons.map((l) => <li key={l.id}>{l.title}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="section">
          <div className="wrap narrow">
            <div className="section-head"><p className="eyebrow">Live sessions</p><h2>Class dates</h2></div>
            <ul className="lines">{sessions.map((s) => <li key={s.id}><span>{s.title}</span><strong>{shortDate(s.date)}{s.start ? ` · ${s.start}` : ""}</strong></li>)}</ul>
          </div>
        </section>
      )}

      {c.affirmations.length > 0 && (
        <section className="band">
          <div className="wrap stack" style={{ gap: 14 }}>
            <p className="eyebrow gold">A few affirmations from the course</p>
            <blockquote>{c.affirmations.slice(0, 3).join(" ")}</blockquote>
          </div>
        </section>
      )}

      <section className="section" id="enroll">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Enroll</p>
            <h2>Choose how you want to take it</h2>
            <p className="muted">Pay in full, or split eligible packages into payments. Card, Apple Pay, Klarna, Afterpay, and Affirm are accepted where eligible.</p>
          </div>
          {sp.canceled && <div className="banner warn">Checkout was canceled. Nothing was charged.</div>}
          <EnrollForm
            courseId={c.id}
            packages={pkgs}
            plans={c.plans}
            addOns={c.addOns}
          />
          <p className="small muted" style={{ marginTop: 20 }}>Questions before you enroll? <Link href="/contact">Send us a note</Link>.</p>
        </div>
      </section>
    </>
  );
}

