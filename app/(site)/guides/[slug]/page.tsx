import { notFound } from "next/navigation";
import { getGuide, guidePrice } from "@/lib/guides";
import { getLead, saveLead } from "@/lib/leads";
import { stripe } from "@/lib/stripe";
import GuideForm from "@/components/site/GuideForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  return g ? { title: g.title, description: g.tagline } : {};
}

export default async function GuidePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const g = getGuide(slug);
  if (!g) notFound();

  // Back from Stripe: confirm the payment, note it on the lead, and hand over the download
  let unlocked = false;
  if (sp.paid?.startsWith("cs_")) {
    const s = stripe();
    if (s) {
      try {
        const session = await s.checkout.sessions.retrieve(sp.paid);
        if (session.payment_status === "paid" && session.metadata?.kind === "guide" && session.metadata.slug === g.slug) {
          unlocked = true;
          const lead = session.metadata.leadId ? await getLead(session.metadata.leadId) : null;
          const entry = lead?.guides?.find((x) => x.slug === g.slug);
          if (lead && entry && entry.stripeSessionId !== session.id) {
            entry.paid = (session.amount_total ?? 0) / 100;
            entry.stripeSessionId = session.id;
            await saveLead(lead);
          }
        }
      } catch { /* fall through to the form */ }
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{guidePrice(g)} guidebook · {g.pages} pages</p>
          <h1 style={{ marginTop: 16 }}>{g.title}</h1>
          <span className="rule" aria-hidden="true" />
          <p className="lede">{g.tagline}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap grid-2" style={{ gap: 32, alignItems: "start" }}>
          <div className="stack" style={{ gap: 14 }}>
            <p className="eyebrow">What&rsquo;s inside</p>
            <ul className="stack" style={{ gap: 10, margin: 0, paddingLeft: "1.2em" }}>
              {g.inside.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
          {unlocked ? (
            <div className="panel" role="status">
              <h3>Thank you. It&rsquo;s yours.</h3>
              <p style={{ margin: 0 }}>Your payment went through. Download your copy below.</p>
              <a className="btn btn-primary" href={g.file} target="_blank" rel="noopener noreferrer" download>Download the guide (PDF)</a>
            </div>
          ) : (
            <GuideForm slug={g.slug} title={g.title} paid={g.price > 0} />
          )}
        </div>
      </section>
    </>
  );
}
