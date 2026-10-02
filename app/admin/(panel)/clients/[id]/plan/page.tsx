import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getClient } from "@/lib/data";
import { listCourses } from "@/lib/courses";
import { listPieces } from "@/lib/library";
import { getAssessment, getPlan } from "@/lib/workspace";
import PlanEditor from "@/components/admin/PlanEditor";

export const dynamic = "force-dynamic";

export default async function AdminPlan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [plan, catalog, courses, pieces, assessment] = await Promise.all([getPlan(id), getCatalog(), listCourses(), listPieces(), getAssessment(id)]);
  const opts = {
    service: catalog.services.filter((s) => s.active).map((s) => ({ id: s.id, label: s.name })),
    course: courses.filter((c) => c.status !== "archived").map((c) => ({ id: c.id, label: c.title + (c.status === "draft" ? " (draft)" : "") })),
    library: catalog.library.map((l) => ({ id: l.id, label: l.title })),
    wellness: pieces.filter((p) => p.status === "published").map((p) => ({ id: p.id, label: p.title })),
  };
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
        <Link href={`/admin/clients/${id}`} className="small">&larr; {client.name}</Link>
        <Link href={`/admin/clients/${id}/assessment`} className="small">Wellness assessment &rarr;</Link>
      </div>
      <PlanEditor clientId={id} clientName={client.name} slug={client.slug} initial={plan} opts={opts} assessmentOn={!!assessment?.enabled} />
    </div>
  );
}
