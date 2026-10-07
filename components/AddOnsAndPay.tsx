"use client";

import { useMemo, useState } from "react";
import { money, priceLabel } from "@/lib/format";
import { buildCharge, payChoices, type PayOption } from "@/lib/pricing";
import type { PublicClient, Service } from "@/lib/types";

export default function AddOnsAndPay(props: {
  client: PublicClient;
  addOns: Service[];
  paid: number;
  paidBanner: boolean;
  canceled: boolean;
  paymentsOn: boolean;
  beforeYouBook: string[];
  email: string;
  zelle?: string;
  zelleName?: string;
  pendingZelle?: { amount: number; at: string }[];
}) {
  const { client, addOns, paid } = props;
  const choices = useMemo(() => payChoices(client.investment, paid), [client.investment, paid]);
  const [selected, setSelected] = useState<string[]>([]);
  const [option, setOption] = useState<PayOption>(choices[0]?.id ?? "addons");
  const [custom, setCustom] = useState("");
  const [name, setName] = useState(client.contactName || "");
  const [email, setEmail] = useState(client.email || "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reqMsg, setReqMsg] = useState("");
  const canZelle = !!props.zelle;
  const [method, setMethod] = useState<"card" | "zelle">(props.paymentsOn || !canZelle ? "card" : "zelle");
  const [zNote, setZNote] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  const chosen = addOns.filter((a) => selected.includes(a.id));
  const charge = buildCharge({
    inv: client.investment,
    paid,
    option,
    customAmount: Number(custom),
    addOns: chosen,
    packageTitle: client.package.title,
  });
  const quoteOnly = chosen.filter((a) => a.price === null);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setReqMsg("");
  }

  async function sendRequest() {
    setBusy(true);
    setReqMsg("");
    const res = await fetch("/api/portal/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addOnIds: selected, note }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setReqMsg(res.ok ? "Sent! We will follow up to confirm details and timing." : data.error || "Something went wrong.");
    if (res.ok) setNote("");
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (charge.error) return setErr(charge.error);
    setBusy(true);
    if (method === "zelle") {
      const z = await fetch("/api/portal/zelle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option, customAmount: Number(custom), addOnIds: selected, name, note: zNote }) });
      const zd = await z.json().catch(() => ({}));
      setBusy(false);
      if (!z.ok) return setErr(zd.error || "Something went wrong. Please try again.");
      setSent(zd.amount);
      return;
    }
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option, customAmount: Number(custom), addOnIds: selected, name, email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setBusy(false);
      return setErr(data.error || "Something went wrong. Please try again.");
    }
    window.location.href = data.url;
  }

  return (
    <>
      {addOns.length > 0 && (
        <section className="section" id="addons">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Shape the work</p>
              <h2>Add what would serve you</h2>
              <p className="muted">
                Choose any add-ons below. Pay for them with your next payment, or send them as a request and we will
                confirm the details first.
              </p>
            </div>
            <div className="grid-2">
              {addOns.map((a) => {
                const on = selected.includes(a.id);
                return (
                  <label key={a.id} className={`choice ${on ? "on" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(a.id)} />
                    <span className="stack" style={{ gap: 4 }}>
                      <strong className="choice-title">{a.name}</strong>
                      <span className="muted small">{a.description}</span>
                    </span>
                    <span className="price small">{priceLabel(a.price, a.unit)}</span>
                  </label>
                );
              })}
            </div>
            <div className="card stack" style={{ marginTop: 24 }}>
              <label>
                Anything we should know? <span className="hint">Optional. Goals, timing, or questions.</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
              </label>
              <div className="row between">
                <p className="small muted">
                  {selected.length ? `${selected.length} selected` : "Nothing selected yet"}
                  {quoteOnly.length ? " · custom-quote items will be confirmed before you pay" : ""}
                </p>
                <div className="row">
                  <button type="button" className="btn btn-ghost" onClick={sendRequest} disabled={busy || (!selected.length && !note.trim())}>
                    Send as a request
                  </button>
                  <a className="btn btn-dark" href="#pay">Add to my payment</a>
                </div>
              </div>
              {reqMsg && <p className="ok-text" role="status">{reqMsg}</p>}
            </div>
          </div>
        </section>
      )}

      <section className="section alt" id="pay">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Pay your part</p>
            <h2>Secure your spot</h2>
          </div>
          {props.paidBanner && (
            <div className="banner ok" role="status">Payment received. Thank you! A receipt is on its way to your email.</div>
          )}
          {props.canceled && <div className="banner warn">Payment was canceled. Nothing was charged.</div>}
          {sent !== null && <div className="banner ok" role="status">Thank you. We have your note that you sent {money(sent)} by Zelle. Your balance will update once we confirm it arrived, usually within one business day.</div>}
          {sent === null && (props.pendingZelle ?? []).map((z) => (
            <div className="banner ok" key={z.at}>Your Zelle payment of {money(z.amount)} is waiting for us to confirm it arrived. Nothing more is needed from you.</div>
          ))}

          <div className="pay">
            <form className="card stack" onSubmit={pay} style={{ gap: 20 }}>
              <div className="grid-2" style={{ gap: 14 }}>
                <label>
                  Your name
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </label>
                <label>
                  Email for your receipt
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={method === "card"} autoComplete="email" />
                </label>
              </div>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                <legend style={{ fontWeight: 500, fontSize: "0.92rem", marginBottom: 8 }}>What would you like to pay?</legend>
                <div className="radio-row">
                  {choices.map((c) => (
                    <label key={c.id} className={`choice ${option === c.id ? "on" : ""}`}>
                      <input type="radio" name="option" checked={option === c.id} onChange={() => setOption(c.id)} />
                      <span className="stack" style={{ gap: 2 }}>
                        <strong className="choice-title">{c.label}</strong>
                        <span className="muted small">{c.detail}</span>
                      </span>
                      <span className="price">{c.amount ? money(c.amount) : ""}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {option === "custom" && (
                <label>
                  Amount (USD)
                  <input type="number" min={1} step="0.01" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="500" />
                </label>
              )}
              {canZelle && (
                <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack">
                  <legend style={{ fontWeight: 500, fontSize: "0.92rem", marginBottom: 8 }}>How would you like to pay?</legend>
                  <div className="radio-row">
                    <label className={`choice ${method === "card" ? "on" : ""}`}>
                      <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} />
                      <span className="stack" style={{ gap: 2 }}><strong className="choice-title">Card</strong><span className="muted small">Pay now on secure checkout</span></span>
                    </label>
                    <label className={`choice ${method === "zelle" ? "on" : ""}`}>
                      <input type="radio" name="method" checked={method === "zelle"} onChange={() => setMethod("zelle")} />
                      <span className="stack" style={{ gap: 2 }}><strong className="choice-title">Zelle</strong><span className="muted small">Send from your bank app, then tell us here</span></span>
                    </label>
                  </div>
                </fieldset>
              )}
              {method === "zelle" && (
                <div className="stack" style={{ gap: 10, background: "var(--cream)", borderRadius: 12, padding: 18 }}>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Open Zelle in your bank app.</li>
                    <li>Send <strong>{money(charge.error ? 0 : charge.total)}</strong> to <strong>{props.zelle}</strong>{props.zelleName ? <> (it should show as <strong>{props.zelleName}</strong>)</> : null}.</li>
                    <li>Come back and click the button below so we know to look for it.</li>
                  </ol>
                  <label>A note for us <span className="hint">optional</span><input type="text" maxLength={500} value={zNote} onChange={(e) => setZNote(e.target.value)} placeholder="Sent from our business account" /></label>
                </div>
              )}
              {err && <p className="error-text" role="alert">{err}</p>}
              {method === "zelle" ? (
                <button className="btn btn-primary btn-block" disabled={busy || sent !== null}>{busy ? "One moment..." : sent !== null ? "Thank you, we will confirm it" : "I sent my Zelle payment"}</button>
              ) : (
              <button className="btn btn-primary btn-block" disabled={busy || !props.paymentsOn}>
                {busy ? "One moment..." : "Continue to secure payment"}
              </button>
              )}
              <p className="tiny muted">
                {method === "zelle" ? "Zelle goes straight from your bank to ours, with no card fees. Your balance updates after we confirm it arrived." : props.paymentsOn
                  ? "You will finish on Stripe's secure checkout. Pay by card or Apple Pay, or choose Klarna, Afterpay, or Affirm to split your payment where eligible."
                  : `Online payments are coming soon. Email ${props.email} and we will send an invoice.`}
              </p>
            </form>

            <aside className="summary" aria-live="polite">
              <p className="eyebrow gold">Your summary</p>
              <ul className="lines" style={{ marginTop: 12 }}>
                {charge.lines.length ? (
                  charge.lines.map((l, i) => (
                    <li key={i}><span>{l.label}</span><strong>{money(l.amount)}</strong></li>
                  ))
                ) : (
                  <li><span style={{ color: "var(--on-dark-3)" }}>Choose what you would like to pay</span></li>
                )}
              </ul>
              <div className="total">
                <span>Due today</span>
                <span className="big-number" style={{ fontSize: "2.2rem", color: "var(--gold)" }}>{money(charge.error ? 0 : charge.total)}</span>
              </div>
              {props.beforeYouBook.length > 0 && (
                <div className="stack" style={{ marginTop: 28, gap: 8 }}>
                  <p className="eyebrow gold">Before you book</p>
                  <ul className="small" style={{ margin: 0, paddingLeft: 18, color: "var(--on-dark-2)" }}>
                    {props.beforeYouBook.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
