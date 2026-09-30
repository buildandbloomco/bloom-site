"use client";

import { useEffect, useState } from "react";
import type { CourseAddOn, CoursePackage, PaymentPlan } from "@/lib/course-types";
import { money } from "@/lib/format";

interface Q { lines: { label: string; amount: number }[]; subtotal: number; discount: number; total: number; monthly: boolean; installments: number; installmentAmount: number; error?: string }

export default function EnrollForm({ courseId, packages, plans, addOns }: { courseId: string; packages: CoursePackage[]; plans: PaymentPlan[]; addOns: CourseAddOn[] }) {
  const featured = packages.find((p) => p.featured) ?? packages[0];
  const [pkgId, setPkgId] = useState(featured?.id ?? "");
  const [planId, setPlanId] = useState("");
  const [add, setAdd] = useState<string[]>([]);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [q, setQ] = useState<Q | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const pkg = packages.find((p) => p.id === pkgId);
  const pkgPlans = pkg && !pkg.monthly ? plans.filter((pl) => pkg.planIds.includes(pl.id)) : [];

  useEffect(() => {
    if (!pkgPlans.some((p) => p.id === planId)) setPlanId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgId]);

  useEffect(() => {
    let live = true;
    fetch("/api/courses/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, packageId: pkgId, planId, addOnIds: add, coupon: applied }) })
      .then((r) => r.json())
      .then((d) => { if (live) setQ(d); })
      .catch(() => undefined);
    return () => { live = false; };
  }, [courseId, pkgId, planId, add, applied]);

  async function submit(x: React.FormEvent) {
    x.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/courses/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, packageId: pkgId, planId, addOnIds: add, coupon: applied, name, email }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) return void (window.location.href = data.url);
    setBusy(false);
    if (res.ok && data.message) return setDone(data.message);
    setErr(data.error || "Something went wrong.");
  }

  if (done) return <div className="boxed" role="status"><p>{done}</p></div>;

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 28 }}>
      <fieldset className="form-section">
        <legend className="sr-only">Package</legend>
        <div className="pkg-grid">
          {packages.map((p) => (
            <label key={p.id} className={`pkg ${pkgId === p.id ? "on" : ""}`}>
              <input type="radio" name="pkg" className="sr-only" checked={pkgId === p.id} onChange={() => setPkgId(p.id)} />
              {p.featured && <span className="tag gold" style={{ alignSelf: "flex-start" }}>Most popular</span>}
              <span className="choice-title" style={{ fontSize: "1.1rem" }}>{p.name}</span>
              <span className="big-number" style={{ fontSize: "2rem", color: "var(--rust)" }}>{money(p.price)}<span className="small" style={{ fontFamily: "var(--serif)", fontWeight: 400 }}>{p.monthly ? " / month" : ""}</span></span>
              {p.format && <span className="small muted">{p.format}</span>}
              {p.description && <span className="small">{p.description}</span>}
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{p.includes.map((x, i) => <li key={i}>{x}</li>)}</ul>
              {!p.monthly && p.planIds.length > 0 && <span className="tiny muted">Payment plans available</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pay">
        <div className="card stack" style={{ gap: 20 }}>
          {pkgPlans.length > 0 && (
            <fieldset className="form-section">
              <legend>How would you like to pay?</legend>
              <div className="radio-row">
                <label className={`choice ${planId === "" ? "on" : ""}`}>
                  <input type="radio" name="plan" checked={planId === ""} onChange={() => setPlanId("")} />
                  <span className="choice-title">Pay in full</span>
                  <span className="price">{q && !planId ? money(q.total) : ""}</span>
                </label>
                {pkgPlans.map((pl) => (
                  <label key={pl.id} className={`choice ${planId === pl.id ? "on" : ""}`}>
                    <input type="radio" name="plan" checked={planId === pl.id} onChange={() => setPlanId(pl.id)} />
                    <span className="stack" style={{ gap: 2 }}>
                      <span className="choice-title">{pl.label}</span>
                      <span className="small muted">First payment today, then every {pl.intervalDays} days</span>
                    </span>
                    <span className="price">{q && planId === pl.id ? `${money(q.installmentAmount)} each` : ""}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {pkg && !pkg.monthly && addOns.length > 0 && (
            <fieldset className="form-section">
              <legend>Add-ons</legend>
              <div className="checks">
                {addOns.map((a) => (
                  <label key={a.id}>
                    <input type="checkbox" checked={add.includes(a.id)} onChange={() => setAdd(add.includes(a.id) ? add.filter((x) => x !== a.id) : [...add, a.id])} />
                    <span>{a.name} <strong className="price-line">+{money(a.price)}</strong>{a.description && <span className="hint"> · {a.description}</span>}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="grid-2" style={{ gap: 14 }}>
            <label>Your name<input type="text" required value={name} onChange={(x) => setName(x.target.value)} autoComplete="name" /></label>
            <label>Email<input type="email" required value={email} onChange={(x) => setEmail(x.target.value)} autoComplete="email" /></label>
          </div>
          <div className="row" style={{ alignItems: "flex-end", flexWrap: "nowrap" }}>
            <label style={{ flex: 1 }}>Discount code <span className="hint">optional</span><input type="text" value={coupon} onChange={(x) => setCoupon(x.target.value.toUpperCase())} /></label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setApplied(coupon.trim())} disabled={!coupon.trim()}>Apply</button>
          </div>
          {q?.error && applied && <p className="error-text small">{q.error}</p>}
          {err && <p className="error-text" role="alert">{err}</p>}
          <button className="btn btn-primary btn-block" disabled={busy || !pkg}>{busy ? "One moment..." : "Continue to secure checkout"}</button>
          <p className="tiny muted">You&rsquo;ll finish on Stripe&rsquo;s secure checkout. Your course opens right after payment, and you&rsquo;ll get an access code for your portal.</p>
        </div>
        <aside className="summary" aria-live="polite">
          <p className="eyebrow gold">Your summary</p>
          <ul className="lines" style={{ marginTop: 12 }}>
            {q?.lines?.map((l, i) => <li key={i}><span>{l.label}</span><strong>{money(l.amount)}</strong></li>)}
            {q && q.discount > 0 && <li><span>Discount ({applied})</span><strong>−{money(q.discount)}</strong></li>}
          </ul>
          <div className="total">
            <span>{q?.monthly ? "Per month" : q && q.installments > 1 ? "Due today" : "Total"}</span>
            <span className="big-number" style={{ fontSize: "2.2rem", color: "var(--gold)" }}>{q ? money(q.monthly || q.installments <= 1 ? q.total : q.installmentAmount) : ""}</span>
          </div>
          {q && q.installments > 1 && !q.monthly && <p className="small" style={{ color: "var(--on-dark-2)", marginTop: 10 }}>{q.installments} payments of {money(q.installmentAmount)} · {money(q.total)} total</p>}
        </aside>
      </div>
    </form>
  );
}
