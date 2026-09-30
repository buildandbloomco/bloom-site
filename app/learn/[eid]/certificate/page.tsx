import Link from "next/link";
import { notFound } from "next/navigation";
import { learnerContext } from "@/lib/learn";
import { courseProgress } from "@/lib/course-logic";
import { shortDate } from "@/lib/format";
import PrintButton from "@/components/course/PrintButton";

export default async function Certificate({ params }: { params: Promise<{ eid: string }> }) {
  const { eid } = await params;
  const { enrollment: e, course } = await learnerContext(eid);
  const p = courseProgress(course, e);
  if (!course.certificate || p.next || !p.total) notFound();
  return (
    <main className="section">
      <div className="wrap no-print row between" style={{ marginBottom: 24 }}>
        <Link href={`/learn/${eid}`} className="small">← Course home</Link>
        <PrintButton label="Print certificate" />
      </div>
      <div className="certificate">
        <img src="/logo.png" alt="" style={{ width: 96, height: 104, objectFit: "contain", margin: "0 auto" }} />
        <p className="eyebrow">Certificate of completion</p>
        <p className="italic" style={{ fontSize: "1.3rem" }}>This certifies that</p>
        <h1>{e.learnerName}</h1>
        <p className="italic" style={{ fontSize: "1.3rem" }}>has completed</p>
        <h2 style={{ textTransform: "none", letterSpacing: 0 }}>{course.title}</h2>
        <span className="rule" style={{ margin: "10px auto" }} aria-hidden="true" />
        <div className="row between" style={{ marginTop: 30, width: "100%" }}>
          <div className="stack" style={{ gap: 2 }}>
            <strong>Jadon Thomas</strong>
            <span className="small">Founder, Build &amp; Bloom Collective</span>
          </div>
          <div className="stack" style={{ gap: 2, textAlign: "right" }}>
            <strong>{shortDate(e.completedAt || new Date().toISOString())}</strong>
            <span className="small">Date</span>
          </div>
        </div>
      </div>
    </main>
  );
}
