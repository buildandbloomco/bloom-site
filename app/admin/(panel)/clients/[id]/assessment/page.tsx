import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/data";
import { siteOrigin } from "@/lib/http";
import { buildResults, getAssessment, getPlan, listResponses } from "@/lib/workspace";
import AssessmentAdmin from "@/components/admin/AssessmentAdmin";

export const dynamic = "force-dynamic";

export default async function AdminAssessment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [a, responses, plan, origin] = await Promise.all([getAssessment(id), listResponses(id), getPlan(id), siteOrigin()]);
  const results = a ? buildResults(a, responses, true) : null;
  const taskStatus = Object.fromEntries(plan.tasks.map((t) => [t.id, t.status]));
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
        <Link href={`/admin/clients/${id}`} className="small">&larr; {client.name}</Link>
        <Link href={`/admin/clients/${id}/plan`} className="small">Strategy plan &rarr;</Link>
      </div>
      <AssessmentAdmin clientId={id} clientName={client.name} slug={client.slug} initial={a} responses={responses} results={results}
        link={a ? `${origin}/assess/${a.token}` : ""} sessions={plan.sessions.map((s) => ({ id: s.id, title: s.title }))} taskStatus={taskStatus} />
    </div>
  );
}
