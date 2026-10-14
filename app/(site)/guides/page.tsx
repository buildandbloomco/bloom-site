import Link from "next/link";
import { GUIDES, guidePrice } from "@/lib/guides";
import { TOOLS } from "@/lib/tools-def";

export const metadata = { title: "Guides & Tools", description: "Free tools and practical guidebooks from Build & Bloom Collective for building, organizing, and sustaining your work." };

export default function Guides() {
  const guides = GUIDES.filter((g) => g.public);
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Free guides &amp; tools</p>
          <h1 style={{ marginTop: 16 }}><span className="ink">Start with</span> a clear next step.</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">Practical guides and tools you can use today. Built from the same process we use with clients.</p>
        </div>
      </section>
      <section className="section" id="tools" style={{ paddingBottom: 0 }}>
        <div className="wrap stack" style={{ gap: 16 }}>
          <h2 style={{ margin: 0 }}>Free tools</h2>
          <div className="grid-2" style={{ gap: 24 }}>
            {TOOLS.filter((t) => t.publicFree).map((t) => (
              <div className="panel" key={t.id}>
                <span className="tag gold" style={{ alignSelf: "flex-start" }}>Free · {t.minutes}</span>
                <h3>{t.name}</h3>
                <p style={{ margin: 0 }}>{t.blurb}</p>
                <Link className="btn btn-primary" style={{ alignSelf: "flex-start" }} href={`/tools/${t.id}`}>Use the tool</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap" style={{ marginBottom: 16 }}><h2 style={{ margin: 0 }}>Guidebooks</h2></div>
        <div className="wrap grid-2" style={{ gap: 24 }}>
          {guides.map((g) => (
            <div className="panel" key={g.slug}>
              <span className="tag gold" style={{ alignSelf: "flex-start" }}>{guidePrice(g)} · {g.pages} page{g.pages === 1 ? "" : "s"}</span>
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
