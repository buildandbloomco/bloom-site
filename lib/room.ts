import "server-only";
import { kv } from "./kv";
import { getPlan, savePlan, sanitizePlan } from "./workspace";
import { newId } from "./crypto";
import type { Client } from "./types";
import type { PlanTask } from "./plan-types";
import { DEFAULT_METRICS, KEY_RE, typeDef, type Brief, type Entry, type Role, type RoomItem, type SessionType } from "./room-def";
import { listToolRecords } from "./tools";
import { CHECK_AREAS } from "./tools-def";

const key = (clientId: string, sid: string) => `bb:room:${clientId}:${sid}`;
const TEXT_MAX = 20000;

export type RoomMap = Record<string, Entry>;
export async function readRoom(clientId: string, sid: string): Promise<RoomMap> {
  return kv().hgetall<Entry>(key(clientId, sid));
}

export interface Op { k: string; v?: unknown; patch?: Partial<RoomItem> }

function cleanItem(prev: RoomItem | null, patch: Partial<RoomItem>, id: string, by: Role): RoomItem {
  const s = (v: unknown, max: number) => String(v ?? "").slice(0, max);
  const n = (v: unknown) => { const x = Math.round(Number(v)); return x >= 1 && x <= 5 ? x : undefined; };
  const m = { ...(prev ?? { id, kind: "note", text: "", by, o: Date.now() }), ...patch } as RoomItem;
  const votes = { ...(prev?.votes ?? {}) };
  // Each side can only change its own vote
  if (patch.votes && typeof patch.votes === "object") votes[by] = Math.max(0, Math.min(3, Math.round(Number((patch.votes as Record<string, number>)[by]) || 0)));
  return {
    id, kind: (["win", "idea", "node", "note", "metric", "decision", "park"].includes(m.kind) ? m.kind : "note") as RoomItem["kind"],
    text: s(m.text, 2000), by: prev?.by ?? by, o: Number(m.o) || Date.now(),
    box: m.box ? s(m.box, 40) : undefined, stage: m.stage, impact: n(m.impact), effort: n(m.effort), votes,
    parent: m.parent === undefined ? undefined : s(m.parent, 48), value: m.value === undefined ? undefined : s(m.value, 60), prev: m.prev === undefined ? undefined : s(m.prev, 60),
    deleted: !!m.deleted,
  };
}

/** Save a batch of edits. Each field or item is stored on its own, so two people typing in different places never overwrite each other. */
export async function applyOps(clientId: string, sid: string, role: Role, ops: Op[]) {
  const k = key(clientId, sid);
  let at = Date.now();
  for (const op of ops.slice(0, 60)) {
    at = Date.now();
    if (!KEY_RE.test(op.k)) continue;
    if (op.k.startsWith("p:") && role !== "us") continue; // private notes are yours only
    if (role !== "us" && ["f:type", "f:nextType", "f:suggestType", "f:suggestWhy", "f:backlog", "f:seeded"].includes(op.k)) continue; // only you set up the session
    if (op.k.startsWith("i:")) {
      const prev = await kv().hget<Entry<RoomItem>>(k, op.k);
      await kv().hset(k, op.k, { v: cleanItem(prev?.v ?? null, op.patch ?? {}, op.k.slice(2), role), by: role, at });
    } else {
      await kv().hset(k, op.k, { v: String(op.v ?? "").slice(0, TEXT_MAX), by: role, at });
    }
  }
  return at;
}

export async function touchPresence(clientId: string, sid: string, role: Role, editing: string) {
  await kv().hset(key(clientId, sid), `~${role}`, { v: KEY_RE.test(editing) ? editing : "", by: role, at: Date.now() });
}

const itemsOf = (room: RoomMap) => Object.entries(room).filter(([k]) => k.startsWith("i:")).map(([, e]) => e.v as RoomItem).filter((i) => i && typeof i === "object" && !i.deleted);
const fieldOf = (room: RoomMap, name: string) => String(room[`f:${name}`]?.v ?? "").trim();
const parseList = <T,>(raw: string): T[] => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; } };
const daysBetween = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);
const todayET = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

/** The session right before this one, by date */
async function previous(clientId: string, sid: string) {
  const plan = await getPlan(clientId);
  const cur = plan.sessions.find((s) => s.id === sid);
  const prev = cur ? plan.sessions.filter((s) => s.id !== sid && s.date && (!cur.date || s.date <= cur.date)).sort((a, b) => a.date.localeCompare(b.date)).pop() ?? null : null;
  return { plan, cur, prev, prevRoom: prev ? await readRoom(clientId, prev.id) : ({} as RoomMap) };
}

/** First time a room opens: bring forward the numbers you track and the parking lot. Old ideas wait in a backlog instead of filling the board. */
export async function seedRoom(clientId: string, sid: string) {
  const { cur, prev, prevRoom: old } = await previous(clientId, sid);
  if (!cur) return;
  const k = key(clientId, sid);
  const at = Date.now();
  let o = at;
  const put = (item: RoomItem) => kv().hset(k, `i:${item.id}`, { v: item, by: "us", at });
  const olds = itemsOf(old);
  const metrics = olds.filter((i) => i.kind === "metric").sort((a, b) => a.o - b.o);
  if (metrics.length) for (const m of metrics) await put({ id: newId(), kind: "metric", text: m.text, by: "us", o: o++, value: "", prev: m.value || m.prev || "" });
  else for (const name of DEFAULT_METRICS) await put({ id: newId(), kind: "metric", text: name, by: "us", o: o++, value: "", prev: "" });
  for (const i of olds.filter((x) => x.kind === "park").sort((a, b) => a.o - b.o)) await put({ ...i, id: newId(), o: o++ });
  // Ideas from every earlier session, newest version of each, waiting to be pulled in when they matter
  const seen = new Set<string>();
  const backlog: { text: string; stage: string }[] = [];
  const fresh = olds.filter((x) => x.kind === "idea" && x.text.trim()).sort((a, b) => a.o - b.o).map((i) => ({ text: i.text.trim(), stage: i.stage ?? "new" }));
  for (const b of [...fresh, ...parseList<{ text: string; stage: string }>(fieldOf(old, "backlog"))]) {
    const n = b.text.toLowerCase();
    if (!b.text || seen.has(n)) continue;
    seen.add(n);
    backlog.push({ text: String(b.text).slice(0, 500), stage: b.stage === "new" ? "existing" : b.stage });
  }
  if (backlog.length) await kv().hset(k, "f:backlog", { v: JSON.stringify(backlog.slice(0, 80)), by: "us", at });
  if (cur.goal) await kv().hset(k, "f:focus", { v: cur.goal, by: "us", at });
  await suggest(clientId, sid);
  await kv().hset(k, "f:seeded", { v: prev ? prev.title : "first", by: "us", at });
}

/** Did this number move the wrong way? For hours, costs, and debt, going up is the worry. */
const LOWER_IS_BETTER = /hour|cost|expense|debt|overdue|churn|turnover|late/i;
function worse(name: string, from: string, to: string) {
  const a = Number(String(from).replace(/[^0-9.-]/g, "")), b = Number(String(to).replace(/[^0-9.-]/g, ""));
  if (!String(from).trim() || !String(to).trim() || Number.isNaN(a) || Number.isNaN(b) || a === b) return false;
  return LOWER_IS_BETTER.test(name) ? b > a : b < a;
}

/** Suggest what kind of session this should be, from where the client is. You confirm or switch it in the room. */
export async function suggest(clientId: string, sid: string) {
  const { plan, cur, prev, prevRoom } = await previous(clientId, sid);
  if (!cur) return;
  let type: SessionType = "checkin", why = "";
  if (!prev) { type = "kickoff"; why = "This is your first session together."; }
  else if (typeDef(fieldOf(prevRoom, "nextType"))) { type = fieldOf(prevRoom, "nextType") as SessionType; why = `Chosen at the end of ${prev.title}.`; }
  else {
    // When was the last 90-day plan?
    const earlier = plan.sessions.filter((s) => s.id !== sid && s.date && s.date <= (cur.date || "9999")).sort((a, b) => b.date.localeCompare(a.date));
    let lastPlan: string | null = null;
    for (const s of earlier) {
      const r = s.id === prev.id ? prevRoom : await readRoom(clientId, s.id);
      if (fieldOf(r, "type") === "plan90" || itemsOf(r).some((i) => i.kind === "note" && i.box?.startsWith("road."))) { lastPlan = s.date; break; }
    }
    const age = lastPlan ? daysBetween(lastPlan, cur.date || todayET()) : null;
    const down = itemsOf(prevRoom).filter((i) => i.kind === "metric" && worse(i.text, i.prev ?? "", i.value ?? ""));
    if (lastPlan === null) { type = "plan90"; why = "There is no 90-day roadmap yet."; }
    else if (age !== null && age >= 80) { type = "plan90"; why = `It has been ${age} days since the last 90-day plan. Time to reset.`; }
    else if (down.length) { type = "deepdive"; why = `${down[0].text} moved the wrong way last time (${down[0].prev} to ${down[0].value}). Worth finding out why.`; }
    else {
      const open = plan.tasks.filter((t) => t.sessionId === sid && t.carriedFrom && t.status !== "done").length;
      type = "checkin"; why = open ? `${open} open item${open === 1 ? "" : "s"} carried over. Check progress and clear what is stuck.` : "The plan is in motion. Check progress and adjust.";
    }
  }
  const k = key(clientId, sid), at = Date.now();
  await kv().hset(k, "f:suggestType", { v: type, by: "us", at });
  await kv().hset(k, "f:suggestWhy", { v: why, by: "us", at });
}

/** "Since last time": what got done, what did not, what moved, and what that suggests for today */
export async function buildBrief(clientId: string, sid: string, role: Role): Promise<Brief> {
  const { plan, cur, prev, prevRoom } = await previous(clientId, sid);
  const room = await readRoom(clientId, sid);
  const today = todayET();
  const done = prev ? plan.tasks.filter((t) => t.sessionId === prev.id && t.status === "done").map((t) => t.title) : [];
  const open = plan.tasks.filter((t) => (t.sessionId === sid && t.carriedFrom) || (prev && t.sessionId === prev.id && t.status !== "done")).filter((t) => t.status !== "done")
    .map((t) => ({ title: t.title, owner: t.owner, due: t.due, overdue: !!t.due && t.due < today }));
  const pItems = itemsOf(prevRoom).sort((a, b) => a.o - b.o);
  const decisions = pItems.filter((i) => i.kind === "decision").map((i) => i.text).filter(Boolean);
  const parked = pItems.filter((i) => i.kind === "park").map((i) => i.text).filter(Boolean);
  const num = (v: string) => Number(String(v).replace(/[^0-9.-]/g, ""));
  const moves = pItems.filter((i) => i.kind === "metric" && i.value?.trim()).map((i) => {
    const from = i.prev?.trim() ?? "", to = i.value!.trim();
    const a = num(from), b = num(to);
    const dir: "up" | "down" | "same" = !from || Number.isNaN(a) || Number.isNaN(b) || a === b ? "same" : b > a ? "up" : "down";
    return { name: i.text, from, to, dir };
  });
  let bloom: Brief["bloom"] = null;
  const rec = (await listToolRecords(clientId))["bloom-check"];
  const entries = ((rec?.data as { entries?: { date: string; scores: Record<string, number> }[] } | null)?.entries ?? []);
  if (rec && (role === "client" || !rec.private) && entries.length) {
    const areas = CHECK_AREAS["bloom-check"];
    const last = entries[entries.length - 1], before = entries.length > 1 ? entries[entries.length - 2] : null;
    const avg = (e: { scores: Record<string, number> }) => Math.round((areas.reduce((n, a) => n + (e.scores[a.id] || 0), 0) / areas.length) * 10) / 10;
    const low = [...areas].sort((a, b) => (last.scores[a.id] || 0) - (last.scores[b.id] || 0))[0];
    bloom = { date: last.date, lowest: low.area, step: low.step, avg: avg(last), prevAvg: before ? avg(before) : null };
  }
  const inRoom = new Set(itemsOf(room).filter((i) => i.kind === "idea").map((i) => i.text.trim().toLowerCase()));
  const backlog = parseList<{ text: string; stage: string }>(fieldOf(room, "backlog")).filter((b) => !inRoom.has(b.text.toLowerCase()));
  const nextFocus = fieldOf(prevRoom, "nextFocus");
  const daysSince = prev && prev.date ? daysBetween(prev.date, cur?.date || today) : null;
  const who = (r: Role) => (r === "us" ? "Jadon" : "client");
  const s: string[] = [];
  if (nextFocus) s.push(`Last time you agreed this session should focus on: ${nextFocus}`);
  if (open.length) s.push(`${open.length} action item${open.length === 1 ? " is" : "s are"} not finished${open.some((o) => o.overdue) ? `, ${open.filter((o) => o.overdue).length} past due` : ""}. Start with what got in the way.`);
  if (open.filter((o) => o.owner === "us").length) s.push(`${open.filter((o) => o.owner === "us").length} of the open items ${open.filter((o) => o.owner === "us").length === 1 ? "is" : "are"} ${who("us")}'s. Give an update first.`);
  const bad = moves.filter((m) => worse(m.name, m.from, m.to)), good = moves.filter((m) => m.dir !== "same" && !worse(m.name, m.from, m.to));
  for (const m of bad.slice(0, 2)) s.push(`${m.name} went ${m.dir}, from ${m.from} to ${m.to}. Worth understanding why.`);
  for (const m of good.slice(0, 1)) s.push(`${m.name} went ${m.dir}, from ${m.from} to ${m.to}. Name what caused it so it can be repeated.`);
  if (bloom) s.push(`The latest Bloom Check (${bloom.avg} of 5${bloom.prevAvg !== null ? `, was ${bloom.prevAvg}` : ""}) points to ${bloom.lowest} as the growing edge.`);
  if (decisions.length) s.push(`Check that last session's ${decisions.length === 1 ? "decision" : `${decisions.length} decisions`} held.`);
  if (parked.length) s.push(parked.length === 1 ? `"${parked[0]}" is in the parking lot. Is it ready now?` : `${parked.length} items are in the parking lot. Is one of them ready now?`);
  if (daysSince !== null && daysSince >= 45) s.push(`It has been ${daysSince} days since you last met. Ask what has changed in the business and in life.`);
  if (prev && done.length && !open.length) s.push(`Everything from last time got done. Celebrate it, then raise the bar.`);
  return { prev: prev ? { title: prev.title, date: prev.date, type: fieldOf(prevRoom, "type") } : null, done, open, decisions, parked, nextFocus, moves, bloom, backlog: backlog.slice(0, 40), suggestions: s.slice(0, 7), daysSince };
}

type TaskOp = { op: "add" | "set" | "del"; id?: string; title?: string; owner?: string; due?: string; status?: string };
/** Action items live on the strategy plan, so they show everywhere tasks do */
export async function applyTaskOps(client: Client, sid: string, role: Role, ops: TaskOp[]) {
  if (!ops.length) return;
  const plan = await getPlan(client.id);
  for (const op of ops.slice(0, 20)) {
    if (op.op === "add") {
      const title = String(op.title ?? "").trim().slice(0, 300);
      if (!title) continue;
      const owner = role === "client" ? "client" : op.owner === "us" ? "us" : "client";
      plan.tasks.push({ id: newId(), sessionId: sid, title, detail: "", owner, due: /^\d{4}-\d{2}-\d{2}$/.test(String(op.due)) ? String(op.due) : "", status: "todo", link: { type: "", refId: "", label: "", url: "" }, createdBy: role, comments: [], domain: "" });
      continue;
    }
    const t = plan.tasks.find((x) => x.id === op.id);
    if (!t) continue;
    const mine = role === "us" || t.owner === "client";
    if (op.op === "del") { if (role === "us" || t.createdBy === "client") plan.tasks = plan.tasks.filter((x) => x.id !== t.id); continue; }
    if (!mine) continue;
    if (op.status === "todo" || op.status === "doing" || op.status === "done") t.status = op.status;
    if (typeof op.title === "string" && op.title.trim()) t.title = op.title.slice(0, 300);
    if (typeof op.due === "string") t.due = /^\d{4}-\d{2}-\d{2}$/.test(op.due) ? op.due : "";
    if (role === "us" && (op.owner === "us" || op.owner === "client")) t.owner = op.owner;
  }
  await savePlan(await sanitizePlan(plan, plan, client));
}

/** Copy the room's outcome onto the session in the plan, so the recap lives with the rest of their work */
export async function publishRecap(client: Client, sid: string, close: boolean) {
  const room = await readRoom(client.id, sid);
  const plan = await getPlan(client.id);
  const s = plan.sessions.find((x) => x.id === sid);
  if (!s) return;
  const f = (name: string) => String(room[`f:${name}`]?.v ?? "").trim();
  const items = Object.entries(room).filter(([k]) => k.startsWith("i:")).map(([, e]) => e.v as RoomItem).filter((i) => !i.deleted && i.text.trim()).sort((a, b) => a.o - b.o);
  const chosen = items.filter((i) => i.kind === "idea" && i.stage === "chosen").map((i) => i.text);
  if (f("focus")) s.goal = f("focus").slice(0, 1000);
  s.decisions = items.filter((i) => i.kind === "decision").map((i) => i.text).slice(0, 40);
  s.notes = [f("outcome") && `What we set out to do: ${f("outcome")}`, chosen.length && `Ideas we chose: ${chosen.join("; ")}`, f("notes"), f("nextFocus") && `Next session should focus on: ${f("nextFocus")}`].filter(Boolean).join("\n\n").slice(0, 20000);
  if (close) s.status = "done";
  await savePlan(await sanitizePlan(plan, plan, client));
}

export function sessionTasks(tasks: PlanTask[], sid: string) {
  return tasks.filter((t) => t.sessionId === sid).map((t) => ({ id: t.id, title: t.title, owner: t.owner, due: t.due, status: t.status, createdBy: t.createdBy, carriedFrom: t.carriedFrom ?? "" }));
}

/** The scorecard across every session, oldest first, for showing change over time */
export interface ScoreSeries { name: string; points: { date: string; label: string; value: number; raw: string }[] }
const num = (raw: string) => { const m = String(raw).replace(/,/g, "").match(/-?\d+(\.\d+)?/); if (!m) return null; const n = Number(m[0]); return /\dk\b/i.test(raw) ? n * 1000 : /\dm\b/i.test(raw) ? n * 1000000 : n; };
export async function scorecardHistory(clientId: string, from = "", to = "9999"): Promise<ScoreSeries[]> {
  const plan = await getPlan(clientId);
  const sessions = plan.sessions.filter((s) => s.date && s.date >= from && s.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  const out = new Map<string, ScoreSeries>();
  for (const s of sessions) {
    const room = await readRoom(clientId, s.id);
    for (const e of Object.values(room)) {
      const i = e.v as RoomItem;
      if (!i || typeof i !== "object" || i.kind !== "metric" || i.deleted || !i.text?.trim()) continue;
      const v = num(i.value ?? "");
      if (v === null) continue;
      const k = i.text.trim().toLowerCase();
      if (!out.has(k)) out.set(k, { name: i.text.trim(), points: [] });
      out.get(k)!.points.push({ date: s.date, label: s.title, value: v, raw: i.value ?? "" });
    }
  }
  return [...out.values()];
}

/** Everything written in the rooms for a date range, for the review report */
export async function roomDigest(clientId: string, from: string, to: string) {
  const plan = await getPlan(clientId);
  const sessions = plan.sessions.filter((s) => s.date && s.date >= from && s.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  const wins: string[] = [], decisions: string[] = [], chosen: string[] = [];
  for (const s of sessions) {
    const items = Object.values(await readRoom(clientId, s.id)).map((e) => e.v as RoomItem).filter((i) => i && typeof i === "object" && !i.deleted && i.text?.trim()).sort((a, b) => a.o - b.o);
    wins.push(...items.filter((i) => i.kind === "win").map((i) => i.text));
    const d = items.filter((i) => i.kind === "decision").map((i) => i.text);
    decisions.push(...(d.length ? d : s.decisions));
    chosen.push(...items.filter((i) => i.kind === "idea" && i.stage === "chosen").map((i) => i.text));
  }
  return { sessions, wins: [...new Set(wins)], decisions: [...new Set(decisions)], chosen: [...new Set(chosen)] };
}
