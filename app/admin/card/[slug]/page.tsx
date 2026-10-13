import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { isAdmin } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { siteOrigin } from "@/lib/http";
import { BLOOM_CHECK, usd } from "@/lib/event-def";
import PrintButton from "@/components/event/PrintButton";
import "@/components/event/card.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Print card", robots: { index: false, follow: false } };

// A printable 5x7 card for an event, always matching its current offers, prices, and room code
export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const url = `${await siteOrigin()}/event/${e.slug}`;
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "Q", margin: 1, color: { dark: "#2c1b13", light: "#fffdf8" } });
  const tiers = e.tiers.filter((t) => t.active !== false).slice(0, 4);
  const ends = new Date(e.endsAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  const brand = (
    <span className="brand"><img src="/logo.png" alt="" />BUILD &amp; BLOOM COLLECTIVE</span>
  );
  return (
    <main className="cardprint">
      <div className="cp-bar">
        <strong>{e.name} card · 5 x 7 in, two-sided</strong>
        <span className="small muted">In the print window, choose paper size 5 x 7 (or &ldquo;Save as PDF&rdquo;), margins None, and turn on background graphics. Print double-sided, flip on the short edge.</span>
        <div><PrintButton /></div>
      </div>
      <section className="pc">
        <div className="top">{brand}<span className="eb">{e.name}</span></div>
        <h1>The Bloom Check</h1><div className="rl" />
        <div className="st"><b>Restore</b><span>Three slow breaths. In for 4, out for 6.</span></div>
        <div className="st"><b>Align</b><span>Circle 1 (not yet) to 5 (yes, this is me).</span></div>
        <div className="st"><b>Empower</b><span>Name your lowest area and one small step.</span></div>
        {BLOOM_CHECK.map((q) => (
          <div key={q.id} className="q"><strong>{q.area}.</strong> {q.statement}<div className="dots">{[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}</div></div>
        ))}
        <div className="wr"><div>My growing edge is<div className="ln" /></div><div>My one small step is<div className="ln" /></div></div>
      </section>
      <section className="pc">
        <div className="top">{brand}<span className="eb">Guests only</span></div>
        <h1>Your next step</h1><div className="rl" />
        <p style={{ fontSize: "10.5pt", lineHeight: 1.35 }}>Offers for the people in this room, for a short time, so this momentum has somewhere to go.</p>
        {tiers.map((t) => (
          <div key={t.id} className={`tier${t.featured ? " f" : ""}`}>
            <div><h3>{t.name}</h3><div className="d">{t.tagline}{t.deposit ? ` Hold it with ${usd(t.deposit)}.` : ""}</div></div>
            <div className="pr"><span className="n">{usd(t.price)}</span>{t.was ? <s>{usd(t.was)}</s> : null}</div>
          </div>
        ))}
        <div className="qr">
          <div className="img" dangerouslySetInnerHTML={{ __html: svg }} />
          <div><div className="sm">Scan, then enter the room code</div><div className="code">{e.code}</div><div className="sm">Card or Zelle. Your portal opens the moment you finish.<br />Open through {ends}.</div></div>
        </div>
        <div className="foot">Organizational wellness and strategy, rooted in the Psychology of Care.</div>
      </section>
    </main>
  );
}
