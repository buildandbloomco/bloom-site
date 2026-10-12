import { notFound } from "next/navigation";
import { getEvent, usd } from "@/lib/event-def";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import { listNotices } from "@/lib/paynotices";
import Ribbon from "@/components/Ribbon";
import "@/components/event/event.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome", robots: { index: false, follow: false } };

export default async function EventWelcome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string; z?: string; existing?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const e = getEvent(slug);
  if (!e) notFound();
  const tier = e.tiers.find((t) => t.id === sp.t);
  const s = await getSettings();
  const client = sp.existing ? null : await currentClient();
  // Show the access code only to a portal made in the last day, in this browser
  const fresh = client && Date.now() - new Date(client.createdAt).getTime() < 24 * 3600 * 1000;
  let code = "";
  if (fresh) { try { code = decryptCode(client.codeEnc); } catch { code = ""; } }
  const pending = client && sp.z ? (await listNotices(client.id)).find((n) => n.status === "pending") : null;

  return (
    <main className="gate ev">
      <Ribbon />
      <header className="gate-head">
        <span className="brandmark"><img src="/logo.png" alt="" /><span>{s.brandName.toUpperCase()}</span></span>
      </header>
      <div className="ev-narrow stack" style={{ gap: 22 }}>
        <div className="stack" style={{ gap: 12 }}>
          <p className="eyebrow">{e.name} · Welcome</p>
          <h1>You&rsquo;re in. <span className="ink">Let&rsquo;s build.</span></h1>
          <span className="rule" aria-hidden="true" />
          <p className="ev-lede">{tier ? <>Thank you for choosing <strong>{tier.name}</strong>. </> : null}{sp.z ? "Your spot is saved. Once your Zelle payment arrives, we will confirm it in your portal." : "Your payment went through and a receipt is on its way to your email."}</p>
        </div>
        {pending && (
          <div className="card stack" style={{ gap: 6 }}>
            <strong>Zelle: send {usd(pending.amount)} to {s.zelle}</strong>
            <span className="small muted">{s.zelleName || s.brandName}. Put your name and offer in the memo.</span>
          </div>
        )}
        {client && fresh ? (
          <div className="gate-card boxed">
            <div className="stack" style={{ gap: 4 }}>
              <span className="small muted">Your portal access code</span>
              <strong style={{ fontFamily: "var(--display)", fontSize: "1.8rem", letterSpacing: "0.04em" }}>{code || "Sent to your email"}</strong>
              <span className="small">Screenshot or save this. It is how you sign in to your portal from any device.</span>
            </div>
            <a className="btn btn-primary btn-block" href={`/p/${client.slug}`}>Open my portal</a>
          </div>
        ) : (
          <div className="gate-card boxed">
            <p style={{ margin: 0 }}>You already have a Build &amp; Bloom portal. Sign in with your access code to see this added.</p>
            <a className="btn btn-primary btn-block" href="/portal">Go to my portal</a>
          </div>
        )}
        {tier && (
          <div className="stack" style={{ gap: 8 }}>
            <h3 style={{ margin: 0 }}>What happens next</h3>
            <ol style={{ margin: 0, paddingLeft: 20 }} className="stack">{tier.next.map((n) => <li key={n}>{n}</li>)}</ol>
          </div>
        )}
        <p className="small muted">Questions? <a href={`mailto:${s.email}`}>{s.email}</a>{s.phone ? ` · ${s.phone}` : ""}</p>
      </div>
    </main>
  );
}
