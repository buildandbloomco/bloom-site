import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getClient } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import ClientEditor, { type WorkspaceSummary } from "@/components/admin/ClientEditor";
import PortalKind from "@/components/admin/PortalKind";
import { ticketsFor } from "@/lib/ledger";
import { GUIDES } from "@/lib/guides";
import { getAssessment, getPlan, listResponses } from "@/lib/workspace";
import { progress } from "@/lib/plan-types";

export const dynamic = "force-dynamic";

export default async function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, catalog] = await Promise.all([getClient(id), getCatalog()]);
  if (!client) notFound();
  const [plan, a, responses] = await Promise.all([getPlan(id), getAssessment(id), listResponses(id)]);
  const next = plan.sessions.filter((s) => s.status !== "done" && s.date).sort((x, y) => x.date.localeCompare(y.date))[0];
  const workspace: WorkspaceSummary = {
    plan: {
      enabled: plan.enabled, pct: progress(plan.tasks).pct, total: plan.tasks.length,
      openRequests: plan.requests.filter((r) => r.status === "open").length,
      newComments: plan.tasks.filter((t) => t.comments.length && t.comments[t.comments.length - 1].by === "client").length,
      nextSession: next ? `${next.title}, ${next.date}${next.start ? " " + next.start : ""}` : "",
    },
    assessment: a ? { enabled: a.enabled, status: a.status, responses: responses.length } : null,
  };
  const code = client.codeEnc ? decryptCode(client.codeEnc) : "";
  // Event guests get an invite about their ticket, not a proposal
  const guestInvite = client.kind === "guest" ? {
    events: (await ticketsFor(client)).filter((t) => t.status !== "unpaid").map((t) => ({ name: t.e.name, details: t.e.details || "", gift: t.status === "comp" ? t.compCert?.from || "" : "" })),
    books: GUIDES.filter((g) => (client.guideSlugs ?? []).includes(g.slug)).map((g) => g.title),
  } : null;
  return (
    <div className="stack" style={{ gap: 24 }}>
      <Link href="/admin" className="small">← All clients</Link>
      <PortalKind clientId={client.id} guest={client.kind === "guest"} />
      <ClientEditor guestInvite={guestInvite} initial={client} catalog={catalog} initialCode={code} workspace={workspace} />
    </div>
  );
}
