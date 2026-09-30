import Link from "next/link";
import { listCourses } from "@/lib/courses";
import { allLessons, FORMAT_LABEL } from "@/lib/course-logic";
import { money } from "@/lib/format";

export const metadata = { title: "Courses", description: "Courses and workbooks from Build & Bloom Collective, self-paced or with 1:1 support." };

export default async function CoursesIndex() {
  const courses = (await listCourses()).filter((c) => c.status === "published" && c.showOnSite);
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Courses</p>
          <h1 style={{ marginTop: 16 }}><span className="ink">Learn at your pace,</span> build with support.</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">Guided courses and workbooks you can take on your own, or with 1:1 sessions alongside you.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          {courses.length ? (
            <div className="grid-2">
              {courses.map((c) => {
                const from = c.packages.filter((p) => p.active).sort((a, b) => a.price - b.price)[0];
                return (
                  <article className="card lib-card" key={c.id}>
                    <span className="tag gold" style={{ alignSelf: "flex-start" }}>{FORMAT_LABEL[c.format]}</span>
                    <h3 style={{ color: "var(--rust)", textTransform: "none", letterSpacing: 0, fontSize: "1.6rem" }}>{c.title}</h3>
                    {c.subtitle && <p className="italic" style={{ fontSize: "1.15rem" }}>{c.subtitle}</p>}
                    <p className="small muted">{c.modules.length} modules · {allLessons(c).length} lessons{c.pace ? ` · ${c.pace}` : ""}</p>
                    <div className="foot">
                      {from ? <span className="price-line">From {money(from.price)}{from.monthly ? "/mo" : ""}</span> : <span />}
                      <Link className="btn btn-dark btn-sm" href={`/courses/${c.slug}`}>Learn more</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="muted">New courses are coming soon. <Link href="/contact">Get in touch</Link> to hear first.</p>
          )}
        </div>
      </section>
    </>
  );
}
