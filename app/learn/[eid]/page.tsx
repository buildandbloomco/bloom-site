import { bookHref } from "@/lib/booking";
import Link from "next/link";
import { learnerContext } from "@/lib/learn";
import { listAppointments, saveEnrollment } from "@/lib/courses";
import { getCatalog, getSettings } from "@/lib/data";
import { balance, courseProgress, FORMAT_LABEL, nextPayment, paidSoFar } from "@/lib/course-logic";
import { decryptCode } from "@/lib/crypto";
import { money, shortDate } from "@/lib/format";
import { recordCheckoutSession, stripe } from "@/lib/stripe";
import { getEnrollment } from "@/lib/courses";
import LearnActions from "@/components/course/LearnActions";

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).filter((p) => p.trim());
}

export default async function CourseHome({ params, searchParams }: { params: Promise<{ eid: string }>; searchParams: Promise<{ welcome?: string; paid?: string }> }) {
  const { eid } = await params;
  const sp = await searchParams;
  let { client, enrollment: e, course } = await learnerContext(eid);

  // Back from Stripe: record the payment right away (the webhook also does this)
  if (sp.paid?.startsWith("cs_")) {
    const s = stripe();
    if (s) {
      try {
        const session = await s.checkout.sessions.retrieve(sp.paid);
        if (session.metadata?.enrollmentId === e.id) {
          await recordCheckoutSession(session);
          e = (await getEnrollment(e.id)) ?? e;
        }
      } catch {
        /* webhook will record it */
      }
    }
  }

  let code = "";
  if (e.showCode) {
    code = client.codeEnc ? decryptCode(client.codeEnc) : "";
    e.showCode = false;
    await saveEnrollment(e);
  }

  const [settings, catalog, appts] = await Promise.all([getSettings(), getCatalog(), listAppointments()]);
  const prog = courseProgress(course, e);
  const pkg = course.packages.find((p) => p.id === e.packageId);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [
    ...course.liveSessions.map((s) => ({ key: `l${s.id}`, title: s.title, date: s.date, start: s.start, where: s.link || s.location, isLink: !!s.link })),
    ...appts.filter((a) => a.enrollmentId === e.id).map((a) => ({ key: `a${a.id}`, title: a.title, date: a.date, start: a.start, where: a.link || a.location, isLink: !!a.link })),
  ]
    .filter((x) => x.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const products = catalog.library.filter((l) => l.active && course.libraryIds.includes(l.id));
  const np = nextPayment(e);
  const affirmation = course.affirmations.length ? course.affirmations[new Date().getDate() % course.affirmations.length] : "";
  const started = Object.keys(e.completed).length > 0;
  const sessionsLeft = Math.max(0, e.sessionsIncluded - e.sessionsUsed);
  const fmtTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  if (e.status === "pending") {
    return (
      <main className="section">
        <div className="wrap narrow stack" style={{ gap: 20 }}>
          <h1 style={{ fontSize: "2.4rem" }}>{course.title}</h1>
          <div className="boxed stack" style={{ gap: 12 }}>
            <p>Your spot is reserved. Your course opens as soon as your first payment is complete.</p>
            {np && <LearnActions eid={e.id} mode="pay" amount={np.amount} />}
            <p className="small muted">Questions? Email <a href={`mailto:${settings.email}`}>{settings.email}</a>.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: 48 }}>
        <div className="wrap stack" style={{ gap: 18 }}>
          {code && (
            <div className="banner ok" role="status">
              <strong>Welcome to {course.title}!</strong> Your access code is <span className="codebox" style={{ fontSize: "1rem", padding: "2px 8px" }}>{code}</span>. Save it: you will use it to sign in at {settings.website ? settings.website.replace(/^https?:\/\//, "") : "our site"}/portal.
            </div>
          )}
          {sp.paid && <div className="banner ok" role="status">Payment received. Thank you!</div>}
          <p className="eyebrow">{FORMAT_LABEL[course.format]} · {pkg?.name}</p>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>{course.title}</h1>
          {course.subtitle && <p className="lede" style={{ marginTop: 0 }}>{course.subtitle}</p>}
          <div className="progress-card boxed" style={{ marginBottom: 0 }}>
            <div className="row between" style={{ alignItems: "baseline" }}>
              <div className="stack" style={{ gap: 2 }}>
                <span className="eyebrow">Your progress</span>
                <span className="small muted">{prog.done} of {prog.total} lessons complete{course.pace ? ` · Suggested pace: ${course.pace}` : ""}</span>
              </div>
              <span className="big-number" style={{ color: "var(--rust)" }}>{prog.percent}%</span>
            </div>
            <div className="bar" role="progressbar" aria-valuenow={prog.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress"><span style={{ width: `${prog.percent}%` }} /></div>
            <div className="row">
              {prog.next ? (
                <Link className="btn btn-primary" href={`/learn/${e.id}/lesson/${prog.next.id}`}>{started ? "Continue" : "Start"}: {prog.next.title}</Link>
              ) : (
                <span className="tag green">Course complete</span>
              )}
              {course.printableWorkbook && <Link className="btn btn-ghost" href={`/learn/${e.id}/workbook`}>Printable workbook</Link>}
              {course.certificate && !prog.next && prog.total > 0 && <Link className="btn btn-gold" href={`/learn/${e.id}/certificate`}>Your certificate</Link>}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="wrap work-grid">
          <div className="stack" style={{ gap: 22 }}>
            {!started && course.welcome && (
              <details className="consult" open>
                <summary><span className="choice-title">A welcome letter</span></summary>
                <div className="stack" style={{ gap: 12, marginTop: 14 }}>
                  {paragraphs(course.welcome).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </details>
            )}
            {!prog.next && course.closing && (
              <div className="boxed stack" style={{ gap: 10 }}>{paragraphs(course.closing).map((p, i) => <p key={i}>{p}</p>)}</div>
            )}
            {course.modules.map((m, mi) => {
              const mp = prog.modules[mi];
              return (
                <details className="consult" key={m.id} open={mp.done < mp.total && (mi === 0 || prog.modules[mi - 1].done > 0 || mp.done > 0)}>
                  <summary>
                    <span className="stack" style={{ gap: 4, flex: 1 }}>
                      <span className="eyebrow">Module {mi + 1}{mp.done === mp.total && mp.total ? " · Complete" : ""}</span>
                      <span className="choice-title" style={{ fontSize: "1.1rem" }}>{m.title}</span>
                    </span>
                    <span className="small muted" style={{ whiteSpace: "nowrap" }}>{mp.done}/{mp.total}</span>
                  </summary>
                  <div className="stack" style={{ gap: 10, marginTop: 14 }}>
                    {m.summary && <p className="small muted">{m.summary}</p>}
                    <div className="bar sm"><span style={{ width: `${mp.percent}%` }} /></div>
                    <ol className="lesson-list">
                      {m.lessons.map((l) => (
                        <li key={l.id} className={e.completed[l.id] ? "done" : ""}>
                          <span className="dot" aria-hidden="true">{e.completed[l.id] ? "✓" : ""}</span>
                          <Link href={`/learn/${e.id}/lesson/${l.id}`}>{l.title}</Link>
                          <span className="tiny muted">{l.minutes ? `${l.minutes} min` : ""}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              );
            })}
          </div>

          <aside className="stack" style={{ gap: 20 }}>
            {affirmation && (
              <div className="dark-card stack" style={{ gap: 8 }}>
                <span className="eyebrow gold">Today&rsquo;s affirmation</span>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.25rem" }}>{affirmation}</p>
              </div>
            )}
            {(e.sessionsIncluded > 0 || pkg?.sessions) && (
              <div className="panel">
                <h3>Your 1:1 sessions</h3>
                <p className="small">{sessionsLeft} of {e.sessionsIncluded} remaining{pkg?.sessionMinutes ? ` · ${pkg.sessionMinutes} minutes each` : ""}</p>
                {sessionsLeft > 0 && <LearnActions eid={e.id} mode="request" bookingUrl={bookHref(settings, `?e=${e.id}`)} />}
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="panel">
                <h3>Coming up</h3>
                {upcoming.slice(0, 6).map((u) => (
                  <div key={u.key} className="stack" style={{ gap: 2, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                    <strong className="small">{u.title}</strong>
                    <span className="tiny muted">{shortDate(u.date)}{u.start ? ` · ${fmtTime(u.start)} ET` : ""}</span>
                    {u.where && (u.isLink ? <a className="small" href={u.where} target="_blank" rel="noopener noreferrer">Join link</a> : <span className="small">{u.where}</span>)}
                  </div>
                ))}
                <a className="btn btn-sm btn-ghost" href={`/api/learn/${e.id}/calendar`}>Add to my calendar</a>
              </div>
            )}
            {(products.length > 0 || course.resources.length > 0) && (
              <div className="panel">
                <h3>Resources</h3>
                {course.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="small">{r.title}{r.note ? ` · ${r.note}` : ""}</a>
                ))}
                {products.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="small">{l.title}</a>
                ))}
              </div>
            )}
            {!e.comped && (e.total > 0 || e.monthly) && (
              <div className="panel">
                <h3>Payments</h3>
                <div className="row between small"><span>Paid</span><strong>{money(paidSoFar(e))}</strong></div>
                {e.monthly ? (
                  <p className="small muted">{money(e.total)} per month, billed automatically.</p>
                ) : (
                  <div className="row between small"><span>Balance</span><strong>{money(balance(e))}</strong></div>
                )}
                {np && (
                  <>
                    <p className="small">Next payment: {money(np.amount)}, due {shortDate(np.due)}</p>
                    <LearnActions eid={e.id} mode="pay" amount={np.amount} />
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
