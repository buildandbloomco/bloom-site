import { bookProps } from "@/lib/booking";
import Link from "next/link";
import { getCatalog, getSettings } from "@/lib/data";
import { priceLabel } from "@/lib/format";
import type { Service } from "@/lib/types";

export const metadata = {
  title: "Services",
  description: "Organizational wellness services for mental health practices and helping organizations, and strategy, operations, and event support for Black entrepreneurs and community organizations.",
};

function ServiceCard({ s, lane }: { s: Service; lane: string }) {
  return (
    <article className="card lib-card">
      <h3>{s.name}</h3>
      <p>{s.description}</p>
      <div className="foot">
        <span className="small price-line">{priceLabel(s.price, s.unit)}</span>
        <Link className="btn btn-dark btn-sm" href={`/contact?lane=${lane}&interest=${encodeURIComponent(s.id)}`}>Ask about this</Link>
      </div>
    </article>
  );
}

export default async function Services() {
  const [catalog, s] = await Promise.all([getCatalog(), getSettings()]);
  const shown = catalog.services.filter((x) => x.active && x.showOnSite);
  const core = shown.filter((x) => x.kind === "core");
  const orgs = core.filter((x) => x.lane === "orgs");
  const business = core.filter((x) => x.lane === "business");
  const both = core.filter((x) => x.lane === "both" || !x.lane);
  const addons = shown.filter((x) => x.kind === "addon");

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Services</p>
          <h1 style={{ marginTop: 16 }}>
            <span className="ink">Support that fits</span> how you work.
          </h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">
            Every engagement starts with a free consult and is shaped around your context. Choose a single project, a
            program for your team, or ongoing support.
          </p>
        </div>
      </section>

      {orgs.length > 0 && (
        <section className="section" id="orgs">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">For mental health practices &amp; helping organizations</p>
              <h2>Organizational wellness</h2>
              <p className="muted">For group practices, agencies, nonprofits, and universities whose teams carry heavy work.</p>
            </div>
            <div className="grid-2">{orgs.map((x) => <ServiceCard key={x.id} s={x} lane="orgs" />)}</div>
          </div>
        </section>
      )}

      {business.length > 0 && (
        <section className="section alt" id="business">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">For Black entrepreneurs, community organizations &amp; events</p>
              <h2>Strategy, community &amp; events</h2>
            </div>
            <div className="grid-2">{business.map((x) => <ServiceCard key={x.id} s={x} lane="business" />)}</div>
          </div>
        </section>
      )}

      {both.length > 0 && (
        <section className="section" id="all">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">For any team</p>
              <h2>Strategy, operations &amp; training</h2>
            </div>
            <div className="grid-2">{both.map((x) => <ServiceCard key={x.id} s={x} lane="other" />)}</div>
          </div>
        </section>
      )}

      {addons.length > 0 && (
        <section className="section alt">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Add-ons</p>
              <h2>Focused support</h2>
            </div>
            <div className="grid-3">{addons.map((x) => <ServiceCard key={x.id} s={x} lane="other" />)}</div>
          </div>
        </section>
      )}

      <section className="cta-band">
        <div className="wrap stack" style={{ gap: 18 }}>
          <h2>Not sure where to start?</h2>
          <p>That is what the free consult is for. We will help you figure out what would make the biggest difference first.</p>
          <div className="row">
            <a className="btn btn-gold" {...bookProps(s)}>Book a free consult</a>
            <Link className="btn btn-ghost-light" href="/contact">Send an inquiry</Link>
          </div>
        </div>
      </section>
    </>
  );
}
