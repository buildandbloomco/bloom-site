import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { notFound, redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getCatalog, getSettings } from "@/lib/data";
import { longDate } from "@/lib/booking";
import { getBuild } from "@/lib/builds";
import { listFiles } from "@/lib/files";
import { BUILD_KINDS, RUNNING_COSTS, STAGES } from "@/lib/build-def";
import { pricedFor } from "@/lib/tier";
import PortalTop from "@/components/portal/PortalTop";
import IntakeForm, { AccountsList } from "@/components/build/IntakeForm";
import BuildRequests from "@/components/build/BuildRequests";
import SharedFiles from "@/components/SharedFiles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Build", robots: { index: false, follow: false } };

export default async function BuildView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const b = await getBuild(client.id);
  if (!b.enabled) notFound();
  const [settings, catalog, files] = await Promise.all([getSettings(), getCatalog(), listFiles(client.id)]);
  const addOns = pricedFor(catalog.services, client.tier).filter((s) => s.kind === "addon" && s.active && s.id.startsWith("sysadd-")).map((s) => ({ id: s.id, name: s.name, description: s.description, price: s.price, unit: s.unit }));
  const at = STAGES.findIndex((s) => s.id === b.stage);
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="build" />
      <main className="section" style={{ paddingTop: 48 }}>
        <div className="wrap stack" style={{ gap: 26, maxWidth: 980 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Your build</p>
            <h2>{BUILD_KINDS.find((k) => k.id === b.kind)?.label}</h2>
            <p className="muted" style={{ margin: 0 }}>Follow the work, send us what we need, and ask for anything extra, all in one place.{b.targetDate ? ` Target launch: ${longDate(b.targetDate)}.` : ""}</p>
          </div>

          <div className="card stack" style={{ gap: 16 }}>
            <ol className="stage-track">
              {STAGES.map((s, i) => (
                <li key={s.id} className={i < at ? "done" : i === at ? "now" : ""}>
                  <strong>{s.label}</strong>
                  <span className="tiny muted">{i < at ? "Done" : i === at ? "We are here" : "Coming up"}</span>
                </li>
              ))}
            </ol>
            <p style={{ margin: 0 }}><strong>Right now:</strong> {STAGES[at].detail}</p>
            {(b.previewUrl || b.liveUrl) && (
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                {b.liveUrl && <a className="btn btn-primary" href={b.liveUrl} target="_blank" rel="noopener noreferrer">Open your live site</a>}
                {b.previewUrl && <a className={`btn ${b.liveUrl ? "btn-ghost" : "btn-primary"}`} href={b.previewUrl} target="_blank" rel="noopener noreferrer">See the work in progress</a>}
              </div>
            )}
          </div>

          {b.updates.length > 0 && (
            <div className="card stack" style={{ gap: 4 }}>
              <h3 style={{ margin: "0 0 6px" }}>Updates from us</h3>
              {b.updates.map((u) => (
                <div className="file-row" key={u.id} style={{ display: "block" }}>
                  <span className="tiny muted">{day(u.at)}</span>
                  <p style={{ margin: "2px 0 0", whiteSpace: "pre-line" }}>{u.text}</p>
                  {u.link && <a className="small" href={u.link} target="_blank" rel="noopener noreferrer">Open the link</a>}
                </div>
              ))}
            </div>
          )}

          <div className="card stack" style={{ gap: 12 }} id="questions">
            <div className="stack" style={{ gap: 4 }}>
              <h3 style={{ margin: 0 }}>Tell us about your business</h3>
              <p className="small muted" style={{ margin: 0 }}>This is how we build something that sounds and works like you. Answer what you can. We will go through the rest together.</p>
            </div>
            <IntakeForm initial={b} as="client" clientId={client.id} />
          </div>

          <div className="grid-2">
            <div className="card stack" style={{ gap: 10 }}>
              <h3 style={{ margin: 0 }}>Logo, photos, and brand files</h3>
              <p className="small muted" style={{ margin: 0 }}>Upload your logo, brand guide, photos, and any documents we should work from.</p>
              <SharedFiles initial={files} as="client" clientId={client.id} />
            </div>
            <div className="card stack" style={{ gap: 10 }}>
              <h3 style={{ margin: 0 }}>Accounts to set up in your name</h3>
              <p className="small muted" style={{ margin: 0 }}>These are yours, so you own everything we build. Plan on about ${RUNNING_COSTS.monthly} a month to run it: {RUNNING_COSTS.line}. You pay those companies directly. Check each one off when it is ready and we will walk you through connecting it.</p>
              <AccountsList initial={b} as="client" clientId={client.id} />
            </div>
          </div>

          <div className="card stack" style={{ gap: 12 }} id="addons">
            <div className="stack" style={{ gap: 4 }}>
              <h3 style={{ margin: 0 }}>Want to add something?</h3>
              <p className="small muted" style={{ margin: 0 }}>Ask any time during the build. We reply here with a price and how it affects your timeline.</p>
            </div>
            <BuildRequests initial={b} addOns={addOns} />
          </div>
        </div>
      </main>
    </>
  );
}
