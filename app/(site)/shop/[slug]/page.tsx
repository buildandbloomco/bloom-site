import "@/components/shop/shop.css";
import "@/components/event/event.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/shop";
import { priceLabel } from "@/lib/shop-def";
import { getSettings } from "@/lib/data";
import Cover from "@/components/shop/Cover";
import ShopBuy from "@/components/shop/ShopBuy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  return p && p.status !== "hidden" ? { title: p.title, description: p.subtitle, openGraph: { images: p.cover ? [p.cover] : ["/logo.png"] } } : {};
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ canceled?: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p || p.status === "hidden") notFound();
  const s = await getSettings();
  return (
    <section className="section">
      <div className="wrap stack" style={{ gap: 24 }}>
        <Link href="/shop" className="small">&larr; Shop</Link>
        <div className="sh-detail">
          <Cover p={p} size="lg" />
          <div className="stack" style={{ gap: 16 }}>
            <p className="eyebrow">{p.kind}{p.pages ? ` · ${p.pages}` : ""}</p>
            <h1 style={{ margin: 0 }}>{p.title}</h1>
            <p className="lede" style={{ margin: 0 }}>{p.subtitle}</p>
            {p.status === "soon" ? <span className="sh-soon" style={{ alignSelf: "flex-start" }}>Coming soon</span> : (
              <div className="sh-meta"><span className="sh-price" style={{ fontSize: "2rem" }}>{priceLabel(p)}</span>{p.was ? <s className="muted">${p.was}</s> : null}</div>
            )}
            {p.description.split(/\n\s*\n/).map((para, i) => <p key={i} style={{ margin: 0 }}>{para}</p>)}
            {p.includes.length > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                <strong>Inside</strong>
                <ul style={{ margin: 0, paddingLeft: 20 }}>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            <ShopBuy product={{ id: p.id, title: p.title, price: p.price, status: p.status }} canceled={(await searchParams).canceled === "1"} zelle={!!s.zelle} />
          </div>
        </div>
      </div>
    </section>
  );
}
