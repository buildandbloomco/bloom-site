import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import { notFound, redirect } from "next/navigation";
import { currentClient, isAdmin } from "@/lib/auth";
import { amountPaid, getCatalog, getSettings } from "@/lib/data";
import { nowET, longDate } from "@/lib/booking";
import { money } from "@/lib/format";
import { getProposal, saveProposal } from "@/lib/proposals";
import { isExpired, optionTotal } from "@/lib/proposal-def";
import { listAgreements } from "@/lib/agreements";
import PortalTop from "@/components/portal/PortalTop";
import AcceptProposal from "@/components/portal/AcceptProposal";
import PrintButton from "@/components/course/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Proposal", robots: { index: false, follow: false } };

export default async function ProposalView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const p = await getProposal(client.id);
  if (!p || p.status === "draft") notFound();
  const admin = await isAdmin();
  if (p.status === "sent" && !p.viewedAt && !admin) { p.viewedAt = new Date().toISOString(); await saveProposal(client.id, p); }
  const [settings, catalog, agreements] = await Promise.all([getSettings(), getCatalog(), listAgreements(client.id)]);
  const today = nowET().date;
  const expired = isExpired(p, today);
  const accepted = p.status === "accepted";
  const shown = accepted ? p.options.filter((o) => o.id === p.acceptedOptionId) : p.options;
  const many = shown.length > 1;
  const noPay = client.billing === "none";
  const svc = (id: string) => catalog.services.find((s) => s.id === id);
  const toSign = agreements.find((a) => a.status === "sent");
  const signed = agreements.some((a) => a.status === "signed");
  const paid = amountPaid(client);
  const at = p.acceptedAt ? new Date(p.acceptedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/New_York" }) + " Eastern" : "";
  const first = client.contactName || client.name;

  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="proposal" />
      <main className="section" style={{ paddingTop: 48 }}>
        <div className={`wrap stack ${many ? "" : "narrow"}`} style={{ gap: 24 }}>
          <div className="row between" style={{ gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <p className="eyebrow">{accepted ? "Accepted proposal" : `Proposal for ${client.name}`}</p>
              <h2>{accepted ? shown[0]?.name : many ? "Choose how we work together" : shown[0]?.name}</h2>
              <p className="muted" style={{ margin: 0 }}>Prepared by {settings.brandName}{p.sentAt ? ` · ${longDate(p.sentAt.slice(0, 10))}` : ""}{!accepted && p.expires ? ` · Good through ${longDate(p.expires)}` : ""}</p>
            </div>
            <span className="no-print"><PrintButton /></span>
          </div>

          {expired && <div className="banner warn" style={{ margin: 0 }}>This proposal expired on {longDate(p.expires)}. Reach out{settings.email ? ` at ${settings.email}` : ""} and we will send you an updated one.</div>}

          {accepted && (
            <div className="card stack" style={{ gap: 14 }}>
              <div className="stack" style={{ gap: 4 }}>
                <h3 style={{ margin: 0 }}>Thank you, {first.split(" ")[0]}. Here is what happens next.</h3>
                <span className="small muted">Accepted by {p.acceptedName}{p.acceptedTitle ? `, ${p.acceptedTitle}` : ""} on {at}</span>
              </div>
              <ol className="prop-steps">
                <li className="done"><strong>Accept your proposal</strong><span>Done</span></li>
                {(toSign || signed) && <li className={toSign ? "now" : "done"}><strong>Sign your agreement</strong>{toSign ? <a className="btn btn-sm btn-primary no-print" href={`/p/${slug}/agreements/${toSign.id}`}>Read and sign</a> : <span>Done</span>}</li>}
                {!noPay && client.investment.total > 0 && (() => {
                  const need = client.investment.retainer || client.investment.total;
                  const ok = paid >= need;
                  return <li className={ok ? "done" : toSign ? "" : "now"}><strong>{client.investment.retainer ? `Pay your ${money(client.investment.retainer)} retainer` : "Make your first payment"}</strong>{ok ? <span>Done</span> : <a className={`btn btn-sm no-print ${toSign ? "btn-ghost" : "btn-primary"}`} href={`/p/${slug}#pay`}>Go to payment</a>}</li>;
                })()}
                <li><strong>Kickoff</strong><span>We will reach out to schedule it{client.showBooking ? <>, or <a href={`/p/${slug}#book`}>book a time now</a></> : ""}.</span></li>
              </ol>
            </div>
          )}

          {p.intro.trim() && <div className="card"><p style={{ margin: 0, whiteSpace: "pre-line" }}>{p.intro}</p></div>}

          <div className={many ? "prop-grid" : "stack"} style={many ? { gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` } : undefined}>
            {shown.map((o) => {
              const total = optionTotal(o);
              return (
                <article key={o.id} className={`card prop-opt ${o.recommended && many ? "rec" : ""}`}>
                  {o.recommended && many && <span className="tag gold" style={{ alignSelf: "flex-start" }}>Recommended</span>}
                  {many && <h3 style={{ margin: 0 }}>{o.name}</h3>}
                  {o.summary && <p className="muted" style={{ margin: 0 }}>{o.summary}</p>}
                  {!noPay && <div><span className="big-number" style={{ fontSize: "2.1rem", color: "var(--rust)" }}>{money(total)}</span>{o.retainer > 0 && <div className="small muted">{money(o.retainer)} retainer to begin</div>}</div>}
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 600 }}>What is included</span>
                    <ul className="prop-list">
                      {o.serviceIds.map((id) => svc(id)).filter(Boolean).map((s) => <li key={s!.id}><strong>{s!.name}</strong>{!many && s!.description ? <span className="small muted"> {s!.description}</span> : null}</li>)}
                      {o.customItems.map((i, k) => <li key={`c${k}`}><strong>{i.title}</strong>{i.detail ? <span className="small muted"> {i.detail}</span> : null}</li>)}
                    </ul>
                  </div>
                  {!noPay && o.lineItems.length > 1 && (
                    <ul className="lines small" style={{ marginTop: "auto" }}>
                      {o.lineItems.map((l, k) => <li key={k}><span>{l.label}</span><strong>{money(l.amount)}</strong></li>)}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>

          {client.investment.note && !noPay && <p className="small muted" style={{ margin: 0 }}>{client.investment.note}</p>}

          {!accepted && !expired && (admin
            ? <div className="banner warn" style={{ margin: 0 }}>You are previewing this as the admin. The client will see a place to choose an option, type their name, and accept here.</div>
            : <AcceptProposal options={p.options.map((o) => ({ id: o.id, name: o.name, total: optionTotal(o) }))} preselect={p.options.length === 1 ? p.options[0].id : p.options.find((o) => o.recommended)?.id ?? ""} />)}
        </div>
      </main>
    </>
  );
}
