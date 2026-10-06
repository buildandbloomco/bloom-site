import type { ScoreSeries } from "@/lib/room";
import { shortDate } from "@/lib/format";

/** How each scorecard number has moved from session to session */
export default function ScoreTrend({ series, compact = false }: { series: ScoreSeries[]; compact?: boolean }) {
  if (!series.length) return null;
  const W = compact ? 120 : 200, H = 44, P = 6;
  return (
    <div className={compact ? "trend compact" : "trend"}>
      {series.map((s) => {
        const vals = s.points.map((p) => p.value);
        const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
        const n = s.points.length;
        const xy = s.points.map((p, i) => [n === 1 ? W / 2 : P + (i * (W - 2 * P)) / (n - 1), max === min ? H / 2 : H - P - ((p.value - min) / span) * (H - 2 * P)] as const);
        const first = s.points[0], last = s.points[n - 1];
        const diff = last.value - first.value;
        const summary = n === 1 ? `${s.name}: ${last.raw} on ${shortDate(last.date)}` : `${s.name}: from ${first.raw} on ${shortDate(first.date)} to ${last.raw} on ${shortDate(last.date)}`;
        return (
          <div className="trend-row" key={s.name}>
            <div className="stack" style={{ gap: 2, minWidth: 0 }}>
              <strong className="small">{s.name}</strong>
              <span className="tiny muted">{n === 1 ? `One reading so far, ${shortDate(last.date)}` : `${n} sessions, since ${shortDate(first.date)}`}</span>
            </div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
              {n > 1 && <polyline points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="var(--mocha)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
              {xy.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i === n - 1 ? 4 : 2.5} fill={i === n - 1 ? "var(--rust)" : "var(--mocha)"}>
                  <title>{`${shortDate(s.points[i].date)}: ${s.points[i].raw}`}</title>
                </circle>
              ))}
            </svg>
            <div className="stack" style={{ gap: 0, textAlign: "right" }}>
              <strong>{last.raw}</strong>
              <span className="tiny muted">{n === 1 ? "now" : diff === 0 ? `no change from ${first.raw}` : `${diff > 0 ? "up" : "down"} from ${first.raw}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
