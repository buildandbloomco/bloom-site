import { getCatalog } from "@/lib/data";
import CatalogEditor from "@/components/admin/CatalogEditor";
import { GUIDES } from "@/lib/guides";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const catalog = await getCatalog();
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Admin</p>
        <h2>Books &amp; Tools</h2>
        <p className="small muted" style={{ margin: 0 }}>Everything here shows in your clients&rsquo; portals under <strong>Books &amp; Tools</strong>, along with the 12 interactive tools. Separate from the Wellness Library subscription.</p>
      </div>
      <section className="card stack" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>Books &amp; guidebooks</h3>
        <p className="small muted" style={{ margin: 0 }}>Every client gets the client guidebook. Choose more for a client on their Meeting view, under Guidebooks. Clients who buy an event offer get all of them automatically.</p>
        {GUIDES.map((g) => (
          <div key={g.slug} className="file-row">
            <div className="stack" style={{ gap: 2, flex: "1 1 260px" }}>
              <strong>{g.title}</strong>
              <span className="small muted">{g.tagline}</span>
            </div>
            <span className={`tag ${g.public ? "" : "gold"}`}>{g.public ? (g.price > 0 ? `On website · $${g.price}` : "Free on website") : "Clients only"}</span>
            <span className="small muted">{g.pages} {g.pages === 1 ? "page" : "pages"}</span>
            <a className="btn btn-sm btn-ghost" href={g.file} target="_blank" rel="noopener noreferrer">Open PDF</a>
          </div>
        ))}
        <p className="tiny muted" style={{ margin: 0 }}>To add a new book to this list, send it to Claude to format and add. Or upload it below as a digital product.</p>
      </section>
      <h3 style={{ margin: "8px 0 0" }}>Products, workshops &amp; resources</h3>
      <CatalogEditor initial={catalog} mode="library" />
    </div>
  );
}
