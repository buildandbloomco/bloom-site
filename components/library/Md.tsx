import { Fragment, type ReactNode } from "react";

/** **bold** and *italic* inside a line */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(t.startsWith("**") ? <strong key={k++}>{t.slice(2, -2)}</strong> : <em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/**
 * Small formatter for library pieces:
 * ## heading, ### subheading, - bullets, 1. steps, > quote, | tables |, **bold**, *italic*.
 * Blank lines separate paragraphs.
 */
export default function Md({ text, strip }: { text: string; strip?: RegExp }) {
  const src = strip ? text.replace(strip, "").replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ") : text;
  const lines = src.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const l = lines[i].trim();
    if (!l) { i++; continue; }
    if (/^###\s/.test(l)) { blocks.push(<h4 key={k++} className="md-h4">{inline(l.replace(/^###\s+/, ""))}</h4>); i++; continue; }
    if (/^##\s/.test(l)) { blocks.push(<h3 key={k++} className="md-h3">{inline(l.replace(/^##\s+/, ""))}</h3>); i++; continue; }
    if (l.startsWith("|")) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].trim()); i++; }
      const body = rows.filter((r) => !/^\|\s*:?-{2,}/.test(r));
      const [head, ...rest] = body;
      blocks.push(
        <div key={k++} className="table-wrap">
          <table className="table md-table">
            <thead><tr>{cells(head).map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
            <tbody>{rest.map((r, ri) => <tr key={ri}>{cells(r).map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (/^[-•]\s/.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-•]\s+/, "")); i++; }
      blocks.push(<ul key={k++} className="md-list">{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(l)) {
      const items: string[] = [];
      const start = Number(l.match(/^(\d+)/)?.[1] ?? 1);
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, "")); i++; }
      blocks.push(<ol key={k++} className="md-list" start={start}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>);
      continue;
    }
    if (l.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      blocks.push(<blockquote key={k++} className="md-quote">{inline(q.join(" "))}</blockquote>);
      continue;
    }
    const para: string[] = [l];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(##|[-•]\s|\d+\.\s|>|\|)/.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
    blocks.push(<p key={k++}>{para.map((p, j) => <Fragment key={j}>{j > 0 && <br />}{inline(p)}</Fragment>)}</p>);
  }
  return <div className="md">{blocks}</div>;
}
