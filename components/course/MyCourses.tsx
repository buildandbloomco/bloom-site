import Link from "next/link";
import type { Course, Enrollment } from "@/lib/course-types";
import { courseProgress, FORMAT_LABEL } from "@/lib/course-logic";

export default function MyCourses({ items }: { items: { e: Enrollment; c: Course }[] }) {
  return (
    <section className="section" id="courses">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Your courses</p>
          <h2>Keep learning</h2>
        </div>
        <div className="grid-2">
          {items.map(({ e, c }) => {
            const p = courseProgress(c, e);
            return (
              <article className="card lib-card" key={e.id}>
                <span className="tag gold" style={{ alignSelf: "flex-start" }}>{FORMAT_LABEL[c.format]}</span>
                <h3 style={{ color: "var(--rust)", textTransform: "none", letterSpacing: 0, fontSize: "1.4rem" }}>{c.title}</h3>
                <span className="small muted">{e.status === "pending" ? "Waiting on your first payment" : `${p.done} of ${p.total} lessons · ${p.percent}%`}</span>
                <div className="bar sm"><span style={{ width: `${p.percent}%` }} /></div>
                <div className="foot">
                  <span />
                  <Link className="btn btn-dark btn-sm" href={`/learn/${e.id}`}>{e.status === "pending" ? "Finish enrolling" : p.done ? "Continue" : "Start"}</Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
