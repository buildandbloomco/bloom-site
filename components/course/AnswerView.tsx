import type { Prompt } from "@/lib/course-types";

/** Read-only view of a workbook question and the learner's answer (also used for printing) */
export default function AnswerView({ p, value, blankLines = 3 }: { p: Prompt; value: unknown; blankLines?: number }) {
  const text = typeof value === "string" ? value : "";
  if (p.type === "table") {
    const grid = Array.isArray(value) ? (value as string[][]) : [];
    const rowLabels = p.rows.length ? p.rows : Array.from({ length: p.blankRows || 3 }, () => "");
    const labelCol = p.rows.length > 0;
    const cols = labelCol ? p.columns.slice(1) : p.columns;
    return (
      <div className="stack" style={{ gap: 6 }}>
        <p className="q-label">{p.label}</p>
        {p.help && <p className="q-help">{p.help}</p>}
        <div className="table-wrap">
          <table className="wb-table">
            <thead><tr>{labelCol && <th>{p.columns[0] || ""}</th>}{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>
              {rowLabels.map((r, ri) => (
                <tr key={ri}>
                  {labelCol && <th scope="row">{r}</th>}
                  {cols.map((_, ci) => <td key={ci}>{grid[ri]?.[ci] ?? ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (p.type === "checklist") {
    const checked = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="stack" style={{ gap: 6 }}>
        <p className="q-label">{p.label}</p>
        <ul className="wb-checks">
          {p.options.map((o) => <li key={o}><span aria-hidden="true">{checked.includes(o) ? "☑" : "☐"}</span> {o}</li>)}
        </ul>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 6 }}>
      {p.help && p.help.startsWith("Journal") && <p className="eyebrow">{p.help}</p>}
      <p className="q-label">{p.type === "scale" ? `${p.label} (1 to 10)` : p.label}</p>
      {p.help && !p.help.startsWith("Journal") && <p className="q-help">{p.help}</p>}
      {text ? <p className="wb-answer">{text}</p> : <div className="wb-lines" style={{ height: (p.type === "short" || p.type === "scale" ? 1 : blankLines) * 30 }} />}
    </div>
  );
}
