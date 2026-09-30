import Link from "next/link";
import { getCatalog } from "@/lib/data";
import { shortDate } from "@/lib/format";
import type { LibraryItem } from "@/lib/types";

export const metadata = {
  title: "Workshops & Events",
  description: "Workshops, community events, trainings, and digital tools from Build & Bloom Collective.",
};

function Item({ l }: { l: LibraryItem }) {
  return (
    <article className="card lib-card">
      <span className={`tag ${l.kind === "workshop" ? "rust" : ""}`} style={{ alignSelf: "flex-start" }}>
        {l.kind === "workshop" ? "Workshop" : l.kind === "product" ? "Digital product" : "Resource"}
      </span>
      <h3 style={{ fontSize: "1.1rem" }}>{l.title}</h3>
      {l.date && <p className="small muted">{shortDate(l.date)}</p>}
      <p className="small">{l.description}</p>
      <div className="foot">
        <span className="small"><strong>{l.priceLabel}</strong></span>
        {l.url && <a className="btn btn-dark btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">{l.kind === "workshop" ? "Details" : "Get it"}</a>}
      </div>
    </article>
  );
}

export default async function Workshops() {
  const catalog = await getCatalog();
  const items = catalog.library.filter((l) => l.active && l.showOnSite);
  const today = new Date().toISOString().slice(0, 10);
  const workshops = items
    .filter((l) => l.kind === "workshop")
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  const upcoming = workshops.filter((l) => !l.date || l.date >= today);
  const products = items.filter((l) => l.kind !== "workshop");

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Workshops, events &amp; resources</p>
          <h1 style={{ marginTop: 16 }}>
            <span className="ink">Learn,</span> gather, grow.
          </h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">Community gatherings, trainings for teams, and tools you can put to work right away.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap stack" style={{ gap: 48 }}>
          <div className="stack">
            <h3>Upcoming workshops &amp; events</h3>
            {upcoming.length ? (
              <div className="grid-3">{upcoming.map((l) => <Item key={l.id} l={l} />)}</div>
            ) : (
              <p className="muted">New workshops and events are coming soon. <Link href="/contact">Ask about a private workshop for your team.</Link></p>
            )}
          </div>
          {products.length > 0 && (
            <div className="stack">
              <h3>Digital products &amp; tools</h3>
              <div className="grid-3">{products.map((l) => <Item key={l.id} l={l} />)}</div>
            </div>
          )}
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap stack" style={{ gap: 18 }}>
          <h2>Planning a workshop, retreat, or community event?</h2>
          <p>We design custom trainings and intentional gatherings for universities, nonprofits, practices, collectives, and community organizations.</p>
          <div><Link className="btn btn-gold" href="/contact?interest=workshops">Plan something with us</Link></div>
        </div>
      </section>
    </>
  );
}
