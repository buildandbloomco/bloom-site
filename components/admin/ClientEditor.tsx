"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money, priceLabel, shortDate } from "@/lib/format";
import { outstanding } from "@/lib/pricing";
import type { Catalog, Client, ClientStatus } from "@/lib/types";
import WorkEditor from "./WorkEditor";
import { priceFor, TIERS } from "@/lib/tier";

export interface WorkspaceSummary {
  plan: { enabled: boolean; pct: number; total: number; openRequests: number; newComments: number; nextSession: string };
  assessment: { enabled: boolean; status: string; responses: number } | null;
}
const ASSESS_LABEL: Record<string, string> = { leader: "Leader questionnaire", team: "Team survey open", review: "In review", shared: "Results shared" };

const STATUSES: { v: ClientStatus; label: string }[] = [
  { v: "draft", label: "Draft (not sent yet)" },
  { v: "sent", label: "Sent / proposal stage" },
  { v: "active", label: "Active client" },
  { v: "completed", label: "Completed" },
  { v: "archived", label: "Archived (portal turned off)" },
];

export default function ClientEditor({
  initial,
  catalog,
  initialCode,
  workspace,
}: {
  initial: Client;
  catalog: Catalog;
  initialCode: string;
  workspace?: WorkspaceSummary;
}) {
  const router = useRouter();
  const [c, setC] = useState<Client>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState(initialCode);
  const [customCode, setCustomCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [origin, setOrigin] = useState("");
  const [pay, setPay] = useState({ amount: "", description: "", method: "Invoice", kind: "package", date: new Date().toISOString().slice(0, 10) });

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(fn: (d: Client) => void) {
    setC((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
    setMsg("");
  }

  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const core = catalog.services.filter((s) => s.kind === "core");
  const addons = catalog.services.filter((s) => s.kind === "addon");
  const paid = c.payments.filter((p) => p.kind !== "addon").reduce((s, p) => s + p.amount, 0);
  const lineSum = c.investment.lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const svcName = (id: string) => catalog.services.find((s) => s.id === id)?.name ?? id;

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/clients/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(data.error || "Could not save.");
    setC((prev) => ({ ...prev, slug: data.slug }));
    setDirty(false);
    setMsg("Saved");
    router.refresh();
  }

  async function newCode(useCustom: boolean) {
    if (!confirm("Change this client's access code? The old code will stop working right away.")) return;
    setCodeMsg("");
    const res = await fetch(`/api/admin/clients/${c.id}/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: useCustom ? customCode : "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setCodeMsg(data.error || "Could not change code.");
    setCode(data.code);
    setCustomCode("");
    setCodeMsg("New code is live.");
  }

  const invite = `Hi ${c.contactName || c.name}! Your Build & Bloom Collective portal is ready. It has your proposal, investment, add-ons, resources, and next steps in one place.

Open it here: ${origin}/portal
Your access code: ${code}

Reach out with any questions. So glad to build with you.`;

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCodeMsg(`${label} copied.`);
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/clients/${c.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pay),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || "Could not add payment.");
    setC((prev) => ({ ...prev, payments: data.payments }));
    setPay((p) => ({ ...p, amount: "", description: "" }));
  }

  async function removePayment(pid: string) {
    if (!confirm("Remove this payment record? (This does not refund anything in Stripe.)")) return;
    const res = await fetch(`/api/admin/clients/${c.id}/payments?paymentId=${pid}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setC((prev) => ({ ...prev, payments: data.payments }));
  }

  async function setRequest(requestId: string, status: string) {
    const res = await fetch(`/api/admin/clients/${c.id}/requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setC((prev) => ({ ...prev, requests: data.requests }));
  }

  async function remove() {
    if (!confirm(`Delete ${c.name} and their portal permanently?`)) return;
    const res = await fetch(`/api/admin/clients/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      setDirty(false);
      window.location.href = "/admin";
    }
  }

  return (
    <>
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Client portal</p>
          <h2>{c.name}</h2>
        </div>
        <a className="btn btn-dark" href={`/admin/clients/${c.id}/desk`}>Open meeting view</a>
      </div>

      <div className="editor-grid">
        <div className="stack" style={{ gap: 20 }}>
          {/* BASICS */}
          <section className="panel">
            <h3>Basics</h3>
            <div className="grid-2" style={{ gap: 14 }}>
              <label>Client or organization<input type="text" value={c.name} onChange={(e) => update((d) => void (d.name = e.target.value))} /></label>
              <label>Contact first name<input type="text" value={c.contactName} onChange={(e) => update((d) => void (d.contactName = e.target.value))} /></label>
              <label>Contact email<input type="email" value={c.email} onChange={(e) => update((d) => void (d.email = e.target.value))} /></label>
              <label>
                Status
                <select value={c.status} onChange={(e) => update((d) => void (d.status = e.target.value as ClientStatus))}>
                  {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
              </label>
              <label>
                Client type <span className="hint">sets the add-on prices they see</span>
                <select value={c.tier ?? ""} onChange={(e) => update((d) => void (d.tier = e.target.value as Client["tier"]))}>
                  <option value="">Not set (small business prices)</option>
                  {TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label>
                Payment
                <select value={c.billing ?? "standard"} onChange={(e) => update((d) => void (d.billing = e.target.value as Client["billing"]))}>
                  <option value="standard">Pays through the portal</option>
                  <option value="none">No payment needed (existing client)</option>
                </select>
              </label>
              <label>
                Page address <span className="hint">yoursite.com/p/{c.slug}</span>
                <input type="text" value={c.slug} onChange={(e) => update((d) => void (d.slug = e.target.value))} />
              </label>
            </div>
            <label>
              Welcome message <span className="hint">Shown at the top of their portal.</span>
              <textarea value={c.welcome} onChange={(e) => update((d) => void (d.welcome = e.target.value))} placeholder="Thank you for making space to talk about what you are building..." />
            </label>
          </section>

          {/* CONSULTATION SHEETS */}
          <section className="panel">
            <div className="row between">
              <h3>Consultation sheets</h3>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={async () => {
                  if (dirty && !confirm("You have unsaved changes on this page. Continue without saving them?")) return;
                  const res = await fetch(`/api/admin/clients/${c.id}/consults`, { method: "POST" });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setDirty(false);
                    window.location.href = `/admin/clients/${c.id}/consult/${data.id}`;
                  }
                }}
              >
                + Start a consultation sheet
              </button>
            </div>
            <p className="small muted">Fill one out live during a consult, kickoff, or check-in. It saves as you type.</p>
            {c.consults.map((x) => (
              <div key={x.id} className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <div className="stack" style={{ gap: 2 }}>
                  <strong>{x.type} · {shortDate(x.date)}</strong>
                  <span className="tiny muted">
                    {x.shared ? "Shared in portal" : "Not shared"}
                    {x.clientConfirmedAt ? ` · Confirmed by ${x.clientConfirmedBy}` : x.shared ? " · Waiting for confirmation" : ""}
                  </span>
                </div>
                <a className="btn btn-sm btn-ghost" href={`/admin/clients/${c.id}/consult/${x.id}`}>Open</a>
              </div>
            ))}
          </section>

          <WorkEditor c={c} update={update} />

          {/* PACKAGE */}
          <section className="panel">
            <h3>Package</h3>
            <label>Package name<input type="text" value={c.package.title} onChange={(e) => update((d) => void (d.package.title = e.target.value))} placeholder="Strategy & Operations Foundations" /></label>
            <label>Summary<textarea value={c.package.summary} onChange={(e) => update((d) => void (d.package.summary = e.target.value))} /></label>
            <div className="grid-3" style={{ gap: 14 }}>
              <label>Format<input type="text" value={c.package.format} onChange={(e) => update((d) => void (d.package.format = e.target.value))} placeholder="3 month retainer" /></label>
              <label>Duration<input type="text" value={c.package.duration} onChange={(e) => update((d) => void (d.package.duration = e.target.value))} placeholder="12 weeks" /></label>
              <label>Start date<input type="date" value={c.package.startDate} onChange={(e) => update((d) => void (d.package.startDate = e.target.value))} /></label>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <strong className="small">Included services</strong>
              <div className="checks">
                {[...core, ...addons].map((s) => (
                  <label key={s.id}>
                    <input type="checkbox" checked={c.package.serviceIds.includes(s.id)} onChange={() => update((d) => void (d.package.serviceIds = toggleIn(d.package.serviceIds, s.id)))} />
                    {s.name} {s.kind === "addon" && <span className="hint">(add-on)</span>}
                  </label>
                ))}
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <strong className="small">Other things included <span className="hint">Sessions, deliverables, anything custom</span></strong>
              {c.package.customItems.map((it, i) => (
                <div className="list-item" key={i}>
                  <input type="text" placeholder="Title" value={it.title} onChange={(e) => update((d) => void (d.package.customItems[i].title = e.target.value))} />
                  <input type="text" placeholder="Detail (optional)" value={it.detail} onChange={(e) => update((d) => void (d.package.customItems[i].detail = e.target.value))} />
                  <button type="button" className="linkbtn danger small" onClick={() => update((d) => void d.package.customItems.splice(i, 1))}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => update((d) => void d.package.customItems.push({ title: "", detail: "" }))}>+ Add item</button>
            </div>
          </section>

          {/* INVESTMENT */}
          <section className="panel">
            <h3>Investment</h3>
            {c.investment.lineItems.map((l, i) => (
              <div className="row" key={i} style={{ flexWrap: "nowrap" }}>
                <input type="text" placeholder="Line item" value={l.label} onChange={(e) => update((d) => void (d.investment.lineItems[i].label = e.target.value))} />
                <input type="number" min={0} step="0.01" style={{ maxWidth: 140 }} value={l.amount || ""} onChange={(e) => update((d) => void (d.investment.lineItems[i].amount = Number(e.target.value)))} />
                <button type="button" className="linkbtn danger small" onClick={() => update((d) => void d.investment.lineItems.splice(i, 1))}>Remove</button>
              </div>
            ))}
            <div className="row">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => update((d) => void d.investment.lineItems.push({ label: "", amount: 0 }))}>+ Add line item</button>
              {c.investment.lineItems.length > 0 && (
                <button type="button" className="linkbtn small" onClick={() => update((d) => void (d.investment.total = lineSum))}>Set total to line items ({money(lineSum)})</button>
              )}
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <label>Package total ($)<input type="number" min={0} step="0.01" value={c.investment.total || ""} onChange={(e) => update((d) => void (d.investment.total = Number(e.target.value)))} /></label>
              <label>Retainer to begin ($) <span className="hint">0 = no retainer option</span><input type="number" min={0} step="0.01" value={c.investment.retainer || ""} onChange={(e) => update((d) => void (d.investment.retainer = Number(e.target.value)))} /></label>
            </div>
            <label>Note under the numbers<input type="text" value={c.investment.note} onChange={(e) => update((d) => void (d.investment.note = e.target.value))} placeholder="Payment plans available. Ask us!" /></label>
          </section>

          {/* ADD-ONS */}
          <section className="panel">
            <div className="row between">
              <h3>Add-ons they can choose</h3>
              <button type="button" className="linkbtn small" onClick={() => update((d) => void (d.addOnIds = d.addOnIds.length ? [] : addons.map((a) => a.id)))}>
                {c.addOnIds.length ? "Clear all" : "Offer all"}
              </button>
            </div>
            <div className="checks">
              {addons.map((s) => (
                <label key={s.id}>
                  <input type="checkbox" checked={c.addOnIds.includes(s.id)} onChange={() => update((d) => void (d.addOnIds = toggleIn(d.addOnIds, s.id)))} />
                  {s.name} <span className="hint">{priceLabel(priceFor(s, c.tier), s.unit)}{!s.active ? " · hidden (inactive)" : ""}</span>
                </label>
              ))}
              {!addons.length && <p className="muted small">No add-ons yet. Create them under Services & add-ons.</p>}
            </div>
          </section>

          {/* LIBRARY */}
          <section className="panel">
            <h3>Library access</h3>
            <p className="small muted">Items marked “everyone” show for all clients. Check the others to give this client access.</p>
            <div className="checks">
              {catalog.library.map((l) => (
                <label key={l.id}>
                  <input
                    type="checkbox"
                    disabled={l.audience === "all"}
                    checked={l.audience === "all" || c.libraryIds.includes(l.id)}
                    onChange={() => update((d) => void (d.libraryIds = toggleIn(d.libraryIds, l.id)))}
                  />
                  {l.title} <span className="hint">{l.kind}{l.audience === "all" ? " · everyone" : ""}{!l.active ? " · hidden" : ""}</span>
                </label>
              ))}
            </div>
          </section>

          {/* NEXT STEPS */}
          <section className="panel">
            <h3>Next steps & booking</h3>
            <label>
              Next steps <span className="hint">One per line</span>
              <textarea style={{ minHeight: 140 }} value={c.nextSteps.join("\n")} onChange={(e) => update((d) => void (d.nextSteps = e.target.value.split("\n")))} />
            </label>
            <div className="checks">
              <label>
                <input type="checkbox" checked={c.showBooking} onChange={() => update((d) => void (d.showBooking = !d.showBooking))} />
                Show the “Book a session” section
              </label>
            </div>
          </section>

          <section className="panel">
            <h3>Private notes</h3>
            <p className="small muted">Only you see these.</p>
            <textarea style={{ minHeight: 140 }} value={c.notes} onChange={(e) => update((d) => void (d.notes = e.target.value))} />
          </section>
        </div>

        {/* SIDE COLUMN */}
        <div className="sticky-col">
          {workspace && (
            <section className="panel">
              <h3>Workspace</h3>
              <div className="stack" style={{ gap: 6 }}>
                <div className="row between small"><strong>Strategy plan</strong><span className="muted">{workspace.plan.enabled ? `${workspace.plan.pct}% done · ${workspace.plan.total} tasks` : "Off"}</span></div>
                {workspace.plan.nextSession && <span className="tiny muted">Next session: {workspace.plan.nextSession}</span>}
                {(workspace.plan.openRequests > 0 || workspace.plan.newComments > 0) && (
                  <strong className="small" style={{ color: "var(--rust)" }}>{workspace.plan.openRequests} change request{workspace.plan.openRequests === 1 ? "" : "s"} · {workspace.plan.newComments} new comment{workspace.plan.newComments === 1 ? "" : "s"} waiting on you</strong>
                )}
                <a className="btn btn-sm btn-dark" href={`/admin/clients/${c.id}/plan`}>{workspace.plan.enabled || workspace.plan.total ? "Open strategy plan" : "Set up strategy plan"}</a>
              </div>
              <div className="stack" style={{ gap: 6, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <div className="row between small"><strong>Wellness assessment</strong><span className="muted">{workspace.assessment?.enabled ? `${ASSESS_LABEL[workspace.assessment.status]} · ${workspace.assessment.responses} responses` : "Off"}</span></div>
                <a className="btn btn-sm btn-ghost" href={`/admin/clients/${c.id}/assessment`}>{workspace.assessment ? "Open assessment" : "Set up assessment"}</a>
              </div>
            </section>
          )}

          <section className="panel">
            <h3>Access</h3>
            <div className="stack" style={{ gap: 6 }}>
              <span className="small muted">Access code</span>
              <div className="codebox">{code || "None set"}</div>
            </div>
            <div className="row">
              <button type="button" className="btn btn-sm btn-dark" onClick={() => copy(invite, "Invite message")} disabled={!code}>Copy invite message</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => copy(code, "Code")} disabled={!code}>Copy code</button>
            </div>
            <details>
              <summary className="small" style={{ cursor: "pointer" }}>Change code</summary>
              <div className="stack" style={{ gap: 8, marginTop: 10 }}>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => newCode(false)}>Generate a new code</button>
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <input type="text" placeholder="Or type your own" value={customCode} onChange={(e) => setCustomCode(e.target.value)} />
                  <button type="button" className="btn btn-sm btn-ghost" disabled={customCode.trim().length < 6} onClick={() => newCode(true)}>Set</button>
                </div>
              </div>
            </details>
            {codeMsg && <p className="ok-text">{codeMsg}</p>}
            <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${c.id}/preview`} target="_blank" rel="noopener noreferrer">
              Preview their portal ↗
            </a>
            <p className="tiny muted">Clients go to your site’s home page and enter their code. Save your changes before previewing.</p>
          </section>

          <section className="panel">
            <h3>Payments</h3>
            <div className="stack" style={{ gap: 2 }}>
              <div className="row between small"><span>Package total</span><strong>{money(c.investment.total)}</strong></div>
              <div className="row between small"><span>Paid toward package</span><strong>{money(paid)}</strong></div>
              <div className="row between small"><span>Balance</span><strong>{money(outstanding(c.investment, paid))}</strong></div>
            </div>
            {c.payments.length > 0 && (
              <ul className="lines small">
                {[...c.payments].reverse().map((p) => (
                  <li key={p.id} style={{ flexDirection: "column", gap: 2 }}>
                    <div className="row between"><strong>{money(p.amount)}</strong><span className="muted">{shortDate(p.date)}</span></div>
                    <span className="muted">{p.description} · {p.method}{p.kind === "addon" ? " · add-on" : ""}</span>
                    <button type="button" className="linkbtn danger tiny" style={{ alignSelf: "flex-start" }} onClick={() => removePayment(p.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <details>
              <summary className="small" style={{ cursor: "pointer" }}>Record a payment made outside Stripe</summary>
              <form onSubmit={addPayment} className="stack" style={{ gap: 8, marginTop: 10 }}>
                <input type="number" min={0.01} step="0.01" placeholder="Amount" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} required />
                <input type="text" placeholder="Description" value={pay.description} onChange={(e) => setPay({ ...pay, description: e.target.value })} />
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} />
                  <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                    {["Invoice", "Zelle", "Cash App", "Check", "Cash", "Other"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <select value={pay.kind} onChange={(e) => setPay({ ...pay, kind: e.target.value })}>
                  <option value="package">Counts toward package balance</option>
                  <option value="addon">Add-on (extra)</option>
                </select>
                <button className="btn btn-sm btn-dark">Add payment</button>
              </form>
            </details>
          </section>

          <section className="panel" id="requests">
            <h3>Requests from client</h3>
            {c.requests.length === 0 && <p className="small muted">No requests yet.</p>}
            {[...c.requests].reverse().map((r) => (
              <div key={r.id} className="stack" style={{ gap: 4, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <div className="row between">
                  <span className={`tag ${r.status === "new" ? "rust" : r.status === "done" ? "green" : ""}`}>{r.status}</span>
                  <span className="tiny muted">{shortDate(r.date)}</span>
                </div>
                <span className="small">{r.addOnIds.map(svcName).join(", ") || "Note only"}</span>
                {r.note && <span className="small muted">“{r.note}”</span>}
                <div className="row">
                  {r.status !== "seen" && <button type="button" className="linkbtn tiny" onClick={() => setRequest(r.id, "seen")}>Mark seen</button>}
                  {r.status !== "done" && <button type="button" className="linkbtn tiny" onClick={() => setRequest(r.id, "done")}>Mark done</button>}
                </div>
              </div>
            ))}
          </section>

          <section className="panel">
            <button type="button" className="linkbtn danger small" onClick={remove}>Delete this client</button>
          </section>
        </div>
      </div>

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>Save changes</button>}
        </div>
      )}
    </>
  );
}
