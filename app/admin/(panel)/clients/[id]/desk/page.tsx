import { notFound } from "next/navigation";
import Link from "next/link";
import { amountPaid, getCatalog, getClient } from "@/lib/data";
import { decryptCode } from "@/lib/crypto";
import { getCourse, listAppointments, listEnrollments } from "@/lib/courses";
import { courseProgress } from "@/lib/course-logic";
import { getAssessment, getPlan, listResponses } from "@/lib/workspace";
import { getAccess } from "@/lib/library";
import { nowET, fmtTime } from "@/lib/booking";
import { money, shortDate } from "@/lib/format";
import { outstanding } from "@/lib/pricing";
import { tierLabel } from "@/lib/tier";
import SessionDesk from "@/components/admin/SessionDesk";
import { emailReady } from "@/lib/invite";
import { siteOrigin } from "@/lib/http";
import SharedFiles from "@/components/SharedFiles";
import ScoreTrend from "@/components/ScoreTrend";
import { listAgreements } from "@/lib/agreements";
import { listFiles } from "@/lib/files";
import { scorecardHistory } from "@/lib/room";
import PrivateNotes from "@/components/admin/PrivateNotes";

export const dynamic = "force-dynamic";

const ASSESS: Record<string, string> = { leader: "Leader questionnaire", team: "Team survey open", review: "In review", shared: "Results shared" };

/** Everything about one client on one page, for when you sit down to meet with them */
export default async function ClientDesk({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const today = nowET().date;
  const [plan, catalog, assessment, responses, enrollments, appts, lib] = await Promise.all([
    getPlan(id), getCatalog(), getAssessment(id), listResponses(id), listEnrollments({ clientId: id }), listAppointments(), getAccess(id),
  ]);
  const [agreements, files, scores] = await Promise.all([listAgreements(id), listFiles(id), scorecardHistory(id)]);
  const courses = (await Promise.all(enrollments.map(async (e) => ({ e, c: await getCourse(e.courseId) })))).filter((x) => x.c);
  const upcoming = appts.filter((a) => a.clientId === id && a.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 3);
  const openReqs = plan.requests.filter((r) => r.status === "open");
  const clientComments = plan.tasks.filter((t) => t.comments.length && t.comments[t.comments.length - 1].by === "client");
  const addOnReqs = client.requests.filter((r) => r.status === "new");
  const consult = client.consults[0];
  const paid = amountPaid(client);
  const noPay = client.billing === "none";
  const code = client.codeEnc ? decryptCode(client.codeEnc) : "";
  const services = client.package.serviceIds.map((sid) => catalog.services.find((s) => s.id === sid)?.name).filter(Boolean);
  const work = client.deliverables.filter((d) => d.status !== "final");
  const milestones = client.milestones.filter((m) => !m.done);
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="row between small" style={{ gap: 12, alignItems: "baseline" }}><span className="muted">{k}</span><span style={{ textAlign: "right" }}>{v}</span></div>;

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Link href="/admin" className="small">&larr; All clients</Link>
      <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="stack" style={{ gap: 4 }}>
          <p className="eyebrow">Meeting view</p>
          <h2 style={{ margin: 0 }}>{client.name}</h2>
          <span className="small muted">{[client.contactName, client.email, tierLabel(client.tier), client.status].filter(Boolean).join(" · ")}</span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <a className="btn btn-sm btn-ghost" href={`/api/admin/clients/${id}/preview`} target="_blank" rel="noreferrer">Their portal &#8599;</a>
          <Link className="btn btn-sm btn-ghost" href={`/admin/clients/${id}/review`}>Progress review</Link>
          <Link className="btn btn-sm btn-ghost" href={`/admin/clients/${id}`}>Edit client page</Link>
        </div>
      </div>

      <div className="editor-grid">
        <SessionDesk clientId={id} slug={client.slug} initial={plan} today={today} clientEmail={client.email} firstName={client.contactName} emailReady={emailReady()} origin={await siteOrigin()} />

        <aside className="stack" style={{ gap: 16 }}>
          {(openReqs.length > 0 || clientComments.length > 0 || addOnReqs.length > 0) && (
            <section className="panel" style={{ borderTopColor: "var(--rust)" }}>
              <h3>Waiting on you</h3>
              {openReqs.map((r) => <div key={r.id} className="small"><strong>Change request:</strong> {r.targetLabel || "The plan"}<br /><span className="muted">{r.text}</span></div>)}
              {clientComments.map((t) => <div key={t.id} className="small"><strong>Comment on:</strong> {t.title}<br /><span className="muted">{t.comments[t.comments.length - 1].text}</span></div>)}
              {addOnReqs.map((r) => <div key={r.id} className="small"><strong>Add-on request:</strong> <span className="muted">{r.note || "See client page"}</span></div>)}
              <Link className="small" href={`/admin/clients/${id}/plan`}>Reply in the plan editor</Link>
            </section>
          )}

          <section className="panel">
            <h3>At a glance</h3>
            <Row k="Portal code" v={<code>{code || "None set"}</code>} />
            <Row k="Last opened portal" v={client.lastViewedAt ? shortDate(client.lastViewedAt) : "Not yet"} />
            <Row k="Package" v={client.package.title || "Not set"} />
            {services.length > 0 && <Row k="Services" v={services.join(", ")} />}
            {noPay ? <Row k="Payment" v="No payment needed" /> : (
              <>
                <Row k="Total" v={money(client.investment.total)} />
                <Row k="Paid" v={money(paid)} />
                <Row k="Balance" v={<strong>{money(outstanding(client.investment, paid))}</strong>} />
              </>
            )}
            {lib?.status === "active" && <Row k="Wellness Library" v="Member" />}
          </section>

          {scores.length > 0 && (
            <section className="panel">
              <h3>Scorecard over time</h3>
              <ScoreTrend series={scores} compact />
            </section>
          )}

          <section className="panel" style={agreements.some((a) => a.status === "sent") ? { borderTopColor: "var(--gold)" } : undefined}>
            <h3>Agreements</h3>
            {agreements.length === 0 && <p className="small muted" style={{ margin: 0 }}>None yet.</p>}
            {agreements.map((a) => <Row key={a.id} k={a.title} v={a.status === "signed" ? `Signed ${shortDate(a.signedAt ?? "")}` : a.status === "sent" ? "Waiting for signature" : "Draft"} />)}
            <Link className="small" href={`/admin/clients/${id}/agreements`}>{agreements.length ? "Open agreements" : "Create an agreement"}</Link>
          </section>

          <section className="panel">
            <h3>Shared files</h3>
            <SharedFiles initial={files} as="us" clientId={id} />
          </section>

          {upcoming.length > 0 && (
            <section className="panel">
              <h3>On the calendar</h3>
              {upcoming.map((a) => <Row key={a.id} k={`${shortDate(a.date)}${a.start ? `, ${fmtTime(a.start)}` : ""}`} v={a.title} />)}
              <Link className="small" href="/admin/calendar">Open calendar</Link>
            </section>
          )}

          <section className="panel">
            <h3>Wellness assessment</h3>
            {assessment?.enabled ? (
              <>
                <Row k="Stage" v={ASSESS[assessment.status]} />
                <Row k="Team responses" v={responses.length} />
                <Row k="Leader" v={assessment.leaderSubmittedAt ? "Submitted" : "Not submitted"} />
              </>
            ) : <p className="small muted" style={{ margin: 0 }}>Not started.</p>}
            <Link className="small" href={`/admin/clients/${id}/assessment`}>{assessment ? "Open assessment" : "Set up assessment"}</Link>
          </section>

          {courses.length > 0 && (
            <section className="panel">
              <h3>Courses and workbooks</h3>
              {courses.map(({ e, c }) => {
                const pr = courseProgress(c!, e);
                return <Row key={e.id} k={c!.title} v={<Link href={`/admin/courses/${c!.id}/learners/${e.id}`}>{pr.percent}% · answers</Link>} />;
              })}
            </section>
          )}

          {(work.length > 0 || milestones.length > 0) && (
            <section className="panel">
              <h3>Work in progress</h3>
              {milestones.map((m) => <Row key={m.id} k={m.title} v={m.due ? `Due ${shortDate(m.due)}` : "Milestone"} />)}
              {work.map((d) => <Row key={d.id} k={d.title} v={d.status === "review" ? "In review" : "In progress"} />)}
            </section>
          )}

          {consult && (
            <section className="panel">
              <h3>From the last consult</h3>
              <span className="tiny muted">{consult.type} · {shortDate(consult.date)}</span>
              {consult.goals && <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}><strong>Goals:</strong> {consult.goals}</p>}
              {consult.challenges && <p className="small" style={{ margin: 0, whiteSpace: "pre-line" }}><strong>Challenges:</strong> {consult.challenges}</p>}
              <Link className="small" href={`/admin/clients/${id}/consult/${consult.id}`}>Open the sheet</Link>
            </section>
          )}

          <section className="panel">
            <h3>Private notes</h3>
            <PrivateNotes clientId={id} initial={client.notes} />
          </section>
          <a className="small" href={`/api/admin/export?client=${id}`}>Download a backup of this client</a>
        </aside>
      </div>
    </div>
  );
}
