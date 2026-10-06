import "@/components/portal-nav.css";
import { notFound, redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { getPlan } from "@/lib/workspace";
import PortalTop from "@/components/portal/PortalTop";
import StrategyRoom from "@/components/room/StrategyRoom";

export const dynamic = "force-dynamic";
export const metadata = { title: "Strategy room", robots: { index: false, follow: false } };

export default async function ClientRoom({ params }: { params: Promise<{ slug: string; sid: string }> }) {
  const { slug, sid } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const [plan, settings] = await Promise.all([getPlan(client.id), getSettings()]);
  const s = plan.sessions.find((x) => x.id === sid);
  if (!plan.enabled || !s) notFound();
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="plan" />
      <main className="section" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <StrategyRoom sid={sid} role="client" names={{ us: "Jadon", client: client.contactName || "You" }} title={s.title} date={s.date} closed={s.status === "done"} link={s.link ?? ""} calHref={s.date ? `/api/portal/plan/ics?sid=${sid}` : ""} backHref={`/p/${slug}/plan`} />
        </div>
      </main>
    </>
  );
}
