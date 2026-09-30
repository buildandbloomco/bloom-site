import Link from "next/link";
import { notFound } from "next/navigation";
import { learnerContext } from "@/lib/learn";
import { shortDate } from "@/lib/format";
import AnswerView from "@/components/course/AnswerView";
import RichText from "@/components/course/RichText";
import PrintButton from "@/components/course/PrintButton";

export default async function Workbook({ params, searchParams }: { params: Promise<{ eid: string }>; searchParams: Promise<{ blank?: string }> }) {
  const { eid } = await params;
  const { blank } = await searchParams;
  const { enrollment: e, course } = await learnerContext(eid);
  if (!course.printableWorkbook || e.status === "pending") notFound();
  const answers = blank ? {} : e.answers;

  return (
    <main className="workbook">
      <div className="wrap narrow no-print row between" style={{ padding: "24px 20px" }}>
        <Link href={`/learn/${eid}`} className="small">← Course home</Link>
        <div className="row">
          <Link className="btn btn-ghost btn-sm" href={blank ? `/learn/${eid}/workbook` : `/learn/${eid}/workbook?blank=1`}>{blank ? "Show my answers" : "Blank copy"}</Link>
          <PrintButton />
        </div>
      </div>

      <section className="wb-cover">
        <img src="/logo.png" alt="" style={{ width: 110, height: 120, objectFit: "contain" }} />
        <p className="eyebrow">Build &amp; Bloom Collective presents</p>
        <h1>{course.title}</h1>
        {course.subtitle && <p className="italic" style={{ fontSize: "1.4rem" }}>{course.subtitle}</p>}
        <span className="rule" style={{ margin: "18px auto" }} aria-hidden="true" />
        <p>Prepared for: <strong>{blank ? "______________________" : e.learnerName}</strong></p>
        <p>Date: {blank ? "______________________" : shortDate(new Date().toISOString())}</p>
        <p className="tiny" style={{ marginTop: 40, letterSpacing: "0.16em", color: "var(--rust)" }}>ROOTED IN JUSTICE · CENTERED IN BLACK CULTURE · COLLECTIVE CARE · INTENTIONAL GROWTH · COMMUNITY</p>
      </section>

      <div className="wrap narrow stack wb-body" style={{ gap: 28 }}>
        {course.welcome && (
          <section className="wb-section">
            <h2>Welcome</h2>
            <RichText text={course.welcome} />
          </section>
        )}
        {course.affirmations.length > 0 && (
          <section className="wb-section">
            <h2>Affirmations for the journey</h2>
            <ul>{course.affirmations.map((x, i) => <li key={i} className="italic" style={{ fontSize: "1.15rem" }}>{x}</li>)}</ul>
          </section>
        )}
        {course.modules.map((m, mi) => (
          <section key={m.id} className="wb-section wb-module">
            <p className="eyebrow">Part {mi + 1}</p>
            <h2>{m.title}</h2>
            {m.summary && <p className="italic">{m.summary}</p>}
            {m.lessons.map((l, li) => (
              <div key={l.id} className="stack" style={{ gap: 14, marginTop: 26 }}>
                <h3>{mi + 1}.{li + 1} {l.title}</h3>
                {l.intro && <RichText text={l.intro} />}
                {l.callout && <p className="wb-answer italic">{l.callout}</p>}
                {l.prompts.map((p) => <AnswerView key={p.id} p={p} value={answers[p.id]} />)}
              </div>
            ))}
          </section>
        ))}
        {course.closing && (
          <section className="wb-section">
            <h2>Closing</h2>
            <RichText text={course.closing} />
          </section>
        )}
        <p className="small muted center" style={{ paddingBottom: 40 }}>Build &amp; Bloom Collective · buildandbloomcollective.com</p>
      </div>
    </main>
  );
}
