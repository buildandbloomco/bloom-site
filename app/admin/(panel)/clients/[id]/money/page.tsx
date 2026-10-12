import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/data";
import { nowET } from "@/lib/booking";
import MoneyBoard from "@/components/finance/MoneyBoard";

export const dynamic = "force-dynamic";

export default async function AdminMoney({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href={`/admin/clients/${id}/desk`} className="small no-print">&larr; {client.name}</Link>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Money</p>
        <h2 style={{ margin: 0 }}>{client.name}</h2>
      </div>
      <MoneyBoard as="us" clientId={id} today={nowET().date} clientName={client.name} />
    </div>
  );
}
