import Link from "next/link";
import { GUIDES, guidePrice } from "@/lib/guides";

export const metadata = { title: "Guidebooks", description: "Free and practical guidebooks from Build & Bloom Collective for building, organizing, and sustaining your work." };

export default function Guides() {
  const guides = GUIDES.filter((g) => g.public);
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Guidebooks</p>
          <h1 style={{ marginTop: 16 }}><span className="ink">Start with</span> a clear next step.</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">Practical guides you can work through with a pen. Built from the same process we use with clients.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap grid-2" style={{ gap: 24 }}>
          {guides.map((g) => (
            <div className="panel" key={g.slug}>
              <span className="tag gold" style={{ alignSelf: "flex-start" }}>{guidePrice(g)} · {g.pages} pages</span>
              <h3>{g.title}</h3>
              <p style={{ margin: 0 }}>{g.tagline}</p>
              <Link className="btn btn-primary" style={{ alignSelf: "flex-start" }} href={`/guides/${g.slug}`}>Get the guide</Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
