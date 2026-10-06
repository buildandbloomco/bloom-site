import "server-only";
import { kv } from "./kv";
import { getPlan, savePlan, sanitizePlan } from "./workspace";
import { newId } from "./crypto";
import type { Client } from "./types";
import type { PlanTask } from "./plan-types";
import { DEFAULT_METRICS, KEY_RE, type Entry, type Role, type RoomItem } from "./room-def";

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

/** First time a room opens: bring forward last session's open ideas, parking lot, and the numbers you track */
export async function seedRoom(clientId: string, sid: string) {
  const plan = await getPlan(clientId);
  const cur = plan.sessions.find((s) => s.id === sid);
  if (!cur) return;
  const prev = plan.sessions.filter((s) => s.id !== sid && s.date && (!cur.date || s.date <= cur.date)).sort((a, b) => a.date.localeCompare(b.date)).pop();
  const old = prev ? await readRoom(clientId, prev.id) : {};
  const k = key(clientId, sid);
  const at = Date.now();
  let o = at;
  const put = (item: RoomItem) => kv().hset(k, `i:${item.id}`, { v: item, by: "us", at });
  const olds = Object.values(old).map((e) => e.v as RoomItem).filter((i) => i && typeof i === "object" && !i.deleted);
  const metrics = olds.filter((i) => i.kind === "metric").sort((a, b) => a.o - b.o);
  if (metrics.length) for (const m of metrics) await put({ id: newId(), kind: "metric", text: m.text, by: "us", o: o++, value: "", prev: m.value || m.prev || "" });
  else for (const name of DEFAULT_METRICS) await put({ id: newId(), kind: "metric", text: name, by: "us", o: o++, value: "", prev: "" });
  for (const i of olds.filter((x) => x.kind === "idea").sort((a, b) => a.o - b.o)) {
    await put({ ...i, id: newId(), o: o++, stage: i.stage === "new" ? "existing" : i.stage, votes: {} });
  }
  for (const i of olds.filter((x) => x.kind === "park").sort((a, b) => a.o - b.o)) await put({ ...i, id: newId(), o: o++ });
  if (cur.goal) await kv().hset(k, "f:focus", { v: cur.goal, by: "us", at });
  await kv().hset(k, "f:seeded", { v: prev ? prev.title : "first", by: "us", at });
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
  s.notes = [f("outcome") && `What we set out to do: ${f("outcome")}`, chosen.length && `Ideas we chose: ${chosen.join("; ")}`, f("notes")].filter(Boolean).join("\n\n").slice(0, 20000);
  if (close) s.status = "done";
  await savePlan(await sanitizePlan(plan, plan, client));
}

export function sessionTasks(tasks: PlanTask[], sid: string) {
  return tasks.filter((t) => t.sessionId === sid).map((t) => ({ id: t.id, title: t.title, owner: t.owner, due: t.due, status: t.status, createdBy: t.createdBy, carriedFrom: t.carriedFrom ?? "" }));
}
