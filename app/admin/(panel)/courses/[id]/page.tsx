import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, listEnrollments } from "@/lib/courses";
import { getCatalog, listClients } from "@/lib/data";
import { balance, courseProgress, paidSoFar } from "@/lib/course-logic";
import CourseEditor from "@/components/admin/CourseEditor";

export const dynamic = "force-dynamic";

export default async function EditCourse({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  const [course, enrollments, catalog, clients] = await Promise.all([getCourse(id), listEnrollments({ courseId: id }), getCatalog(), listClients()]);
  if (!course) notFound();
  const learners = enrollments.map((e) => {
    const p = courseProgress(course, e);
    return {
      id: e.id,
      name: e.learnerName,
      email: e.email,
      packageName: course.packages.find((x) => x.id === e.packageId)?.name ?? e.packageId,
      status: e.status,
      percent: p.percent,
      done: p.done,
      total: p.total,
      sessions: `${e.sessionsUsed} / ${e.sessionsIncluded}`,
      paid: paidSoFar(e),
      balance: balance(e),
      newRequests: e.requests.filter((r) => r.status === "new").length,
    };
  });
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href="/admin/courses" className="small">← All courses</Link>
      <CourseEditor
        initial={course}
        library={catalog.library.map((l) => ({ id: l.id, title: l.title, kind: l.kind }))}
        learners={learners}
        clients={clients.filter((c) => c.status !== "archived").map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        initialTab={tab ?? "overview"}
      />
    </div>
  );
}
