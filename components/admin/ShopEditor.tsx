"use client";

import { useState } from "react";
import { PRODUCT_KINDS, priceLabel, type Order, type Product } from "@/lib/shop-def";
import Uploader from "./Uploader";

const day = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const blank = (n: number): Product => ({ id: "", slug: "", title: `New product ${n}`, subtitle: "", description: "", price: 0, kind: "Guide", cover: "", file: "", includes: [], status: "hidden" });

export default function ShopEditor({ initial, orders: initialOrders, guides }: { initial: Product[]; orders: Order[]; guides: { slug: string; title: string; file: string }[] }) {
  const [items, setItems] = useState<Product[]>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [open, setOpen] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const dirty = JSON.stringify(items) !== saved;
  const up = (i: number, p: Partial<Product>) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => { const a = [...items]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); setItems(a); setOpen(i + d); };

  async function save() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/shop", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: items }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(d.error || "Could not save."); return; }
    setItems(d.products); setSaved(JSON.stringify(d.products)); setMsg("Saved. The shop is updated.");
  }
  async function act(o: Order, action: "paid" | "cancel") {
    if (action === "cancel" && !confirm(`Cancel ${o.name}'s order?`)) return;
    const r = await fetch("/api/admin/shop/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: o.id, action }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setOrders(orders.map((x) => (x.id === o.id ? d.order : x))); else alert(d.error || "Could not update.");
  }
  const pending = orders.filter((o) => o.status === "pending" && o.method === "zelle");
  const paidTotal = orders.filter((o) => o.status === "paid").reduce((a, o) => a + o.amount, 0);

  return (
    <div className="stack" style={{ gap: 24 }}>
      {pending.length > 0 && (
        <section className="card stack" style={{ gap: 8, borderTopColor: "var(--gold)" }}>
          <h3 style={{ margin: 0 }}>Zelle orders to confirm ({pending.length})</h3>
          {pending.map((o) => (
            <div key={o.id} className="row between" style={{ gap: 10, flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 8 }}>
              <span><strong>{o.name}</strong> · {o.title} · ${o.amount} <span className="small muted">· {o.email} · {day(o.at)}</span></span>
              <span className="row" style={{ gap: 8 }}><button type="button" className="btn btn-sm btn-primary" onClick={() => act(o, "paid")}>It arrived: send it</button><button type="button" className="linkbtn small" onClick={() => act(o, "cancel")}>Cancel</button></span>
            </div>
          ))}
        </section>
      )}

      <section className="stack" style={{ gap: 12 }}>
        <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Products</h3><button type="button" className="btn btn-sm btn-ghost" onClick={() => { setItems([...items, blank(items.length + 1)]); setOpen(items.length); }}>+ Add a product</button></div>
        {items.map((p, i) => (
          <div key={i} className="card stack" style={{ gap: 12, padding: 18 }}>
            <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="linkbtn" style={{ textDecoration: "none", fontWeight: 600, fontSize: "1.1rem" }} onClick={() => setOpen(open === i ? -1 : i)}>{open === i ? "▾" : "▸"} {p.title}</button>
              <span className="row small" style={{ gap: 8 }}>
                <span className={`tag ${p.status === "live" ? "green" : p.status === "soon" ? "gold" : ""}`}>{p.status === "live" ? `Live · ${priceLabel(p)}` : p.status === "soon" ? "Coming soon" : "Hidden"}</span>
                <button type="button" className="btn btn-sm btn-ghost" disabled={i === 0} aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="btn btn-sm btn-ghost" disabled={i === items.length - 1} aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
              </span>
            </div>
            {open === i && (
              <div className="stack" style={{ gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <label>Title<input type="text" value={p.title} onChange={(e) => up(i, { title: e.target.value })} /></label>
                  <label>Type<select value={p.kind} onChange={(e) => up(i, { kind: e.target.value })}>{PRODUCT_KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
                  <label>Price <span className="hint">0 = free download</span><input type="number" min={0} step="1" value={p.price} onChange={(e) => up(i, { price: Number(e.target.value) || 0 })} /></label>
                  <label>Was <span className="hint">Optional, crossed out</span><input type="number" min={0} step="1" value={p.was || ""} onChange={(e) => up(i, { was: Number(e.target.value) || undefined })} /></label>
                  <label>Status<select value={p.status} onChange={(e) => up(i, { status: e.target.value as Product["status"] })}><option value="live">Live: people can buy it</option><option value="soon">Coming soon: collect a waitlist</option><option value="hidden">Hidden</option></select></label>
                  <label>Length <span className="hint">e.g. 10 pages</span><input type="text" value={p.pages || ""} onChange={(e) => up(i, { pages: e.target.value })} /></label>
                </div>
                <label>One-line description<input type="text" value={p.subtitle} onChange={(e) => up(i, { subtitle: e.target.value })} /></label>
                <label>Description <span className="hint">Leave a blank line between paragraphs</span><textarea rows={5} value={p.description} onChange={(e) => up(i, { description: e.target.value })} /></label>
                <label>What&rsquo;s inside <span className="hint">One per line</span><textarea rows={4} value={p.includes.join("\n")} onChange={(e) => up(i, { includes: e.target.value.split("\n") })} /></label>
                <div className="tl-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <strong className="small">Cover image</strong>
                    {p.cover ? <img src={p.cover} alt="" style={{ width: 120, borderRadius: 6 }} /> : <span className="tiny muted">None yet. A branded cover is drawn for you.</span>}
                    <Uploader accept="image/*" label={p.cover ? "Replace cover" : "Upload a cover"} folder="shop" onDone={(url) => up(i, { cover: url })} />
                    {p.cover && <button type="button" className="linkbtn small" onClick={() => up(i, { cover: "" })}>Remove cover</button>}
                  </div>
                  <div className="stack" style={{ gap: 6 }}>
                    <strong className="small">The file buyers get</strong>
                    {p.file ? <a className="small" href={p.file} target="_blank" rel="noopener noreferrer">Open current file ↗</a> : <span className="tiny muted">Required before it goes live.</span>}
                    <Uploader accept="application/pdf,application/zip,image/*,audio/*,video/*" label={p.file ? "Replace file" : "Upload the file"} folder="shop" onDone={(url) => up(i, { file: url })} />
                    <label className="small">Or use a guidebook<select value={p.guideSlug || ""} onChange={(e) => { const g = guides.find((x) => x.slug === e.target.value); up(i, { guideSlug: e.target.value || undefined, ...(g ? { file: g.file } : {}) }); }}><option value="">None</option>{guides.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}</select></label>
                  </div>
                </div>
                {p.kind === "Bundle" && (
                  <div className="stack" style={{ gap: 4 }}>
                    <strong className="small">Also includes</strong>
                    {items.filter((x) => x !== p && x.id).map((x) => (
                      <label key={x.id} className="row small" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={(p.alsoGrants ?? []).includes(x.id)} onChange={(e) => up(i, { alsoGrants: e.target.checked ? [...(p.alsoGrants ?? []), x.id] : (p.alsoGrants ?? []).filter((y) => y !== x.id) })} />{x.title}</label>
                    ))}
                  </div>
                )}
                <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
                  <label className="row small" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={!!p.featured} onChange={(e) => up(i, { featured: e.target.checked })} />Feature it first in the shop</label>
                  <span className="row" style={{ gap: 12 }}>
                    {p.slug && <a className="small" href={`/shop/${p.slug}`} target="_blank" rel="noopener noreferrer">View page ↗</a>}
                    <button type="button" className="linkbtn danger small" onClick={() => confirm(`Delete ${p.title}? Past buyers keep their access.`) && setItems(items.filter((_, j) => j !== i))}>Delete</button>
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="row" style={{ gap: 12, position: "sticky", bottom: 12, background: "var(--ivory)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 14px", boxShadow: "var(--shadow)", alignItems: "center", flexWrap: "wrap", zIndex: 5 }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={save}>{busy ? "Saving..." : "Save products"}</button>
        <span className="small" role="status">{msg || (dirty ? "You have unsaved changes." : "All changes saved.")}</span>
      </div>

      <section className="card stack" style={{ gap: 8 }}>
        <div className="row between" style={{ gap: 10 }}><h3 style={{ margin: 0 }}>Orders</h3><span className="small muted">${paidTotal.toLocaleString()} paid in total</span></div>
        {orders.length === 0 ? <p className="small muted" style={{ margin: 0 }}>No orders yet.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table className="fin-table">
              <thead><tr><th>Date</th><th>Buyer</th><th>Product</th><th>Amount</th><th>Paid by</th><th>Status</th></tr></thead>
              <tbody>{orders.slice(0, 200).map((o) => (
                <tr key={o.id}><td>{day(o.at)}</td><td style={{ textAlign: "left" }}>{o.name}<br /><span className="tiny muted">{o.email}</span></td><td style={{ textAlign: "left" }}>{o.title}</td><td>{o.amount ? `$${o.amount}` : "Free"}</td><td>{o.method === "card" ? "Card" : o.method === "zelle" ? "Zelle" : "Free"}</td><td>{o.status === "paid" ? "Delivered" : o.status === "pending" ? (o.method === "card" ? "Checkout not finished" : "Waiting for Zelle") : "Canceled"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
