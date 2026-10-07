import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/data";
import { listAgreements } from "@/lib/agreements";
import AgreementsAdmin from "@/components/admin/AgreementsAdmin";

export const dynamic = "force-dynamic";

export default async function AgreementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return (
    <div className="stack" style={{ gap: 22, maxWidth: 860 }}>
      <Link href={`/admin/clients/${id}/desk`} className="small">&larr; {client.name}</Link>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Agreements</p>
        <h2 style={{ margin: 0 }}>{client.name}</h2>
        <p className="muted" style={{ margin: 0 }}>They read it in their portal and sign by typing their name. You get the name, date, time, and a locked copy of the exact text.</p>
      </div>
      <div className="banner warn" style={{ margin: 0 }}>The contract template is a starting point, not legal advice. Have a lawyer in your state review it before you rely on it. You can edit the template and choose how contracts are sent under Settings.</div>
      <AgreementsAdmin clientId={id} slug={client.slug} initial={await listAgreements(id)} />
    </div>
  );
}
