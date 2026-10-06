import { notFound } from "next/navigation";
import { getClient } from "@/lib/data";
import { getPlan } from "@/lib/workspace";
import StrategyRoom from "@/components/room/StrategyRoom";

export const dynamic = "force-dynamic";

export default async function AdminRoom({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const plan = await getPlan(id);
  const s = plan.sessions.find((x) => x.id === sid);
  if (!s) notFound();
  return (
    <StrategyRoom sid={sid} clientId={id} role="us" names={{ us: "Jadon", client: client.contactName || client.name }}
      title={`${client.name}: ${s.title}`} date={s.date} closed={s.status === "done"} backHref={`/admin/clients/${id}/desk`} />
  );
}
