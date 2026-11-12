import { notFound } from "next/navigation";
import { eventImage } from "@/lib/event-def";
import { getEvent } from "@/lib/events";
import PrintButton from "@/components/event/PrintButton";
import "@/components/event/gift.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift certificate", robots: { index: false, follow: false } };

const clean = (v: string | undefined, max: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

/** A printable gift certificate for a seat bought as a gift. It only shows the names typed in at checkout. */
export default async function GiftCertificate({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ to?: string; from?: string; note?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const e = await getEvent(slug);
  if (!e || !e.giftable) notFound();
  const to = clean(sp.to, 120), from = clean(sp.from, 120), note = clean(sp.note, 160);
  const img = eventImage(e);
  return (
    <main className="gc-page">
      <div className="gc-bar no-print"><PrintButton /><span className="small muted">Tip: in the print window, turn on &ldquo;Background graphics.&rdquo;</span></div>
      <article className="gc">
        {img && <img className="gc-img" src={img} alt="" />}
        <div className="gc-body">
          <p className="gc-eyebrow">A gift for</p>
          <h1 className="gc-to">{to || "You"}</h1>
          <p className="gc-what">A seat at <strong>{e.name}</strong></p>
          {e.details && <p className="gc-details">{e.details}</p>}
          {note && <p className="gc-note">&ldquo;{note}&rdquo;</p>}
          <div className="gc-foot">
            {from && <span>With love, <strong>{from}</strong></span>}
            <span className="gc-brand"><img src="/logo.png" alt="" />Build &amp; Bloom Collective</span>
          </div>
          <p className="gc-small">Your seat is saved. All the details will be shared with you before the day.</p>
        </div>
      </article>
    </main>
  );
}
