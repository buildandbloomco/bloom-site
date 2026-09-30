import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getEnrollment, listAppointments } from "@/lib/courses";
import { balance, courseProgress, nextPayment, paidSoFar } from "@/lib/course-logic";
import { money, shortDate } from "@/lib/format";
import AnswerView from "@/components/course/AnswerView";
import EnrollmentAdmin from "@/components/admin/EnrollmentAdmin";

export const dynamic = "force-dynamic";

export default async function LearnerPage({ params }: { params: Promise<{ id: string; eid: string }> }) {
  const { id, eid } = await params;
  const [course, e, appts] = await Promise.all([getCourse(id), getEnrollment(eid), listAppointments()]);
  if (!course || !e || e.courseId !== course.id) notFound();
  const prog = courseProgress(course, e);
  const pkg = course.packages.find((p) => p.id === e.packageId);
  const mine = appts.filter((a) => a.enrollmentId === e.id);
  const np = nextPayment(e);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href={`/admin/courses/${course.id}?tab=learners`} className="small">← {course.title} learners</Link>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">{course.title} · {pkg?.name}</p>
          <h2>{e.learnerName}</h2>
          <p className="small muted">{e.email} · enrolled {shortDate(e.createdAt)}</p>
        </div>
        <a className="btn btn-sm btn-ghost" href={`/api/admin/enrollments/${e.id}/preview`} target="_blank" rel="noopener noreferrer">View as learner ↗</a>
      </div>

      <div className="stat-tiles">
        <div className="panel"><span className="muted small">Progress</span><span className="v">{prog.percent}%</span><span className="tiny muted">{prog.done} of {prog.total} lessons</span></div>
        <div className="panel"><span className="muted small">1:1 sessions used</span><span className="v">{e.sessionsUsed} / {e.sessionsIncluded}</span></div>
        <div className="panel"><span className="muted small">Paid</span><span className="v">{money(paidSoFar(e))}</span><span className="tiny muted">{e.comped ? "Complimentary" : e.monthly ? `${money(e.total)} / month` : `of ${money(e.total)}`}</span></div>
        <div className="panel"><span className="muted small">Balance</span><span className="v">{money(balance(e))}</span>{np && <span className="tiny muted">Next {money(np.amount)} due {shortDate(np.due)}</span>}</div>
      </div>

      <div className="editor-grid">
        <div className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <h3>Progress by module</h3>
            {course.modules.map((m, mi) => {
              const mp = prog.modules[mi];
              return (
                <div key={m.id} className="stack" style={{ gap: 6, borderTop: mi ? "1px solid var(--line)" : undefined, paddingTop: mi ? 12 : 0 }}>
                  <div className="row between"><strong>{m.title}</strong><span className="small muted">{mp.done}/{mp.total}</span></div>
                  <div className="bar sm"><span style={{ width: `${mp.percent}%` }} /></div>
                  <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                    {m.lessons.map((l) => (
                      <li key={l.id} style={{ color: e.completed[l.id] ? "var(--ink)" : "var(--muted)" }}>
                        {e.completed[l.id] ? "✓ " : ""}{l.title}{e.completed[l.id] ? ` · ${shortDate(e.completed[l.id])}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <section className="panel">
            <h3>Workbook answers</h3>
            {course.modules.flatMap((m) => m.lessons).filter((l) => l.prompts.some((p) => e.answers[p.id] !== undefined && e.answers[p.id] !== "")).length === 0 && (
              <p className="small muted">No answers yet.</p>
            )}
            {course.modules.map((m) =>
              m.lessons
                .filter((l) => l.prompts.some((p) => e.answers[p.id] !== undefined && e.answers[p.id] !== ""))
                .map((l) => (
                  <details key={l.id} className="lesson-edit">
                    <summary>{l.title}</summary>
                    <div className="stack" style={{ gap: 14, marginTop: 12 }}>
                      {l.prompts.map((p) => <AnswerView key={p.id} p={p} value={e.answers[p.id]} blankLines={1} />)}
                    </div>
                  </details>
                ))
            )}
          </section>
        </div>
        <div className="sticky-col">
          <EnrollmentAdmin
            e={e}
            appts={mine.map((a) => ({ id: a.id, title: a.title, date: a.date, start: a.start }))}
          />
        </div>
      </div>
    </div>
  );
}
