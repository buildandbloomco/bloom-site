import "@/components/shop/shop.css";
import { listOrders, listProducts } from "@/lib/shop";
import { GUIDES } from "@/lib/guides";
import ShopEditor from "@/components/admin/ShopEditor";

export const dynamic = "force-dynamic";

export default async function AdminShop() {
  const [products, orders] = await Promise.all([listProducts(), listOrders()]);
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Shop</h2>
        <p className="small muted" style={{ margin: 0 }}>Your products at <a href="/shop" target="_blank" rel="noopener noreferrer">/shop</a>. Free downloads become leads. Paid buyers get a download link and their own portal, with the product under Books &amp; Tools.</p>
      </div>
      <ShopEditor initial={products} orders={orders} guides={GUIDES.map((g) => ({ slug: g.slug, title: g.title, file: g.file }))} />
    </div>
  );
}
