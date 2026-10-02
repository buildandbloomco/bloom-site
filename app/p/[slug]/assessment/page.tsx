import "@/components/portal-nav.css";
import "@/components/portal/workspace.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentClient } from "@/lib/auth";
import { getCatalog, getSettings } from "@/lib/data";
import { siteOrigin } from "@/lib/http";
import { buildResults, getAssessment, getPlan, listResponses } from "@/lib/workspace";
import { listPieces } from "@/lib/library";
import { DOMAINS, OPS_FIELDS, PRIORITIES } from "@/lib/assessment-def";
import PortalTop from "@/components/portal/PortalTop";
import LeaderForm from "@/components/portal/LeaderForm";
import CopyLink from "@/components/portal/CopyLink";
import { Comments, ResultsChart } from "@/components/portal/WorkspaceBits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizational Wellness Assessment", robots: { index: false, follow: false } };

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await currentClient();
  if (!client || client.slug !== slug || client.status === "archived") redirect("/portal");
  const [a, settings, origin] = await Promise.all([getAssessment(client.id), getSettings(), siteOrigin()]);
  const head = (
    <div className="section-head" style={{ marginBottom: 0 }}>
      <p className="eyebrow">Organizational Wellness Assessment</p>
      <h2>Where your operations support your people, and where they wear them down</h2>
    </div>
  );
  if (!a || !a.enabled) {
    return (
      <>
        <PortalTop slug={slug} brand={settings.brandName} title="assessment" />
        <main className="section" style={{ paddingTop: 48 }}><div className="wrap stack" style={{ gap: 24 }}>{head}
          <div className="card"><p style={{ margin: 0 }}>Your assessment isn&rsquo;t open yet. Once we start, you&rsquo;ll fill out a short leader questionnaire here and get an anonymous survey link for your team.</p></div>
        </div></main>
      </>
    );
  }
  const responses = await listResponses(client.id);
  const shared = a.status === "shared";
  const locked = a.status === "review" || a.status === "shared";
  const link = `${origin}/assess/${a.token}`;
  const stepIdx = shared ? 4 : a.status === "review" ? 3 : a.leaderSubmittedAt ? 2 : 1;
  let resultsBlock = null;
  if (shared) {
    const data = buildResults(a, responses, a.shareComments);
    const scored = data.team.filter((d) => d.score !== null).sort((x, y) => (x.score! - y.score!));
    const focus = scored.slice(0, 2);
    const strengths = [...scored].reverse().slice(0, 2);
    const [catalog, pieces, plan] = await Promise.all([getCatalog(), listPieces(), getPlan(client.id)]);
    const suggestions = focus.map((f) => {
      const d = DOMAINS.find((x) => x.id === f.id)!;
      return {
        d,
        services: d.helps.services.map((id) => catalog.services.find((s) => s.id === id && s.active)).filter(Boolean) as typeof catalog.services,
        pieces: d.helps.wellness ? pieces.filter((p) => p.status === "published" && p.type === d.helps.wellness).slice(0, 2) : [],
      };
    });
    resultsBlock = (
      <div className="stack" style={{ gap: 24 }}>
        <div className="ws-hub">
          <div className="ws-card"><span className="eyebrow">Strengths to protect</span>{strengths.map((s) => <div key={s.id}><strong>{s.name}</strong> <span className="muted">· {s.score}</span></div>)}</div>
          <div className="ws-card"><span className="eyebrow">Where to focus first</span>{focus.map((s) => <div key={s.id}><strong>{s.name}</strong> <span className="muted">· {s.score}</span></div>)}</div>
        </div>
        <div className="ws-card"><span className="eyebrow">Your results</span><ResultsChart data={data} showRoles={false} /></div>
        {OPS_FIELDS.some((f) => a.profile[f.key]) && (
          <details className="ws-card">
            <summary className="eyebrow" style={{ cursor: "pointer" }}>Operations snapshot you shared</summary>
            <dl style={{ margin: "12px 0 0", display: "grid", gap: 10 }}>
              {OPS_FIELDS.filter((f) => a.profile[f.key]).map((f) => (
                <div key={f.key}><dt className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>{f.label}</dt><dd style={{ margin: 0, whiteSpace: "pre-line" }}>{a.profile[f.key]}</dd></div>
              ))}
            </dl>
          </details>
        )}
        {a.summary && <div className="ws-card"><span className="eyebrow">What we found</span><p style={{ margin: 0, whiteSpace: "pre-line" }}>{a.summary}</p></div>}
        {a.recommendations.length > 0 && (
          <div className="ws-card">
            <span className="eyebrow">Your prioritized action plan</span>
            <ol className="ws-steps">
              {a.recommendations.map((r) => {
                const task = plan.tasks.find((t) => t.id === r.taskId);
                const pr = PRIORITIES.find((x) => x.id === r.priority) ?? PRIORITIES[1];
                const area = DOMAINS.find((d) => d.id === r.domain);
                return (
                  <li key={r.id} className={task?.status === "done" ? "ok" : ""}>
                    <div className="stack" style={{ gap: 2 }}>
                      <span className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <span className={`tag ${pr.id === "now" ? "rust" : pr.id === "next" ? "gold" : ""}`} style={{ fontSize: "0.66rem", padding: "3px 8px" }}>{pr.label} · {pr.hint}</span>
                        {area && <span className="tiny muted">{area.name}</span>}
                      </span>
                      <strong>{r.title}</strong>
                      {r.detail && <span className="small" style={{ whiteSpace: "pre-line" }}>{r.detail}</span>}
                      {task && <Link className="small" href={`/p/${slug}/plan`}>On your plan · {task.status === "done" ? "Done" : task.owner === "client" ? "Your task" : "Build & Bloom's task"}</Link>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {suggestions.some((s) => s.services.length || s.pieces.length) && (
          <div className="ws-card">
            <span className="eyebrow">Support that fits these results</span>
            {suggestions.map(({ d, services, pieces }) => (services.length || pieces.length) ? (
              <div key={d.id} className="stack" style={{ gap: 6 }}>
                <strong>For {d.name.toLowerCase()}</strong>
                <div className="pl-resources">
                  {services.map((s) => <Link key={s.id} className="pl-link" href={`/p/${slug}#package`}><span className="tiny muted" style={{ fontWeight: 400 }}>Service</span> {s.name}</Link>)}
                  {pieces.map((p) => <a key={p.id} className="pl-link" href={`/library/${p.slug}`}><span className="tiny muted" style={{ fontWeight: 400 }}>Wellness Library</span> {p.title}</a>)}
                </div>
              </div>
            ) : null)}
          </div>
        )}
        {a.shareComments && <div className="ws-card"><span className="eyebrow">In your team&rsquo;s words</span><Comments comments={data.comments} /></div>}
      </div>
    );
  }
  return (
    <>
      <PortalTop slug={slug} brand={settings.brandName} title="assessment" />
      <main className="section" style={{ paddingTop: 48 }}>
        <div className="wrap stack" style={{ gap: 28 }}>
          {head}
          <div className="ws-hub">
            <div className="ws-card">
              <span className="eyebrow">How it works</span>
              <ol className="ws-steps">
                <li className={stepIdx > 1 ? "ok" : "now"}><span><strong>You</strong> answer the leader questionnaire and operations snapshot (about 20 minutes).</span></li>
                <li className={stepIdx > 2 ? "ok" : stepIdx === 2 ? "now" : ""}><span><strong>Your team</strong> answers an anonymous survey (about 8 minutes).</span></li>
                <li className={stepIdx > 3 ? "ok" : stepIdx === 3 ? "now" : ""}><span><strong>We</strong> review the results and prepare findings.</span></li>
                <li className={stepIdx === 4 ? "ok" : ""}><span><strong>Together</strong> we walk through results and add priorities to your strategy plan.</span></li>
              </ol>
            </div>
            <div className="ws-card">
              <span className="eyebrow">Anonymous team survey</span>
              {locked ? (
                <p style={{ margin: 0 }}>The survey is closed. <strong>{responses.length}</strong> team member{responses.length === 1 ? "" : "s"} responded.</p>
              ) : (
                <>
                  <p className="small" style={{ margin: 0 }}>Send this link to everyone on your team. No names or emails are collected. Results only show as group averages.</p>
                  <CopyLink url={link} label="Copy survey link" />
                  <p className="small" style={{ margin: 0 }}><strong>{responses.length}</strong> response{responses.length === 1 ? "" : "s"} so far{a.closesOn ? ` · closes ${a.closesOn}` : ""}</p>
                </>
              )}
            </div>
          </div>
          {shared ? resultsBlock : (
            <>
              {a.status === "review" && <div className="card"><p style={{ margin: 0 }}>Thank you. We&rsquo;re reviewing the results now. They&rsquo;ll appear right here, along with our findings, before we meet.</p></div>}
              <LeaderForm initial={a} locked={locked} />
            </>
          )}
          <p className="tiny muted" style={{ margin: 0 }}>This assessment is a structured review tool to guide planning. It isn&rsquo;t a clinical or diagnostic instrument.</p>
        </div>
      </main>
    </>
  );
}
