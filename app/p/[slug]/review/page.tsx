import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { notFound, redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getReview, reviewData } from "@/lib/reviews";
import PortalTop from "@/components/portal/PortalTop";
import ReviewReport from "@/components/ReviewReport";
import PrintButton from "@/components/course/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress Review", robots: { index: false, follow: false } };

export default async function ClientReview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const r = await getReview(client.id);
  if (!r?.sharedAt) notFound();
  const [data, settings] = await Promise.all([reviewData(client.id, r.from, r.to), getSettings()]);
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="review" />
      <main className="section" style={{ paddingTop: 48 }}>
        <div className="wrap narrow stack" style={{ gap: 20 }}>
          <span className="no-print" style={{ alignSelf: "flex-end" }}><PrintButton /></span>
          <ReviewReport data={data} from={r.from} to={r.to} summary={r.summary} next={r.next} clientName={client.name} brand={settings.brandName} forClient />
        </div>
      </main>
    </>
  );
}
