"use client";

import "./room.css";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CANVASES, IDEA_PROMPTS, IDEA_STAGES, ideaScore, type Entry, type IdeaStage, type ItemKind, type Role, type RoomItem } from "@/lib/room-def";

interface Task { id: string; title: string; owner: Role; due: string; status: "todo" | "doing" | "done"; createdBy: Role; carriedFrom: string }
type TaskOp = { op: "add" | "set" | "del"; id?: string; title?: string; owner?: string; due?: string; status?: string };
interface Api {
  role: Role;
  locked: boolean;
  names: Record<Role, string>;
  field: (name: string) => string;
  setField: (name: string, v: string, priv?: boolean) => void;
  items: (kind: ItemKind, box?: string) => RoomItem[];
  item: (id: string) => RoomItem | undefined;
  patch: (id: string, p: Partial<RoomItem>) => void;
  add: (kind: ItemKind, p?: Partial<RoomItem>) => string;
  editing: (key: string | null) => void;
  otherOn: (key: string) => boolean;
  tasks: Task[];
  task: (op: TaskOp) => void;
}
const Ctx = createContext<Api>(null as unknown as Api);
const rid = () => Math.random().toString(36).slice(2, 12);
const STAT: Record<Task["status"], string> = { todo: "Not started", doing: "In progress", done: "Completed" };

/** A shared text box. What you type shows on the other person's screen within a couple of seconds. */
function Live({ name, label, hint, rows = 3, priv = false, placeholder = "" }: { name: string; label?: string; hint?: string; rows?: number; priv?: boolean; placeholder?: string }) {
  const r = useContext(Ctx);
  const key = `${priv ? "p" : "f"}:${name}`;
  const other = r.otherOn(key);
  return (
    <label className="rm-field">
      {label && <span className="l">{label} {hint && <span className="hint">{hint}</span>} {other && <span className="rm-typing">· {r.names[r.role === "us" ? "client" : "us"]} is typing</span>}</span>}
      <textarea className={`live${other ? " is-other" : ""}`} rows={rows} value={r.field(priv ? `p:${name}` : name)} placeholder={placeholder} disabled={r.locked}
        onFocus={() => r.editing(key)} onBlur={() => r.editing(null)} onChange={(e) => r.setField(name, e.target.value, priv)} />
    </label>
  );
}

function Grow({ value, onChange, placeholder, itemKey, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; itemKey: string; autoFocus?: boolean }) {
  const r = useContext(Ctx);
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }, [value]);
  return <textarea ref={ref} rows={1} value={value} placeholder={placeholder} autoFocus={autoFocus} disabled={r.locked} className={r.otherOn(itemKey) ? "is-other" : ""}
    onFocus={() => r.editing(itemKey)} onBlur={() => r.editing(null)} onChange={(e) => onChange(e.target.value)} />;
}

/** A shared list: one line per thought, added by either of you */
function List({ kind, box, placeholder, empty }: { kind: ItemKind; box?: string; placeholder: string; empty?: string }) {
  const r = useContext(Ctx);
  const [draft, setDraft] = useState("");
  const list = r.items(kind, box);
  const add = () => { if (draft.trim()) { r.add(kind, { text: draft.trim(), box }); setDraft(""); } };
  return (
    <div className="stack" style={{ gap: 6 }}>
      {list.length === 0 && empty && <span className="small muted">{empty}</span>}
      {list.map((i) => (
        <div className="rm-line" key={i.id}>
          <span className={`who ${i.by}`} title={`Added by ${r.names[i.by]}`} />
          <Grow value={i.text} itemKey={`i:${i.id}`} onChange={(v) => r.patch(i.id, { text: v })} />
          {!r.locked && <button type="button" className="rm-x" aria-label="Remove" onClick={() => r.patch(i.id, { deleted: true })}>&times;</button>}
        </div>
      ))}
      {!r.locked && (
        <div className="rm-add">
          <input type="text" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" className="btn btn-sm btn-ghost" disabled={!draft.trim()} onClick={add}>Add</button>
        </div>
      )}
    </div>
  );
}

const Ask = ({ children }: { children: React.ReactNode }) => <div className="rm-ask"><div className="lab">Ask</div><p>{children}</p></div>;

function Pips({ value, onPick, label }: { value?: number; onPick: (n: number) => void; label: string }) {
  const r = useContext(Ctx);
  return <span className="rm-pips" role="group" aria-label={label}>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" disabled={r.locked} className={value === n ? "on" : ""} aria-pressed={value === n} onClick={() => onPick(n)}>{n}</button>)}</span>;
}

/** Mind map: a tree you both build. Enter adds a sibling, Tab adds a branch under it. */
function MindMap() {
  const r = useContext(Ctx);
  const nodes = r.items("node");
  const [focus, setFocus] = useState<string | null>(null);
  const kids = (id: string) => nodes.filter((n) => (n.parent ?? "") === id);
  const COLORS = ["#854327", "#4C5C4C", "#B8892B", "#6B4E8A", "#2F6F7A", "#A0522D"];
  const W = 230, H = 50;
  const pos: Record<string, { x: number; y: number; c: string }> = {};
  let row = 0;
  const place = (id: string, depth: number, color: string): number => {
    const ch = kids(id);
    if (!ch.length) { pos[id] = { x: depth * W, y: row * H, c: color }; row++; return pos[id].y; }
    const ys = ch.map((c, i) => place(c.id, depth + 1, id === "" ? COLORS[i % COLORS.length] : color));
    pos[id] = { x: depth * W, y: (ys[0] + ys[ys.length - 1]) / 2, c: color };
    return pos[id].y;
  };
  place("", 0, "#2C1B13");
  const height = Math.max(row, 1) * H + 40, maxDepth = Math.max(...Object.values(pos).map((p) => p.x)) / W;
  const width = (maxDepth + 1) * W + 260;
  const addNode = (parent: string) => { const id = r.add("node", { parent, text: "" }); setFocus(id); };
  const wOf = (t: string) => Math.max(90, Math.min(200, t.length * 9 + 34));
  return (
    <div className="rm-map" style={{ height: Math.min(Math.max(height + 30, 380), 680) }}>
      <svg width={width} height={height + 30} aria-hidden="true">
        {nodes.map((n) => {
          const a = pos[n.parent ?? ""], b = pos[n.id];
          if (!a || !b) return null;
          const x1 = a.x + 20 + (n.parent ? wOf(r.item(n.parent)?.text ?? "") : wOf(r.field("mapRoot") || "Our focus") + 12), y1 = a.y + 20 + 22, x2 = b.x + 20, y2 = b.y + 20 + 18;
          return <path key={n.id} d={`M${x1},${y1} C${x1 + 40},${y1} ${x2 - 40},${y2} ${x2},${y2}`} fill="none" stroke={b.c} strokeWidth={2.5} opacity={0.7} />;
        })}
      </svg>
      <div className="rm-node root" style={{ left: 20, top: pos[""].y + 20 }}>
        <input type="text" aria-label="Center of the map" value={r.field("mapRoot")} placeholder="Our focus" disabled={r.locked} style={{ width: wOf(r.field("mapRoot") || "Our focus") + 12 }}
          onFocus={() => r.editing("f:mapRoot")} onBlur={() => r.editing(null)} onChange={(e) => r.setField("mapRoot", e.target.value)} onKeyDown={(e) => { if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); addNode(""); } }} />
        {!r.locked && <span className="ops" style={{ opacity: 1 }}><button type="button" title="Add a branch" onClick={() => addNode("")}>+</button></span>}
      </div>
      {nodes.map((n) => pos[n.id] && (
        <div key={n.id} className="rm-node" style={{ left: pos[n.id].x + 20, top: pos[n.id].y + 20 + 4, ["--c" as string]: pos[n.id].c }}>
          <input type="text" aria-label="Branch" value={n.text} placeholder="Idea" disabled={r.locked} autoFocus={focus === n.id} style={{ width: wOf(n.text) }} className={r.otherOn(`i:${n.id}`) ? "is-other" : ""}
            onFocus={() => r.editing(`i:${n.id}`)} onBlur={() => r.editing(null)} onChange={(e) => r.patch(n.id, { text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addNode(n.parent ?? ""); }
              else if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); addNode(n.id); }
              else if (e.key === "Backspace" && !n.text && !kids(n.id).length) { e.preventDefault(); r.patch(n.id, { deleted: true }); }
            }} />
          {!r.locked && <span className="ops"><button type="button" title="Add a branch under this" onClick={() => addNode(n.id)}>+</button><button type="button" title="Remove" onClick={() => { const drop = (id: string) => { kids(id).forEach((k) => drop(k.id)); r.patch(id, { deleted: true }); }; drop(n.id); }}>&times;</button></span>}
        </div>
      ))}
    </div>
  );
}

const TABS = [["checkin", "Check-in"], ["focus", "Focus"], ["ideas", "Brainstorm"], ["map", "Mind map"], ["evaluate", "Evaluate"], ["canvas", "Canvases"], ["plan", "Roadmap"], ["decide", "Decisions"], ["recap", "Recap"]] as const;
type Tab = (typeof TABS)[number][0];

export default function StrategyRoom({ sid, clientId, role, names, title, date, closed, backHref, link = "", calHref = "" }: { sid: string; clientId?: string; role: Role; names: Record<Role, string>; title: string; date: string; closed: boolean; backHref: string; link?: string; calHref?: string }) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [other, setOther] = useState({ here: false, editing: "" });
  const [net, setNet] = useState<"connecting" | "live" | "saving" | "offline">("connecting");
  const [tab, setTab] = useState<Tab>("checkin");
  const [canvas, setCanvas] = useState(CANVASES[0].id);
  const [spark, setSpark] = useState(0);
  const [isClosed, setClosed] = useState(closed);
  const [msg, setMsg] = useState("");
  const pending = useRef(new Map<string, { k: string; v?: string; patch?: Partial<RoomItem> }>());
  const taskQ = useRef<TaskOp[]>([]);
  const lastLocal = useRef(new Map<string, number>());
  const since = useRef(0);
  const editingKey = useRef("");
  const lastTaskEdit = useRef(0);
  const flushT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = isClosed && role === "client";
  const q = clientId ? `c=${clientId}&` : "";

  const flush = useCallback(async () => {
    flushT.current = null;
    if (!pending.current.size && !taskQ.current.length) return;
    const ops = [...pending.current.values()], tk = taskQ.current;
    const sent = new Map(pending.current);
    pending.current = new Map();
    taskQ.current = [];
    setNet("saving");
    try {
      const res = await fetch(`/api/room/${sid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c: clientId, ops, tasks: tk }) });
      if (!res.ok) throw new Error();
      setNet("live");
    } catch {
      // Put back anything that didn't go through, unless it was edited again since
      for (const [k, op] of sent) if (!pending.current.has(k)) pending.current.set(k, op);
      taskQ.current = [...tk, ...taskQ.current];
      setNet("offline");
      flushT.current = setTimeout(flush, 3000);
    }
  }, [sid, clientId]);
  const queue = useCallback(() => { if (!flushT.current) flushT.current = setTimeout(flush, 350); }, [flush]);

  // Ask the server what changed, about every second and a half while the tab is open
  useEffect(() => {
    let stop = false, n = 0, t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stop) return;
      const hidden = document.hidden;
      try {
        const presence = !hidden && n++ % 3 === 0 ? `&p=1&e=${encodeURIComponent(editingKey.current)}` : "";
        const res = await fetch(`/api/room/${sid}?${q}since=${since.current}${presence}`, { cache: "no-store" });
        if (res.ok) {
          const d = await res.json();
          since.current = d.now - 4000; // overlap a few seconds so a save that was mid-flight is never missed
          const now = Date.now();
          const fresh = Object.entries(d.entries as Record<string, Entry>).filter(([k]) => !pending.current.has(k) && (lastLocal.current.get(k) ?? 0) < now - 2500);
          if (fresh.length) setEntries((prev) => ({ ...prev, ...Object.fromEntries(fresh) }));
          if (now - lastTaskEdit.current > 2500 && !taskQ.current.length) setTasks(d.tasks);
          setOther(d.other);
          setClosed(d.session.status === "done");
          setNet((s) => (s === "saving" ? s : "live"));
        } else if (res.status === 401) setNet("offline");
      } catch { setNet("offline"); }
      t = setTimeout(tick, hidden ? 6000 : 1500);
    };
    tick();
    const leave = () => { if (pending.current.size || taskQ.current.length) fetch(`/api/room/${sid}`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c: clientId, ops: [...pending.current.values()], tasks: taskQ.current }) }); };
    window.addEventListener("pagehide", leave);
    return () => { stop = true; clearTimeout(t); window.removeEventListener("pagehide", leave); };
  }, [sid, q, clientId]);

  const api: Api = useMemo(() => {
    const all = () => Object.entries(entries).filter(([k]) => k.startsWith("i:")).map(([, e]) => e.v as RoomItem).filter((i) => i && !i.deleted);
    return {
      role, locked, names, tasks,
      field: (name) => String(entries[name.startsWith("p:") ? name : `f:${name}`]?.v ?? ""),
      setField: (name, v, priv) => {
        const k = `${priv ? "p" : "f"}:${name}`;
        setEntries((p) => ({ ...p, [k]: { v, by: role, at: Date.now() } }));
        pending.current.set(k, { k, v }); lastLocal.current.set(k, Date.now()); queue();
      },
      items: (kind, box) => all().filter((i) => i.kind === kind && (box === undefined || i.box === box)).sort((a, b) => a.o - b.o),
      item: (id) => entries[`i:${id}`]?.v as RoomItem | undefined,
      patch: (id, p) => {
        const k = `i:${id}`;
        setEntries((prev) => ({ ...prev, [k]: { v: { ...(prev[k]?.v as RoomItem), ...p, votes: p.votes ? { ...((prev[k]?.v as RoomItem)?.votes ?? {}), ...p.votes } : (prev[k]?.v as RoomItem)?.votes }, by: role, at: Date.now() } }));
        pending.current.set(k, { k, patch: { ...(pending.current.get(k)?.patch ?? {}), ...p } }); lastLocal.current.set(k, Date.now()); queue();
      },
      add: (kind, p = {}) => {
        const id = rid(), k = `i:${id}`, item: RoomItem = { id, kind, text: "", by: role, o: Date.now(), ...p };
        setEntries((prev) => ({ ...prev, [k]: { v: item, by: role, at: Date.now() } }));
        pending.current.set(k, { k, patch: item }); lastLocal.current.set(k, Date.now()); queue();
        return id;
      },
      editing: (key) => { editingKey.current = key ?? ""; },
      otherOn: (key) => other.editing === key,
      task: (op) => {
        lastTaskEdit.current = Date.now();
        setTasks((prev) => op.op === "add" ? [...prev, { id: `tmp${rid()}`, title: op.title ?? "", owner: (role === "client" ? "client" : op.owner ?? "client") as Role, due: op.due ?? "", status: "todo", createdBy: role, carriedFrom: "" }]
          : op.op === "del" ? prev.filter((t) => t.id !== op.id) : prev.map((t) => (t.id === op.id ? { ...t, ...(op.status ? { status: op.status as Task["status"] } : {}), ...(op.title !== undefined ? { title: op.title } : {}), ...(op.due !== undefined ? { due: op.due } : {}), ...(op.owner ? { owner: op.owner as Role } : {}) } : t)));
        if (!(op.id ?? "").startsWith("tmp")) { taskQ.current.push(op); queue(); }
      },
    };
  }, [entries, tasks, other, role, locked, names, queue]);

  const r = api;
  const ideas = r.items("idea");
  const scored = ideas.filter((i) => i.stage === "exploring" || i.stage === "chosen");
  const myVote = (i: RoomItem) => (i.votes?.[role] ?? 0) > 0;
  const votes = (i: RoomItem) => (i.votes?.us ?? 0) + (i.votes?.client ?? 0);
  const cv = CANVASES.find((c) => c.id === canvas)!;
  const nice = date ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";
  const otherName = names[role === "us" ? "client" : "us"];

  async function publish(close: boolean) {
    await flush();
    const res = await fetch(`/api/room/${sid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c: clientId, publish: true, close }) });
    setMsg(res.ok ? (close ? "Session closed. The recap is on their strategy plan." : "Recap saved to their strategy plan.") : "Could not save the recap.");
    if (res.ok && close) setClosed(true);
  }

  const taskRow = (t: Task) => {
    const mine = role === "us" || t.owner === "client";
    return (
      <div key={t.id} className={`rm-task ${t.owner}`}>
        <span className="tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 600 }}>{names[t.owner]}{t.carriedFrom ? ` · carried from ${t.carriedFrom}` : ""}</span>
        <input type="text" value={t.title} aria-label="Action" disabled={!mine || locked} style={{ fontWeight: 600, minHeight: 38, padding: "4px 10px" }} onChange={(e) => r.task({ op: "set", id: t.id, title: e.target.value })} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span role="group" aria-label="Status" style={{ display: "flex", gap: 4 }}>
            {(["todo", "doing", "done"] as const).map((s) => <button key={s} type="button" disabled={!mine || locked} aria-pressed={t.status === s} className={`btn btn-sm ${t.status === s ? (s === "done" ? "btn-dark" : s === "doing" ? "btn-gold" : "btn-primary") : "btn-ghost"}`} style={{ padding: "6px 10px", fontSize: "0.7rem" }} onClick={() => r.task({ op: "set", id: t.id, status: s })}>{STAT[s]}</button>)}
          </span>
          {role === "us" && <select value={t.owner} aria-label="Owner" style={{ minHeight: 34, padding: "2px 8px", width: "auto" }} onChange={(e) => r.task({ op: "set", id: t.id, owner: e.target.value })}><option value="client">{names.client}</option><option value="us">{names.us}</option></select>}
          <input type="date" value={t.due} aria-label="Due date" disabled={!mine || locked} style={{ minHeight: 34, padding: "2px 8px", width: "auto" }} onChange={(e) => r.task({ op: "set", id: t.id, due: e.target.value })} />
          {(role === "us" || t.createdBy === "client") && !locked && <button type="button" className="rm-x" style={{ marginLeft: "auto" }} aria-label="Remove" onClick={() => r.task({ op: "del", id: t.id })}>&times;</button>}
        </div>
      </div>
    );
  };

  return (
    <Ctx.Provider value={api}>
      <div className="rm">
        <div className="rm-top">
          <div className="rm-head">
            <div className="stack" style={{ gap: 2 }}>
              <a href={backHref} className="small rm-noprint">&larr; Back</a>
              <h2>{title}</h2>
              <span className="small muted">Strategy room{nice ? ` · ${nice}` : ""}{isClosed ? " · Closed" : ""}</span>
            </div>
            <div className="rm-who" role="status">
              <span><span className="rm-dot on" />{names[role]} (you)</span>
              <span><span className={`rm-dot${other.here ? " on" : ""}`} />{otherName} {other.here ? "is here" : "is not in the room"}</span>
              {link && !isClosed && <a className="btn btn-sm btn-dark rm-noprint" href={link} target="_blank" rel="noreferrer">Join the call</a>}
              {calHref && !isClosed && <a className="rm-noprint" href={calHref}>Add to my calendar</a>}
              <span>{net === "live" ? "Live · saved" : net === "saving" ? "Saving..." : net === "offline" ? "Reconnecting..." : "Connecting..."}</span>
            </div>
          </div>
          <div className="rm-tabs" role="tablist" aria-label="Session steps">
            {TABS.map(([id, label], i) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}><b>{i + 1}</b>{label}</button>)}
          </div>
        </div>

        {locked && <div className="card"><p style={{ margin: 0 }}>This session is closed. You can read everything here, and the recap is on your strategy plan.</p></div>}

        {tab === "checkin" && (
          <section className="rm-panel">
            <h3>Check-in: where things stand</h3>
            <Ask>What moved since we last met? What is heavier than it should be right now?</Ask>
            <div className="rm-grid2">
              <div className="rm-box"><h4>Wins since last time</h4><List kind="win" placeholder="Add a win, big or small" /></div>
              <div className="rm-box"><h4>What feels heavy</h4><Live name="heavy" rows={5} placeholder="Bottlenecks, worries, decisions being avoided" /></div>
            </div>
            <div className="rm-box">
              <h4>Scorecard <span className="hint">· the numbers we watch every session</span></h4>
              <div className="rm-metric tiny muted" style={{ textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 600 }}><span>Measure</span><span>Last time</span><span>Now</span><span /></div>
              {r.items("metric").map((m) => (
                <div className="rm-metric" key={m.id}>
                  <input type="text" value={m.text} aria-label="Measure" disabled={locked} onFocus={() => r.editing(`i:${m.id}`)} onBlur={() => r.editing(null)} onChange={(e) => r.patch(m.id, { text: e.target.value })} />
                  <input type="text" value={m.prev ?? ""} aria-label="Last time" disabled={locked} placeholder="" onChange={(e) => r.patch(m.id, { prev: e.target.value })} />
                  <input type="text" value={m.value ?? ""} aria-label="Now" disabled={locked} className={r.otherOn(`i:${m.id}`) ? "is-other" : ""} onFocus={() => r.editing(`i:${m.id}`)} onBlur={() => r.editing(null)} onChange={(e) => r.patch(m.id, { value: e.target.value })} />
                  {!locked ? <button type="button" className="rm-x" aria-label="Remove measure" onClick={() => r.patch(m.id, { deleted: true })}>&times;</button> : <span />}
                </div>
              ))}
              {!locked && <button type="button" className="btn btn-sm btn-ghost" style={{ justifySelf: "start" }} onClick={() => r.add("metric", { text: "", value: "", prev: "" })}>+ Add a measure</button>}
            </div>
          </section>
        )}

        {tab === "focus" && (
          <section className="rm-panel">
            <h3>Focus: the one thing this session is for</h3>
            <Ask>If we could only solve one thing today, what should it be? How will we know this session was worth it?</Ask>
            <Live name="focus" label="The question we are here to answer" rows={2} placeholder="How do we..." />
            <div className="rm-grid2">
              <Live name="outcome" label="What we want to walk out with" rows={4} placeholder="A decision, a plan, a shortlist" />
              <Live name="constraints" label="What is true that we have to respect" hint="money, time, people, energy, values" rows={4} />
            </div>
            <div className="rm-box"><h4>Parking lot <span className="hint">· important, but not for today</span></h4><List kind="park" placeholder="Park something for later" /></div>
          </section>
        )}

        {tab === "ideas" && (
          <section className="rm-panel">
            <h3>Brainstorm: new and existing ideas</h3>
            <div className="rm-ask" style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div><div className="lab">Need a spark?</div><p>{IDEA_PROMPTS[spark % IDEA_PROMPTS.length]}</p></div>
              <button type="button" className="btn btn-sm btn-gold rm-noprint" onClick={() => setSpark(spark + 1)}>Another question</button>
            </div>
            <p className="small muted" style={{ margin: 0 }}>No judging yet. Get everything out, vote for what has energy, then move the strongest to Exploring. Yellow notes are {names.us}&rsquo;s, pink are {names.client}&rsquo;s.</p>
            {!locked && <div className="rm-add"><IdeaAdd /></div>}
            <div className="rm-board">
              {IDEA_STAGES.map((st) => {
                const col = ideas.filter((i) => (i.stage ?? "new") === st.id).sort((a, b) => votes(b) - votes(a) || a.o - b.o);
                return (
                  <div className="rm-col" key={st.id}>
                    <h4><span>{st.label}</span><span>{col.length}</span></h4>
                    {col.map((i) => (
                      <div className={`rm-note ${i.by}`} key={i.id}>
                        <Grow value={i.text} itemKey={`i:${i.id}`} placeholder="Idea" onChange={(v) => r.patch(i.id, { text: v })} />
                        <div className="bar">
                          <button type="button" disabled={locked} className={`rm-vote${myVote(i) ? " on" : ""}`} aria-pressed={myVote(i)} title="Vote for this idea" onClick={() => r.patch(i.id, { votes: { [role]: myVote(i) ? 0 : 1 } })}>&#9650; {votes(i)}</button>
                          <select value={i.stage ?? "new"} aria-label="Move to" disabled={locked} onChange={(e) => r.patch(i.id, { stage: e.target.value as IdeaStage })}>{IDEA_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
                          {!locked && <button type="button" className="rm-x" style={{ padding: "0 6px" }} aria-label="Remove idea" onClick={() => r.patch(i.id, { deleted: true })}>&times;</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "map" && (
          <section className="rm-panel">
            <h3>Mind map: think it through together</h3>
            <p className="small muted" style={{ margin: 0 }}>Start from the center. Press <strong>Tab</strong> to branch off an idea, <strong>Enter</strong> to add one beside it. Hover a branch to add under it or remove it.</p>
            <MindMap />
          </section>
        )}

        {tab === "evaluate" && (
          <section className="rm-panel">
            <h3>Evaluate: which ideas earn our time</h3>
            <Ask>If this worked, how much would it change? What would it really take from you and your team?</Ask>
            {scored.length === 0 ? <p className="muted" style={{ margin: 0 }}>Move ideas to &ldquo;Exploring&rdquo; on the Brainstorm step and they show up here to score.</p> : (
              <div className="rm-eval">
                <div>
                  {scored.map((i, n) => (
                    <div key={i.id} className={`rm-erow${i.stage === "chosen" ? " chosen" : ""}`}>
                      <span className="n">{n + 1}</span>
                      <div className="stack" style={{ gap: 8 }}>
                        <strong>{i.text || "Untitled idea"}</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", alignItems: "center" }} className="small">
                          <span>Impact <Pips label="Impact" value={i.impact} onPick={(v) => r.patch(i.id, { impact: v })} /></span>
                          <span>Effort <Pips label="Effort" value={i.effort} onPick={(v) => r.patch(i.id, { effort: v })} /></span>
                          {ideaScore(i) !== null && <span className="muted">Return on effort: <strong style={{ color: "var(--ink)" }}>{ideaScore(i)}</strong></span>}
                          <button type="button" disabled={locked} className={`btn btn-sm ${i.stage === "chosen" ? "btn-gold" : "btn-ghost"}`} style={{ padding: "5px 12px", fontSize: "0.7rem" }} onClick={() => r.patch(i.id, { stage: i.stage === "chosen" ? "exploring" : "chosen" })}>{i.stage === "chosen" ? "Chosen ✓" : "Choose this"}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rm-box">
                  <h4>Impact and effort</h4>
                  <svg viewBox="0 0 300 300" role="img" aria-label="Ideas placed by impact and effort" style={{ width: "100%", height: "auto" }}>
                    <rect x="30" y="10" width="130" height="130" fill="#dfe6dc" /><rect x="160" y="10" width="130" height="130" fill="#fbf1cf" />
                    <rect x="30" y="140" width="130" height="130" fill="#f4efe7" /><rect x="160" y="140" width="130" height="130" fill="#f0dcd2" />
                    <text x="36" y="24" fontSize="9" fontWeight="600" fill="#33533f">QUICK WINS</text><text x="284" y="24" textAnchor="end" fontSize="9" fontWeight="600" fill="#7a5a12">BIG BETS</text>
                    <text x="36" y="264" fontSize="9" fontWeight="600" fill="#6b5a4c">FILL-INS</text><text x="284" y="264" textAnchor="end" fontSize="9" fontWeight="600" fill="#6a3520">TIME SINKS</text>
                    <text x="160" y="290" textAnchor="middle" fontSize="10" fill="#6b5a4c">Effort: low to high</text>
                    <text x="14" y="140" textAnchor="middle" fontSize="10" fill="#6b5a4c" transform="rotate(-90 14 140)">Impact: low to high</text>
                    {scored.map((i, n) => i.impact && i.effort ? (
                      <g key={i.id} transform={`translate(${30 + ((i.effort - 0.5) / 5) * 260 + ((n % 3) - 1) * 9}, ${270 - ((i.impact - 0.5) / 5) * 260 + (Math.floor(n / 3) % 3 - 1) * 9})`}>
                        <circle r="12" fill={i.stage === "chosen" ? "#DEB547" : "#2C1B13"} stroke="#fff" strokeWidth="2" /><text textAnchor="middle" dy="4" fontSize="11" fontWeight="700" fill={i.stage === "chosen" ? "#2C1B13" : "#fff"}>{n + 1}</text>
                      </g>
                    ) : null)}
                  </svg>
                  <span className="small muted">Quick wins first. Pick one big bet at most. Gold dots are chosen.</span>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "canvas" && (
          <section className="rm-panel">
            <h3>Strategy canvases</h3>
            <div className="pl-tabs rm-noprint" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CANVASES.filter((c) => c.id !== "road").map((c) => <button key={c.id} type="button" aria-pressed={canvas === c.id} className={`btn btn-sm ${canvas === c.id ? "btn-dark" : "btn-ghost"}`} style={{ fontSize: "0.7rem", padding: "7px 12px" }} onClick={() => setCanvas(c.id)}>{c.name}</button>)}
            </div>
            <Ask>{cv.blurb}</Ask>
            <div className={cv.boxes.length === 3 ? "rm-grid3" : "rm-grid2"}>
              {cv.boxes.map((b) => <div className="rm-box" key={b.id}><h4>{b.label}</h4><span className="hint">{b.hint}</span><List kind="note" box={`${cv.id}.${b.id}`} placeholder="Add a line" /></div>)}
            </div>
          </section>
        )}

        {tab === "plan" && (
          <section className="rm-panel">
            <h3>Roadmap and actions</h3>
            <Ask>What has to be true in 90 days for this to have worked? What is the very first step, and whose is it?</Ask>
            <div className="rm-grid3">
              {CANVASES.find((c) => c.id === "road")!.boxes.map((b) => <div className="rm-box" key={b.id}><h4>{b.label}</h4><span className="hint">{b.hint}</span><List kind="note" box={`road.${b.id}`} placeholder="Add a milestone" /></div>)}
            </div>
            <div className="rm-box">
              <h4>Action items <span className="hint">· these also show on the strategy plan</span></h4>
              {tasks.length === 0 && <span className="small muted">Nothing yet. Every session should end with at least one action for each of you.</span>}
              {tasks.map(taskRow)}
              {!locked && <TaskAdd />}
            </div>
          </section>
        )}

        {tab === "decide" && (
          <section className="rm-panel">
            <h3>Decisions and notes</h3>
            <Ask>What did we decide today? Say it in one sentence each, so nobody leaves with a different version.</Ask>
            <div className="rm-box"><h4>Decisions we made</h4><List kind="decision" placeholder="We decided to..." /></div>
            <Live name="notes" label="Shared session notes" rows={7} placeholder="Anything worth remembering from today" />
            {role === "us" && <Live name="notes" priv label="My private notes" hint="only you see these, never the client" rows={5} />}
          </section>
        )}

        {tab === "recap" && (
          <section className="rm-panel rm-recap">
            <div className="row between rm-noprint" style={{ flexWrap: "wrap", gap: 10 }}>
              <h3>Session recap</h3>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => window.print()}>Print or save as PDF</button>
                {role === "us" && <button type="button" className="btn btn-sm btn-ghost" onClick={() => publish(false)}>Save recap to their plan</button>}
                {role === "us" && !isClosed && <button type="button" className="btn btn-sm btn-primary" onClick={() => confirm("Close this session? The client can still read it but not change it.") && publish(true)}>Close session</button>}
              </div>
            </div>
            {msg && <p className="ok-text small rm-noprint">{msg}</p>}
            {role === "us" && clientId && <NextSession clientId={clientId} link={link} />}
            <div>
              <p className="eyebrow">{title}{nice ? ` · ${nice}` : ""}</p>
              {r.field("focus") && <><h4>The question</h4><p>{r.field("focus")}</p></>}
              {r.field("outcome") && <><h4>What we set out to do</h4><p>{r.field("outcome")}</p></>}
              {r.items("win").length > 0 && <><h4>Wins</h4><ul>{r.items("win").map((i) => <li key={i.id}>{i.text}</li>)}</ul></>}
              {r.items("metric").some((m) => m.value) && <><h4>Scorecard</h4><ul>{r.items("metric").filter((m) => m.value).map((m) => <li key={m.id}>{m.text}: <strong>{m.value}</strong>{m.prev ? ` (last time ${m.prev})` : ""}</li>)}</ul></>}
              {r.items("decision").length > 0 && <><h4>Decisions</h4><ul>{r.items("decision").map((i) => <li key={i.id}>{i.text}</li>)}</ul></>}
              {ideas.some((i) => i.stage === "chosen") && <><h4>Ideas we chose</h4><ul>{ideas.filter((i) => i.stage === "chosen").map((i) => <li key={i.id}>{i.text}{ideaScore(i) !== null ? ` (impact ${i.impact}, effort ${i.effort})` : ""}</li>)}</ul></>}
              {ideas.some((i) => i.stage === "exploring") && <><h4>Still exploring</h4><ul>{ideas.filter((i) => i.stage === "exploring").map((i) => <li key={i.id}>{i.text}</li>)}</ul></>}
              {CANVASES.find((c) => c.id === "road")!.boxes.some((b) => r.items("note", `road.${b.id}`).length) && <><h4>90-day roadmap</h4>{CANVASES.find((c) => c.id === "road")!.boxes.map((b) => r.items("note", `road.${b.id}`).length > 0 && <p key={b.id}><strong>{b.label}:</strong> {r.items("note", `road.${b.id}`).map((i) => i.text).join("; ")}</p>)}</>}
              {tasks.length > 0 && <><h4>Action items</h4><ul>{tasks.map((t) => <li key={t.id}>{t.title} <span className="muted">· {names[t.owner]}{t.due ? ` · due ${t.due}` : ""} · {STAT[t.status]}</span></li>)}</ul></>}
              {r.items("park").length > 0 && <><h4>Parking lot</h4><ul>{r.items("park").map((i) => <li key={i.id}>{i.text}</li>)}</ul></>}
              {r.field("notes") && <><h4>Notes</h4><p>{r.field("notes")}</p></>}
              {CANVASES.filter((c) => c.id !== "road" && c.boxes.some((b) => r.items("note", `${c.id}.${b.id}`).length)).map((c) => (
                <div key={c.id}><h4>{c.name}</h4>{c.boxes.map((b) => r.items("note", `${c.id}.${b.id}`).length > 0 && <p key={b.id}><strong>{b.label}:</strong> {r.items("note", `${c.id}.${b.id}`).map((i) => i.text).join("; ")}</p>)}</div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** Book the next session before anyone leaves the room */
function NextSession({ clientId, link }: { clientId: string; link: string }) {
  const [f, setF] = useState({ date: "", start: "", invite: true });
  const [state, setState] = useState("");
  async function go() {
    setState("Scheduling...");
    const res = await fetch(`/api/admin/clients/${clientId}/plan/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: true, date: f.date, start: f.start, link }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setState(d.error || "Could not schedule.");
    if (!f.invite || !f.start) return setState("Scheduled. It shows in their portal and on your calendar.");
    const iv = await fetch(`/api/admin/clients/${clientId}/plan/invite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sid: d.sessionId }) });
    const j = await iv.json().catch(() => ({}));
    setState(iv.ok ? `Scheduled, and the invite was emailed to ${j.invitedTo}.` : `Scheduled. The invite was not emailed: ${j.error || "unknown error"}`);
  }
  return (
    <div className="rm-box rm-noprint">
      <h4>Schedule the next session</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        <label style={{ width: "auto" }} className="small">Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label style={{ width: "auto" }} className="small">Time (Eastern)<input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 6, fontWeight: 400, width: "auto" }} className="small"><input type="checkbox" checked={f.invite} onChange={(e) => setF({ ...f, invite: e.target.checked })} style={{ width: "auto" }} /> Email them the invite</label>
        <button type="button" className="btn btn-sm btn-primary" disabled={!f.date} onClick={go}>Schedule</button>
      </div>
      {state && <span className="small" role="status">{state}</span>}
    </div>
  );
}

function IdeaAdd() {
  const r = useContext(Ctx);
  const [t, setT] = useState("");
  const [stage, setStage] = useState<IdeaStage>("new");
  const add = () => { if (t.trim()) { r.add("idea", { text: t.trim(), stage, votes: {} }); setT(""); } };
  return (
    <>
      <input type="text" value={t} placeholder="Type an idea and press Enter" onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
      <select value={stage} aria-label="Kind of idea" onChange={(e) => setStage(e.target.value as IdeaStage)} style={{ width: "auto", minHeight: 40 }}><option value="new">New idea</option><option value="existing">Existing idea</option></select>
      <button type="button" className="btn btn-sm btn-dark" disabled={!t.trim()} onClick={add}>Add</button>
    </>
  );
}

function TaskAdd() {
  const r = useContext(Ctx);
  const [t, setT] = useState("");
  const [owner, setOwner] = useState<Role>("client");
  const [due, setDue] = useState("");
  const add = () => { if (t.trim()) { r.task({ op: "add", title: t.trim(), owner, due }); setT(""); setDue(""); } };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input type="text" value={t} placeholder="Add an action item" style={{ flex: "1 1 240px", minHeight: 40 }} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
      {r.role === "us" && <select value={owner} aria-label="Owner" style={{ width: "auto", minHeight: 40 }} onChange={(e) => setOwner(e.target.value as Role)}><option value="client">{r.names.client}</option><option value="us">{r.names.us}</option></select>}
      <input type="date" value={due} aria-label="Due date" style={{ width: "auto", minHeight: 40 }} onChange={(e) => setDue(e.target.value)} />
      <button type="button" className="btn btn-sm btn-dark" disabled={!t.trim()} onClick={add}>Add</button>
    </div>
  );
}
