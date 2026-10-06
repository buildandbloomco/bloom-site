import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getClient } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { blankProposal, getProposal } from "@/lib/proposals";
import { pricedFor } from "@/lib/tier";
import ProposalEditor from "@/components/admin/ProposalEditor";

export const dynamic = "force-dynamic";

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [catalog, saved] = await Promise.all([getCatalog(), getProposal(id)]);
  const services = pricedFor(catalog.services, client.tier).filter((s) => s.active || client.package.serviceIds.includes(s.id)).map((s) => ({ id: s.id, name: s.name, price: s.price, unit: s.unit, kind: s.kind }));
  return (
    <div className="stack" style={{ gap: 22, maxWidth: 900 }}>
      <Link href={`/admin/clients/${id}/desk`} className="small">&larr; {client.name}</Link>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Proposal</p>
        <h2 style={{ margin: 0 }}>{client.name}</h2>
        <p className="muted" style={{ margin: 0 }}>
          Offer one package for a simple yes, or up to four side by side. When they accept, the option they chose becomes their package and investment, and they are walked on to sign and pay.
          {client.tier ? ` Suggested prices shown are for ${client.tier === "org" ? "an organization" : "a small business"}.` : " Set small business or organization on the client page to get the right suggested prices."}
        </p>
      </div>
      {!saved && <div className="banner ok" style={{ margin: 0 }}>Option 1 was filled in from what is already on this client&rsquo;s page. Nothing is saved or sent until you click a button below.</div>}
      {client.billing === "none" && <div className="banner warn" style={{ margin: 0 }}>This client is set to &ldquo;no payment needed&rdquo;, so their portal will not show prices or a pay step. Change that on the client page first if this proposal is for paid work.</div>}
      <ProposalEditor clientId={id} slug={client.slug} initial={saved ?? blankProposal(client)} services={services} today={nowET().date} />
    </div>
  );
}
