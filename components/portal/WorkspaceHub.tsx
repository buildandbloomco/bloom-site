import Link from "next/link";
import type { StrategyPlan } from "@/lib/plan-types";
import type { Assessment } from "@/lib/assessment-types";
import { PlanProgress } from "./WorkspaceBits";
import { longDate, fmtTime } from "@/lib/booking";

const ASSESS: Record<Assessment["status"], { label: string; next: string }> = {
  leader: { label: "Step 1 of 4", next: "Fill out your leader questionnaire and send your team the survey link." },
  team: { label: "Step 2 of 4", next: "Your team survey is open. Share the link so everyone can weigh in." },
  review: { label: "Step 3 of 4", next: "We're reviewing your results. They'll show up here before we meet." },
  shared: { label: "Complete", next: "Your results and recommendations are ready." },
};

/** The top-of-portal summary: what's next on the plan and where the assessment stands */
export default function WorkspaceHub({ slug, plan, assessment, today }: { slug: string; plan: StrategyPlan | null; assessment: Assessment | null; today: string }) {
  const showPlan = !!plan?.enabled;
  const showAssess = !!assessment?.enabled;
  if (!showPlan && !showAssess) return null;
  const next = plan?.sessions.filter((s) => s.status !== "done").sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))[0];
  const mine = (plan?.tasks ?? []).filter((t) => t.owner === "client" && t.status !== "done")
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3);
  const replies = (plan?.requests ?? []).filter((r) => r.status === "resolved" && r.reply).length;
  return (
    <section className="section" id="workspace" style={{ paddingBottom: 0 }}>
      <div className="wrap stack" style={{ gap: 20 }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <p className="eyebrow">Your workspace</p>
          <h2>What we&rsquo;re working on together</h2>
        </div>
        <div className={showPlan && showAssess ? "ws-hub" : "stack"} style={{ gap: 20 }}>
          {showPlan && plan && (
            <div className="ws-card">
              <div className="row between" style={{ gap: 8 }}>
                <span className="eyebrow">{plan.title || "Strategy plan"}</span>
                {plan.requests.some((r) => r.status === "open") && <span className="tag">Change request pending</span>}
              </div>
              <PlanProgress tasks={plan.tasks} />
              {next && (
                <div className="stack" style={{ gap: 2 }}>
                  <span className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>Next session</span>
                  <strong>{next.title}</strong>
                  <span className="small muted">{next.date ? `${longDate(next.date)}${next.start ? ` · ${fmtTime(next.start)}` : ""}` : "Date to be set"}</span>
                </div>
              )}
              <div className="stack" style={{ gap: 6 }}>
                <span className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>Your next tasks</span>
                {mine.length ? (
                  <ul className="stack" style={{ gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
                    {mine.map((t) => (
                      <li key={t.id} className="row between" style={{ gap: 8, flexWrap: "nowrap" }}>
                        <span>{t.status === "doing" ? "◐ " : "○ "}{t.title}</span>
                        {t.due && <span className={`small ${t.due < today ? "error-text" : "muted"}`} style={{ whiteSpace: "nowrap" }}>{t.due < today ? "Past due" : `Due ${t.due.slice(5).replace("-", "/")}`}</span>}
                      </li>
                    ))}
                  </ul>
                ) : <span className="small muted">You&rsquo;re all caught up.</span>}
              </div>
              {replies > 0 && <span className="small muted">{replies} of your requests have a reply.</span>}
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {next && <Link className="btn btn-primary" href={`/p/${slug}/room/${next.id}`}>Open the strategy room</Link>}
                <Link className={`btn ${next ? "btn-ghost" : "btn-primary"}`} href={`/p/${slug}/plan`}>Open your strategy plan</Link>
              </div>
            </div>
          )}
          {showAssess && assessment && (
            <div className="ws-card">
              <div className="row between" style={{ gap: 8 }}>
                <span className="eyebrow">Wellness assessment</span>
                <span className={`tag ${assessment.status === "shared" ? "green" : ""}`}>{ASSESS[assessment.status].label}</span>
              </div>
              <ol className="ws-steps">
                {(["leader", "team", "review", "shared"] as const).map((s, i) => {
                  const cur = ["leader", "team", "review", "shared"].indexOf(assessment.status);
                  const labels = ["Your questionnaire", "Team survey", "Our review", "Results together"];
                  return <li key={s} className={i < cur || assessment.status === "shared" ? "ok" : i === cur ? "now" : ""}><span>{labels[i]}</span></li>;
                })}
              </ol>
              <p className="small" style={{ margin: 0 }}>{ASSESS[assessment.status].next}</p>
              <Link className={`btn ${showPlan ? "btn-dark" : "btn-primary"}`} style={{ alignSelf: "flex-start" }} href={`/p/${slug}/assessment`}>
                {assessment.status === "shared" ? "See your results" : assessment.status === "review" ? "View assessment" : "Continue the assessment"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
