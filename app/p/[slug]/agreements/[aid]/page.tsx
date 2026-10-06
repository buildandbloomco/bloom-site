import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { notFound, redirect } from "next/navigation";
import { currentClient, isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { fingerprint, listAgreements } from "@/lib/agreements";
import PortalTop from "@/components/portal/PortalTop";
import SignAgreement from "@/components/portal/SignAgreement";
import PrintButton from "@/components/course/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agreement", robots: { index: false, follow: false } };

export default async function AgreementPage({ params }: { params: Promise<{ slug: string; aid: string }> }) {
  const { slug, aid } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const a = (await listAgreements(client.id)).find((x) => x.id === aid && x.status !== "draft");
  if (!a) notFound();
  const settings = await getSettings();
  const signed = a.status === "signed";
  const at = a.signedAt ? new Date(a.signedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/New_York" }) + " Eastern" : "";
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="agreement" />
      <main className="section" style={{ paddingTop: 48 }}>
        <div className="wrap narrow stack" style={{ gap: 24 }}>
          <div className="row between" style={{ gap: 12, flexWrap: "wrap" }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <p className="eyebrow">{signed ? "Signed agreement" : "Please read and sign"}</p>
              <h2>{a.title}</h2>
            </div>
            {signed && <span className="no-print"><PrintButton /></span>}
          </div>
          <div className="card agree-body">{a.body}</div>
          {signed ? (
            <div className="card stack agree-print" style={{ gap: 6 }}>
              <span className="tiny muted">Signed</span>
              <span className="sign-line">{a.signedName}</span>
              <span>{a.signedName}{a.signedTitle ? `, ${a.signedTitle}` : ""}, for {client.name}</span>
              <span className="small muted">{at}</span>
              <span className="tiny muted">Record ID {a.signedHash.slice(0, 16)}</span>
            </div>
          ) : (await isAdmin()) ? (
            <div className="banner warn" style={{ margin: 0 }}>You are previewing this as the admin. The client will see a place to type their name and sign here.</div>
          ) : (
            <SignAgreement id={a.id} hash={fingerprint(a)} defaultName={client.contactName} />
          )}
        </div>
      </main>
    </>
  );
}
