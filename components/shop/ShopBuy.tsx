"use client";

import { useState } from "react";
import { priceLabel } from "@/lib/shop-def";

export default function ShopBuy({ product, canceled, zelle: zelleOn }: { product: { id: string; title: string; price: number; status: string }; canceled: boolean; zelle: boolean }) {
  const [f, setF] = useState({ name: "", email: "", zelleName: "", company_url: "" });
  const [method, setMethod] = useState<"card" | "zelle">("card");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(canceled ? "Your card was not charged. Try again whenever you're ready." : "");
  const [done, setDone] = useState("");
  const [z, setZ] = useState<{ to: string; name: string; amount: number; memo: string; thanks: string } | null>(null);
  const soon = product.status === "soon";
  const free = product.price <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch(soon ? "/api/shop/notify" : "/api/shop/buy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, method, ...f }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Something went wrong. Please try again."); return; }
    if (d.checkout) { window.location.href = d.checkout; return; }
    if (d.zelle) { setZ({ ...d.zelle, thanks: d.thanks }); return; }
    if (d.thanks) { window.location.href = d.thanks; return; }
    setDone(soon ? "You're on the list. We'll email you when it's out." : "Done.");
  }

  if (done) return <div className="ev-result" role="status"><strong>{done}</strong></div>;
  if (z) return (
    <div className="card stack ev-done" style={{ gap: 10 }}>
      <h3 style={{ margin: 0 }}>Send ${z.amount} by Zelle</h3>
      <ol style={{ margin: 0, paddingLeft: 20 }} className="stack">
        <li>Open your bank app and choose Zelle.</li>
        <li>Send to <strong>{z.to}</strong> ({z.name}).</li>
        <li>In the memo, write <strong>{z.memo}</strong>.</li>
      </ol>
      <p className="small" style={{ margin: 0 }}>As soon as it arrives, we&rsquo;ll email your download and open your portal. Keep this page if you like:</p>
      <div><a className="btn btn-ghost btn-sm" href={z.thanks}>Your order page</a></div>
    </div>
  );
  return (
    <form className="card stack" style={{ gap: 12 }} onSubmit={submit}>
      <strong>{soon ? "Tell me when it's out" : free ? "Get it free" : `Buy for ${priceLabel(product)}`}</strong>
      <div className="ev-fields">
        <label>Your name<input type="text" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999 }} value={f.company_url} onChange={(e) => setF({ ...f, company_url: e.target.value })} />
      {!soon && !free && zelleOn && (
        <div className="ev-opts" role="radiogroup" aria-label="How you are paying">
          <label className={method === "card" ? "on" : ""}><input type="radio" name="m" checked={method === "card"} onChange={() => setMethod("card")} /><span><strong>Card</strong><br /><span className="tiny muted">Instant download</span></span></label>
          <label className={method === "zelle" ? "on" : ""}><input type="radio" name="m" checked={method === "zelle"} onChange={() => setMethod("zelle")} /><span><strong>Zelle</strong><br /><span className="tiny muted">Download once we confirm</span></span></label>
        </div>
      )}
      {err && <p className="error-text" role="alert">{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "One moment..." : soon ? "Notify me" : free ? "Download now" : method === "zelle" ? `Pay ${priceLabel(product)} by Zelle` : `Pay ${priceLabel(product)} by card`}</button>
      {!soon && <p className="tiny muted" style={{ margin: 0 }}>{free ? "We'll also send occasional notes from Build & Bloom. Unsubscribe anytime." : "Digital product. You'll get a download link by email and your own Build & Bloom portal, with 12 free business tools."}</p>}
    </form>
  );
}
