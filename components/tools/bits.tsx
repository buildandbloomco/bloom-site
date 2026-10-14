"use client";

/* Small shared pieces for the Books & Tools tools */
export type ToolProps<T> = { data: T; set: (d: T) => void; ro?: boolean; today: string };

export const uid = () => Math.random().toString(36).slice(2, 10);

export function Txt({ label, value, onChange, hint, placeholder, ro }: { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; ro?: boolean }) {
  return <label>{label}{hint && <span className="hint">{hint}</span>}<input type="text" value={value ?? ""} placeholder={placeholder} readOnly={ro} onChange={(e) => onChange(e.target.value)} /></label>;
}
export function Area({ label, value, onChange, hint, placeholder, rows = 3, ro }: { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; rows?: number; ro?: boolean }) {
  return <label>{label}{hint && <span className="hint">{hint}</span>}<textarea rows={rows} value={value ?? ""} placeholder={placeholder} readOnly={ro} onChange={(e) => onChange(e.target.value)} /></label>;
}
export function Num({ label, value, onChange, hint, step = 1, min = 0, prefix, ro }: { label: string; value: number; onChange: (v: number) => void; hint?: string; step?: number; min?: number; prefix?: string; ro?: boolean }) {
  return (
    <label>{label}{hint && <span className="hint">{hint}</span>}
      <span className="tl-num">{prefix && <span className="pre">{prefix}</span>}<input type="number" inputMode="decimal" step={step} min={min} value={Number.isFinite(value) ? value : ""} readOnly={ro} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} /></span>
    </label>
  );
}

/** An editable list of short lines */
export function Lines({ label, items, onChange, placeholder, ro, hint }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string; ro?: boolean; hint?: string }) {
  const list = items?.length ? items : [""];
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="tl-label">{label}{hint && <span className="hint">{hint}</span>}</span>
      {list.map((x, i) => (
        <div key={i} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
          <span className="tl-n" aria-hidden="true">{i + 1}</span>
          <input type="text" aria-label={`${label} ${i + 1}`} value={x} placeholder={i === 0 ? placeholder : ""} readOnly={ro} onChange={(e) => onChange(list.map((y, j) => (j === i ? e.target.value : y)))} />
          {!ro && list.length > 1 && <button type="button" className="linkbtn small no-print" aria-label="Remove line" onClick={() => onChange(list.filter((_, j) => j !== i))}>Remove</button>}
        </div>
      ))}
      {!ro && <div className="no-print"><button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange([...list, ""])}>+ Add a line</button></div>}
    </div>
  );
}

/** A choice between a few options */
export function Choice({ label, value, options, onChange, ro }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; ro?: boolean }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="tl-label">{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={value === k} className={value === k ? "on" : ""} disabled={ro} onClick={() => onChange(k)}>{l}</button>)}
      </div>
    </div>
  );
}

export const day = (d: string) => (d ? new Date(d.length > 10 ? d : d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
