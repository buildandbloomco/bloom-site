import Link from "next/link";
import { notFound } from "next/navigation";
import { learnerContext } from "@/lib/learn";
import { allLessons, courseProgress } from "@/lib/course-logic";
import { embedUrl } from "@/lib/embed";
import RichText from "@/components/course/RichText";
import LessonWorkbook from "@/components/course/LessonWorkbook";

export default async function LessonPage({ params }: { params: Promise<{ eid: string; lid: string }> }) {
  const { eid, lid } = await params;
  const { enrollment: e, course } = await learnerContext(eid);
  if (e.status === "pending") notFound();
  const list = allLessons(course);
  const idx = list.findIndex((x) => x.lesson.id === lid);
  if (idx < 0) notFound();
  const { lesson: l, moduleIndex, moduleTitle } = list[idx];
  const prev = list[idx - 1]?.lesson;
  const next = list[idx + 1]?.lesson;
  const prog = courseProgress(course, e);
  const video = l.videoUrl ? embedUrl(l.videoUrl) : null;
  const inModule = course.modules[moduleIndex].lessons.findIndex((x) => x.id === l.id) + 1;
  const answers: Record<string, unknown> = {};
  for (const p of l.prompts) if (e.answers[p.id] !== undefined) answers[p.id] = e.answers[p.id];

  return (
    <main className="section" style={{ paddingTop: 36 }}>
      <div className="wrap narrow stack" style={{ gap: 22 }}>
        <div className="stack" style={{ gap: 8 }}>
          <div className="row between">
            <Link href={`/learn/${eid}`} className="small">← Course home</Link>
            <span className="small muted">{prog.percent}% complete</span>
          </div>
          <div className="bar sm" aria-hidden="true"><span style={{ width: `${prog.percent}%` }} /></div>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <p className="eyebrow">Module {moduleIndex + 1}: {moduleTitle} · Lesson {inModule} of {course.modules[moduleIndex].lessons.length}</p>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>{l.title}</h1>
          {l.minutes > 0 && <p className="small muted">About {l.minutes} minutes</p>}
          <span className="rule" aria-hidden="true" />
        </div>
        {video && (
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "var(--espresso)" }}>
            <iframe src={video} title={l.title} allow="autoplay; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          </div>
        )}
        {l.videoUrl && !video && <a className="btn btn-dark" href={l.videoUrl} target="_blank" rel="noopener noreferrer">Watch the lesson video</a>}
        {l.intro && <div style={{ fontSize: "1.12rem" }}><RichText text={l.intro} /></div>}
        {l.callout && (
          <blockquote className="dark-card" style={{ margin: 0 }}>
            <p style={{ fontStyle: "italic", fontSize: "1.25rem" }}>{l.callout}</p>
          </blockquote>
        )}
        {l.resourceUrl && (
          <a className="btn btn-ghost" style={{ alignSelf: "flex-start" }} href={l.resourceUrl} target="_blank" rel="noopener noreferrer">{l.resourceLabel || "Download"}</a>
        )}
        <LessonWorkbook
          eid={eid}
          lessonId={l.id}
          prompts={l.prompts}
          initial={answers}
          done={!!e.completed[l.id]}
          nextHref={next ? `/learn/${eid}/lesson/${next.id}` : `/learn/${eid}`}
          nextLabel={next ? `Next: ${next.title}` : "Back to course home"}
        />
        <div className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          {prev ? <Link href={`/learn/${eid}/lesson/${prev.id}`} className="small">← {prev.title}</Link> : <span />}
          {next ? <Link href={`/learn/${eid}/lesson/${next.id}`} className="small">{next.title} →</Link> : <span />}
        </div>
      </div>
    </main>
  );
}
