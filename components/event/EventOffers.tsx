"use client";

import { useRef, useState } from "react";
import { BLOOM_CHECK, earlyOn, tierPrice, usd, type EventOffer } from "@/lib/event-def";

const when = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).replace("11:59 PM", "midnight");

type Zelle = { to: string; name: string; amount: number; memo: string };

export default function EventOffers({ event, ends, canceled, contact }: { event: EventOffer; ends: string; canceled: boolean; contact: { email: string; phone: string } }) {
  const [check, setCheck] = useState<Record<string, number>>({});
  const [showCheck, setShowCheck] = useState(false);
  const [tierId, setTierId] = useState("");
  const [f, setF] = useState({ name: "", email: "", phone: "", business: "", zelleName: "" });
  const [pay, setPay] = useState<"full" | "deposit">("full");
  const [method, setMethod] = useState<"card" | "zelle">("card");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(canceled ? "Your card was not charged. Pick up where you left off whenever you are ready." : "");
  const [zelle, setZelle] = useState<{ z: Zelle; welcome: string | null } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const tier = event.tiers.find((t) => t.id === tierId);
  const amount = tier ? (pay === "deposit" && tier.deposit ? tier.deposit : tierPrice(tier)) : 0;
  const answered = BLOOM_CHECK.filter((q) => check[q.id]);
  const done = answered.length === BLOOM_CHECK.length;
  const low = done ? [...BLOOM_CHECK].sort((a, b) => check[a.id] - check[b.id])[0] : null;
  const total = answered.reduce((a, q) => a + check[q.id], 0);
  const suggest = low ? event.tiers.find((t) => t.id === (total <= 13 ? "bloom" : low.tier)) : null;

  function choose(id: string) {
    setTierId(id);
    setPay("full");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tier) return;
    setBusy(true); setErr("");
    const r = await fetch("/api/event/buy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: event.slug, tierId: tier.id, pay, method, agree, check, ...f }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.error || "Something went wrong. Please try again."); setBusy(false); return; }
    if (d.checkout) { window.location.href = d.checkout; return; }
    if (d.zelle) { setZelle({ z: d.zelle, welcome: d.welcome }); setBusy(false); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }
  }

  return (
    <div className="ev-wrap stack">
      <section className="stack" style={{ gap: 14 }}>
        <p className="eyebrow">{event.name} · Guest offers</p>
        <h1>Leave empowered, <span className="ink">with a next step.</span></h1>
        <span className="rule" aria-hidden="true" />
        <p className="ev-lede">{event.intro}</p>
        <p className="small muted" style={{ margin: 0 }}>Open through {ends} Eastern.</p>
      </section>

      <section className="card stack ev-check" style={{ gap: 12 }}>
        <div className="row between" style={{ gap: 12, flexWrap: "wrap" }}>
          <div className="stack" style={{ gap: 2 }}>
            <h2 style={{ margin: 0 }}>The Bloom Check</h2>
            <span className="small muted">Two minutes. Rate each one from 1 (not yet) to 5 (yes, this is me).</span>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowCheck(!showCheck)} aria-expanded={showCheck}>{showCheck ? "Hide" : answered.length ? "Keep going" : "Take it"}</button>
        </div>
        {showCheck && (
          <div className="stack" style={{ gap: 14 }}>
            {BLOOM_CHECK.map((q) => (
              <fieldset key={q.id} className="ev-q">
                <legend><strong>{q.area}.</strong> {q.statement}</legend>
                <div className="ev-scale" role="radiogroup" aria-label={q.area}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={check[q.id] === n} className={check[q.id] === n ? "on" : ""} onClick={() => setCheck({ ...check, [q.id]: n })}>{n}</button>
                  ))}
                </div>
              </fieldset>
            ))}
            {low && (
              <div className="ev-result stack" style={{ gap: 6 }} role="status">
                <span className="eyebrow" style={{ fontSize: "0.75rem" }}>Your growing edge</span>
                <strong style={{ fontSize: "1.25rem" }}>{low.area}</strong>
                <p style={{ margin: 0 }}>One small step: {low.step}</p>
                {suggest && <p className="small" style={{ margin: 0 }}>A good place to start: <button type="button" className="linkbtn" onClick={() => choose(suggest.id)}>{suggest.name}</button></p>}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="ev-tiers">
        {event.tiers.map((t) => (
          <article key={t.id} className={`ev-tier${t.featured ? " featured" : ""}${tierId === t.id ? " picked" : ""}`}>
            {t.featured && <span className="ev-flag">Most support</span>}
            <h3>{t.name}</h3>
            <p className="small muted" style={{ margin: 0 }}>{t.tagline}</p>
            <div className="ev-price">
              <span className="now">{usd(tierPrice(t))}</span>
              {t.was && <span className="was"><s>{usd(t.was)}</s> usually</span>}
            </div>
            {earlyOn(t) && t.early && <p className="ev-early">Decide-today price, through {when(t.early.until)}. Then {usd(t.price)}.</p>}
            <ul>{t.includes.map((i) => <li key={i}>{i}</li>)}</ul>
            {t.deposit && <p className="tiny muted" style={{ margin: 0 }}>Or hold this price with {usd(t.deposit)} today.</p>}
            <button type="button" className={`btn btn-block ${tierId === t.id ? "btn-dark" : "btn-primary"}`} onClick={() => choose(t.id)}>{tierId === t.id ? "Selected" : `Choose ${t.name}`}</button>
          </article>
        ))}
      </section>

      <div ref={formRef} />
      {zelle ? (
        <section className="card stack ev-done" style={{ gap: 12 }}>
          <p className="eyebrow">Almost done</p>
          <h2 style={{ margin: 0 }}>Send {usd(zelle.z.amount)} by Zelle</h2>
          <ol className="stack" style={{ gap: 6, margin: 0, paddingLeft: 20 }}>
            <li>Open your bank app and choose Zelle.</li>
            <li>Send to <strong>{zelle.z.to}</strong> ({zelle.z.name}).</li>
            <li>Amount: <strong>{usd(zelle.z.amount)}</strong>. In the memo, write <strong>{zelle.z.memo}</strong>.</li>
          </ol>
          <p className="small" style={{ margin: 0 }}>We will confirm it as soon as it arrives, and it will show as paid in your portal.</p>
          {zelle.welcome ? <div><a className="btn btn-primary" href={zelle.welcome}>Open my portal</a></div> : <p className="small muted" style={{ margin: 0 }}>You already have a Build &amp; Bloom portal. Sign in with your access code to see it.</p>}
        </section>
      ) : tier && (
        <section className="card stack" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 4 }}>
            <p className="eyebrow" style={{ fontSize: "0.75rem" }}>You chose</p>
            <h2 style={{ margin: 0 }}>{tier.name}</h2>
          </div>
          <form className="stack" style={{ gap: 14 }} onSubmit={submit}>
            {tier.deposit && (
              <div className="ev-opts" role="radiogroup" aria-label="How much today">
                <label className={pay === "full" ? "on" : ""}><input type="radio" name="pay" checked={pay === "full"} onChange={() => setPay("full")} /><span><strong>Pay in full</strong> · {usd(tierPrice(tier))}</span></label>
                <label className={pay === "deposit" ? "on" : ""}><input type="radio" name="pay" checked={pay === "deposit"} onChange={() => setPay("deposit")} /><span><strong>Hold my price</strong> · {usd(tier.deposit)} today<br /><span className="tiny muted">{tier.depositNote}</span></span></label>
              </div>
            )}
            <div className="ev-fields">
              <label>Your name<input type="text" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
              <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label>Phone<input type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
              <label>Business or organization<input type="text" autoComplete="organization" value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} /></label>
            </div>
            <div className="ev-opts" role="radiogroup" aria-label="How you are paying">
              <label className={method === "card" ? "on" : ""}><input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} /><span><strong>Card</strong><br /><span className="tiny muted">Secure checkout by Stripe</span></span></label>
              <label className={method === "zelle" ? "on" : ""}><input type="radio" name="method" checked={method === "zelle"} onChange={() => setMethod("zelle")} /><span><strong>Zelle</strong><br /><span className="tiny muted">We confirm when it arrives</span></span></label>
            </div>
            {method === "zelle" && <label>Name on the Zelle account you will send from <span className="hint">If different from yours</span><input type="text" value={f.zelleName} onChange={(e) => setF({ ...f, zelleName: e.target.value })} /></label>}
            <label className="row small" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
              <input type="checkbox" style={{ width: "auto", marginTop: 4 }} checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I understand this is a {event.name} price, available through Sunday night. {tier.agreement ? "My short service agreement will be waiting in my portal to sign before my first session. " : ""}Build &amp; Bloom provides strategy and organizational wellness support, not therapy, legal, tax, or accounting services.</span>
            </label>
            {err && <p className="error-text" role="alert">{err}</p>}
            <button className="btn btn-primary btn-block" disabled={busy || !agree}>{busy ? "One moment..." : method === "card" ? `Pay ${usd(amount)} by card` : `Pay ${usd(amount)} by Zelle`}</button>
            <p className="tiny muted" style={{ margin: 0, textAlign: "center" }}>Your own private client portal opens as soon as you finish.</p>
          </form>
        </section>
      )}

      <p className="small muted" style={{ textAlign: "center" }}>Questions? Find Jadon this weekend, or reach out at <a href={`mailto:${contact.email}`}>{contact.email}</a>{contact.phone ? ` or ${contact.phone}` : ""}.</p>
    </div>
  );
}
