import Link from "next/link";
import { listCourses, listEnrollments } from "@/lib/courses";
import { FORMAT_LABEL, allLessons, paidSoFar } from "@/lib/course-logic";
import { money } from "@/lib/format";
import NewCourse from "@/components/admin/NewCourse";

export const dynamic = "force-dynamic";

const STATUS_TAG: Record<string, string> = { draft: "", published: "green", archived: "" };

export default async function CoursesPage() {
  const [courses, enrollments] = await Promise.all([listCourses(), listEnrollments()]);
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Admin</p>
          <h2>Courses</h2>
          <p className="muted small">Build courses with a curriculum, online workbook, packages, and 1:1 sessions.</p>
        </div>
        <NewCourse />
      </div>
      <div className="grid-2">
        {courses.map((c) => {
          const es = enrollments.filter((e) => e.courseId === c.id);
          const active = es.filter((e) => e.status === "active").length;
          const revenue = es.reduce((s, e) => s + paidSoFar(e), 0);
          return (
            <article className="panel" key={c.id}>
              <div className="row between">
                <span className={`tag ${STATUS_TAG[c.status]}`}>{c.status}</span>
                <span className="small muted">{FORMAT_LABEL[c.format]}</span>
              </div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--rust)", textTransform: "none", letterSpacing: 0 }}>{c.title}</h3>
              {c.subtitle && <p className="small muted">{c.subtitle}</p>}
              <div className="row small" style={{ gap: 18 }}>
                <span><strong>{c.modules.length}</strong> modules</span>
                <span><strong>{allLessons(c).length}</strong> lessons</span>
                <span><strong>{active}</strong> active learners</span>
                <span><strong>{money(revenue)}</strong> collected</span>
              </div>
              <div className="row">
                <Link className="btn btn-sm btn-dark" href={`/admin/courses/${c.id}`}>Edit course</Link>
                <Link className="btn btn-sm btn-ghost" href={`/admin/courses/${c.id}?tab=learners`}>Learners</Link>
                {c.status === "published" && <a className="btn btn-sm btn-ghost" href={`/courses/${c.slug}`} target="_blank" rel="noopener noreferrer">View page ↗</a>}
              </div>
            </article>
          );
        })}
      </div>
      {!courses.length && <p className="muted">No courses yet.</p>}
    </div>
  );
}
