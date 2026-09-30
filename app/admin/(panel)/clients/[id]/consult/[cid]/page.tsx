import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog, getClient } from "@/lib/data";
import ConsultSheet from "@/components/admin/ConsultSheet";

export const dynamic = "force-dynamic";

export default async function ConsultPage({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = await params;
  const [client, catalog] = await Promise.all([getClient(id), getCatalog()]);
  const sheet = client?.consults.find((x) => x.id === cid);
  if (!client || !sheet) notFound();
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href={`/admin/clients/${client.id}`} className="small">← Back to {client.name}</Link>
      <ConsultSheet clientId={client.id} clientName={client.name} initial={sheet} services={catalog.services.filter((s) => s.active)} />
    </div>
  );
}
