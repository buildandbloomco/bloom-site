import { bookProps } from "@/lib/booking";
import Link from "next/link";
import { getCatalog, getSettings } from "@/lib/data";
import { money } from "@/lib/format";
import type { Service } from "@/lib/types";

export const metadata = {
  title: "Services",
  description: "Organizational wellness services for mental health practices and helping organizations, and strategy, operations, and event support for Black entrepreneurs and community organizations.",
};

/** Core services are priced at the consult. A la carte prices show for both kinds of client. */
function PriceLine({ s }: { s: Service }) {
  const biz = typeof s.price === "number" ? s.price : null;
  const org = typeof s.priceOrg === "number" ? s.priceOrg : null;
  if (!s.showPrice || (biz === null && org === null)) return <span className="small price-line">Priced at your free consult</span>;
  const unit = s.unit ? ` ${s.unit}` : "";
  if (biz === null || org === null || biz === org) return <span className="small price-line">{money((biz ?? org) as number)}{unit}</span>;
  return (
    <span className="small price-line" style={{ display: "grid", gap: 2 }}>
      <span style={{ whiteSpace: "nowrap" }}><span className="muted">Small business</span> {money(biz)}</span>
      <span style={{ whiteSpace: "nowrap" }}><span className="muted">Organization</span> {money(org)}</span>
      {s.unit && <span className="muted">{s.unit}</span>}
    </span>
  );
}

function ServiceCard({ s, lane }: { s: Service; lane: string }) {
  return (
    <article className="card lib-card">
      <h3>{s.name}</h3>
      <p>{s.description}</p>
      <div className="foot" style={{ flexWrap: "wrap", gap: 12 }}>
        <PriceLine s={s} />
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

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="dark-card row between" style={{ gap: 20, flexWrap: "wrap" }}>
            <div className="stack" style={{ gap: 6, maxWidth: 640 }}>
              <span className="eyebrow gold">New: custom client portals &amp; systems</span>
              <p style={{ margin: 0, color: "var(--on-dark-2)" }}>A private, branded home base where clients view proposals, sign, pay, and track their work, and you see what needs attention on one screen.</p>
            </div>
            <Link className="btn btn-gold" href="/systems">See how it works</Link>
          </div>
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
              <p className="eyebrow">A la carte</p>
              <h2>Focused support</h2>
              <p className="muted">Single sessions and one-time projects you can book on their own. Pricing depends on whether you are a small business or an organization.</p>
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
