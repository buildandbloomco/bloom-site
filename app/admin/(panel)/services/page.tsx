import { getCatalog } from "@/lib/data";
import CatalogEditor from "@/components/admin/CatalogEditor";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const catalog = await getCatalog();
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Services & add-ons</h2>
      </div>
      <CatalogEditor initial={catalog} mode="services" />
    </div>
  );
}
