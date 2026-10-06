import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient, getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { getReview, reviewData } from "@/lib/reviews";
import ReviewReport from "@/components/ReviewReport";
import ReviewEditor from "@/components/admin/ReviewEditor";

export const dynamic = "force-dynamic";
const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const client = await getClient(id);
  if (!client) notFound();
  const [saved, settings] = await Promise.all([getReview(id), getSettings()]);
  const today = nowET().date;
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 90);
  const from = isDate(sp.from) ? sp.from! : saved?.from ?? d.toISOString().slice(0, 10);
  const to = isDate(sp.to) ? sp.to! : saved?.to ?? today;
  const data = await reviewData(id, from, to);
  return (
    <div className="stack" style={{ gap: 22, maxWidth: 860 }}>
      <Link href={`/admin/clients/${id}/desk`} className="small no-print">&larr; {client.name}</Link>
      <ReviewEditor key={`${from}${to}`} clientId={id} from={from} to={to} summary={saved?.summary ?? ""} next={saved?.next ?? ""} shared={!!saved?.sharedAt} />
      <ReviewReport data={data} from={from} to={to} summary={saved?.summary ?? ""} next={saved?.next ?? ""} clientName={client.name} brand={settings.brandName} forClient={false} />
    </div>
  );
}
