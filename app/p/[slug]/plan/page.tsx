import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getPlan } from "@/lib/workspace";
import PortalTop from "@/components/portal/PortalTop";
import PlanBoard from "@/components/portal/PlanBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Strategy Plan", robots: { index: false, follow: false } };

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const [plan, settings] = await Promise.all([getPlan(client.id), getSettings()]);
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="plan" />
      <main className="section" style={{ paddingTop: 48 }}>
        <div className="wrap stack" style={{ gap: 28 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Strategy sessions</p>
            <h2>{plan.title}</h2>
            {plan.focus && <p className="muted" style={{ margin: 0 }}>{plan.focus}</p>}
          </div>
          {plan.enabled ? (
            <PlanBoard initial={plan} firstName={client.contactName || client.name} slug={slug} />
          ) : (
            <div className="card"><p style={{ margin: 0 }}>Your strategy plan will show up here once we schedule our first session.</p></div>
          )}
        </div>
      </main>
    </>
  );
}
