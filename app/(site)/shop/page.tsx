import "@/components/shop/shop.css";
import Link from "next/link";
import { listProducts } from "@/lib/shop";
import { priceLabel, productPath } from "@/lib/shop-def";
import { TOOLS } from "@/lib/tools-def";
import Cover from "@/components/shop/Cover";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop", description: "Guides, workbooks, and tools from Build & Bloom Collective for building a business and a life that sustains you." };

export default async function Shop() {
  const products = (await listProducts()).filter((p) => p.status !== "hidden");
  const sorted = [...products.filter((p) => p.status === "live" && p.featured), ...products.filter((p) => p.status === "live" && !p.featured), ...products.filter((p) => p.status === "soon")];
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Shop</p>
          <h1 style={{ marginTop: 16 }}><span className="ink">Books and tools</span> for the work you carry.</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">Guides, workbooks, and tools built from the same process we use with clients. Everything you buy is yours to keep, in your own Build &amp; Bloom portal.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap sh-grid">
          {sorted.map((p) => (
            <Link key={p.id} href={productPath(p)} className="sh-card">
              <Cover p={p} />
              <div className="sh-meta">{p.status === "soon" ? <span className="sh-soon">Coming soon</span> : <span className="sh-price">{priceLabel(p)}</span>}<span className="small muted">{p.kind}</span></div>
              <h3>{p.title}</h3>
              <p className="small muted" style={{ margin: 0 }}>{p.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap card stack" style={{ gap: 10 }}>
          <h2 style={{ margin: 0 }}>Free tools</h2>
          <p style={{ margin: 0 }}>Try them now, no account needed.</p>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            {TOOLS.filter((t) => t.publicFree).map((t) => <Link key={t.id} className="btn btn-ghost btn-sm" href={`/tools/${t.id}`}>{t.name}</Link>)}
            <Link className="btn btn-ghost btn-sm" href="/guides">Free guides</Link>
          </div>
        </div>
      </section>
    </>
  );
}
