import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import "@/components/event/event.css";
import "@/components/tools/tools.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { nowET } from "@/lib/booking";
import { getTool } from "@/lib/tools-def";
import { getToolRecord } from "@/lib/tools";
import PortalTop from "@/components/portal/PortalTop";
import ToolShell from "@/components/tools/ToolShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const t = getTool((await params).tool);
  return { title: t?.name ?? "Tool", robots: { index: false, follow: false } };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string; tool: string }> }) {
  const { slug, tool: id } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const tool = getTool(id);
  if (!tool) notFound();
  const [settings, rec] = await Promise.all([getSettings(), getToolRecord(client.id, tool.id)]);
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="tools" />
      <main className="section" style={{ paddingTop: 36 }}>
        <div className="wrap stack" style={{ gap: 20, maxWidth: 980 }}>
          <Link href={`/p/${slug}#books-tools`} className="small no-print">&larr; Books &amp; Tools</Link>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">{tool.group} · {tool.minutes}</p>
            <h2>{tool.name}</h2>
            <p className="muted" style={{ margin: 0 }}>{tool.blurb}</p>
          </div>
          <ToolShell tool={tool} mode="client" initial={rec} today={nowET().date} />
        </div>
      </main>
    </>
  );
}
