/** Paragraphs separated by blank lines; lines starting with • or - become bullet lists */
export default function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="stack" style={{ gap: 12 }}>
      {blocks.map((b, i) => {
        const ls = b.split("\n").map((l) => l.trim()).filter(Boolean);
        if (ls.every((l) => /^[•\-]\s*/.test(l))) {
          return <ul key={i} style={{ margin: 0, paddingLeft: 22 }}>{ls.map((l, j) => <li key={j}>{l.replace(/^[•\-]\s*/, "")}</li>)}</ul>;
        }
        return <p key={i} style={{ whiteSpace: "pre-line" }}>{b}</p>;
      })}
    </div>
  );
}
