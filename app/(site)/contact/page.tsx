import { bookHref, bookProps } from "@/lib/booking";
import { getCatalog, getSettings } from "@/lib/data";
import InquiryForm from "@/components/site/InquiryForm";

export const metadata = {
  title: "Contact",
  description: "Send an inquiry or book a free consult with Build & Bloom Collective.",
};

export default async function Contact({ searchParams }: { searchParams: Promise<{ lane?: string; interest?: string }> }) {
  const sp = await searchParams;
  const [s, catalog] = await Promise.all([getSettings(), getCatalog()]);
  const services = catalog.services
    .filter((x) => x.active && x.showOnSite && x.kind === "core")
    .map((x) => ({ id: x.id, name: x.name, lane: x.lane ?? "both" }));
  const interest = services.some((x) => x.id === sp.interest) ? String(sp.interest) : "";
  const fromInterest = services.find((x) => x.id === interest)?.lane;
  const lane = (["orgs", "business", "other"].includes(sp.lane ?? "") ? sp.lane : fromInterest === "orgs" || fromInterest === "business" ? fromInterest : "orgs") as "orgs" | "business" | "other";

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Contact</p>
          <h1 style={{ marginTop: 16 }}>
            <span className="ink">Let&rsquo;s talk about</span> what you&rsquo;re building.
          </h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">Tell us a little about your team or business. Prefer to just talk? Book a free consult instead.</p>
          <div className="row" style={{ marginTop: 24 }}>
            <a className="btn btn-dark" {...bookProps(s)}>Book a free consult</a>
            {s.email && <a className="btn btn-ghost" href={`mailto:${s.email}`}>Email {s.email}</a>}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap narrow">
          <InquiryForm services={services} initialLane={lane} initialInterest={interest} bookingUrl={bookHref(s)} />
        </div>
      </section>
    </>
  );
}
