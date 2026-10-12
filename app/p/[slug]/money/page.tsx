import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { notFound, redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { getFin } from "@/lib/finance";
import PortalTop from "@/components/portal/PortalTop";
import MoneyBoard from "@/components/finance/MoneyBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Money", robots: { index: false, follow: false } };

export default async function MoneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  if (!(await getFin(client.id)).enabled) notFound();
  const settings = await getSettings();
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="money" />
      <main className="section" style={{ paddingTop: 40 }}>
        <div className="wrap stack" style={{ gap: 20 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Money</p>
            <h2>Know where every dollar goes</h2>
            <p className="muted" style={{ margin: 0 }}>Record what comes in and goes out, split income into buckets, and see your month at a glance.</p>
          </div>
          <MoneyBoard as="client" clientId={client.id} today={nowET().date} clientName={client.name} />
        </div>
      </main>
    </>
  );
}
