import "@/components/shop/shop.css";
import Link from "next/link";
import { verify, decryptCode } from "@/lib/crypto";
import { currentClient } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { deliverables, dlToken, getOrder } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thank you", robots: { index: false, follow: false } };

export default async function Thanks({ searchParams }: { searchParams: Promise<{ o?: string; k?: string; new?: string }> }) {
  const sp = await searchParams;
  const ok = sp.o && verify(sp.k) === sp.o;
  const o = ok ? await getOrder(sp.o!) : null;
  const s = await getSettings();
  if (!o) return <section className="section"><div className="wrap stack" style={{ gap: 12 }}><h1>We couldn&rsquo;t find that order.</h1><p>Check your email for your download link, or <Link href="/contact">reach out</Link> and we&rsquo;ll help.</p></div></section>;
  const items = o.status === "paid" ? await deliverables(o) : [];
  const me = sp.new ? await currentClient() : null;
  let code = "";
  if (me && me.id === o.clientId && Date.now() - new Date(me.createdAt).getTime() < 864e5) { try { code = decryptCode(me.codeEnc); } catch { code = ""; } }
  return (
    <section className="section">
      <div className="wrap stack" style={{ gap: 20, maxWidth: 680 }}>
        <p className="eyebrow">Thank you, {o.name.split(" ")[0]}</p>
        <h1 style={{ margin: 0 }}>{o.status === "paid" ? "It's yours." : o.status === "canceled" ? "This order was canceled." : "Your order is saved."}</h1>
        <span className="rule" aria-hidden="true" />
        {o.status === "pending" && <p style={{ margin: 0 }}>As soon as your Zelle payment of ${o.amount} to {s.zelle} arrives, we&rsquo;ll email your download to {o.email} and open your portal.</p>}
        {items.length > 0 && (
          <div className="card stack" style={{ gap: 8 }}>
            {items.map((p) => (
              <div key={p.id} className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
                <strong>{p.title}</strong>
                <a className="btn btn-primary btn-sm" href={`/api/shop/download?t=${encodeURIComponent(dlToken(o.id, p.id))}`}>Download</a>
              </div>
            ))}
            <span className="tiny muted">We also emailed this link to {o.email}. It works for 90 days.</span>
          </div>
        )}
        {o.method !== "free" && o.status === "paid" && (
          <div className="card stack" style={{ gap: 8 }}>
            <strong>Your Build &amp; Bloom portal</strong>
            <span className="small">Your purchase lives under Books &amp; Tools, along with 12 free business tools.</span>
            {code && <span className="small">Your access code: <strong style={{ fontFamily: "var(--display)", fontSize: "1.2rem" }}>{code}</strong>. Save it to sign in from any device.</span>}
            <div><a className="btn btn-ghost btn-sm" href="/portal">Open my portal</a></div>
          </div>
        )}
        <p className="small muted">Questions? <a href={`mailto:${s.email}`}>{s.email}</a></p>
      </div>
    </section>
  );
}
