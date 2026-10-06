import type { ReviewData } from "@/lib/reviews";
import ScoreTrend from "@/components/ScoreTrend";
import { shortDate } from "@/lib/format";

const who = (o: string, brand: string) => (o === "us" ? brand : "You");

/** The progress review itself. Shown to you in admin and, once shared, to the client. */
export default function ReviewReport({ data, from, to, summary, next, clientName, brand, forClient }: { data: ReviewData; from: string; to: string; summary: string; next: string; clientName: string; brand: string; forClient: boolean }) {
  const held = data.sessions.filter((s) => s.held).length;
  const owner = (o: string) => (forClient ? who(o, brand) : o === "us" ? "You" : "Client");
  const List = ({ items, empty }: { items: string[]; empty: string }) => (items.length ? <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul> : <p className="small muted" style={{ margin: 0 }}>{empty}</p>);
  return (
    <div className="review stack" style={{ gap: 22 }}>
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">Progress review</p>
        <h2 style={{ margin: 0 }}>{clientName}</h2>
        <span className="muted">{shortDate(from)} to {shortDate(to)} · Prepared by {brand}</span>
      </div>
      {summary.trim() && <section className="card"><h3>Where things stand</h3><p style={{ margin: 0, whiteSpace: "pre-line" }}>{summary}</p></section>}
      <div className="review-stats">
        <div><span className="n">{data.sessions.length}</span><span className="small">sessions{held !== data.sessions.length ? ` (${held} completed)` : ""}</span></div>
        <div><span className="n">{data.done.length}</span><span className="small">tasks completed</span></div>
        <div><span className="n">{data.decisions.length}</span><span className="small">decisions made</span></div>
        <div><span className="n">{data.open.length}</span><span className="small">tasks still open</span></div>
      </div>
      {data.scores.length > 0 && <section className="card"><h3>The numbers</h3><ScoreTrend series={data.scores} /></section>}
      <section className="card"><h3>Wins</h3><List items={data.wins} empty="No wins were written down in this period." /></section>
      <section className="card"><h3>Decisions we made</h3><List items={data.decisions} empty="No decisions were recorded in this period." /></section>
      {data.chosen.length > 0 && <section className="card"><h3>Ideas we chose to pursue</h3><List items={data.chosen} empty="" /></section>}
      <section className="card"><h3>What got done</h3>
        {data.done.length ? <ul>{data.done.map((t) => <li key={t.id}>{t.title} <span className="tiny muted">({owner(t.owner)})</span></li>)}</ul> : <p className="small muted" style={{ margin: 0 }}>No tasks were marked completed in this period.</p>}
        {!forClient && data.untracked > 0 && <p className="tiny muted no-print" style={{ margin: "8px 0 0" }}>{data.untracked} older completed {data.untracked === 1 ? "task has" : "tasks have"} no completion date (finished before dates were tracked), so {data.untracked === 1 ? "it is" : "they are"} not counted here.</p>}
      </section>
      <section className="card"><h3>Still open</h3>
        {data.open.length ? <ul>{data.open.map((t) => <li key={t.id}>{t.title} <span className="tiny muted">({owner(t.owner)}{t.status === "doing" ? ", in progress" : ""}{t.due ? `, due ${shortDate(t.due)}` : ""})</span></li>)}</ul> : <p className="small muted" style={{ margin: 0 }}>Nothing open. Everything on the plan is complete.</p>}
      </section>
      <section className="card"><h3>Sessions in this period</h3>
        {data.sessions.length ? <ul>{data.sessions.map((s) => <li key={s.id}><strong>{shortDate(s.date)}</strong>: {s.title}{s.goal ? `. ${s.goal}` : ""}</li>)}</ul> : <p className="small muted" style={{ margin: 0 }}>No sessions fall in these dates.</p>}
      </section>
      {next.trim() && <section className="card"><h3>What comes next</h3><p style={{ margin: 0, whiteSpace: "pre-line" }}>{next}</p></section>}
    </div>
  );
}
