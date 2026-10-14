import "server-only";
import { kv } from "./kv";
import { getTool, TOOLS } from "./tools-def";

export interface ToolRecord { data: unknown; private: boolean; updatedAt: string }
const key = (clientId: string) => `bb:tools:${clientId}`;

export async function listToolRecords(clientId: string): Promise<Record<string, ToolRecord>> {
  return (await kv().hgetall<ToolRecord>(key(clientId))) ?? {};
}
export async function getToolRecord(clientId: string, tool: string): Promise<ToolRecord> {
  const r = await kv().hget<ToolRecord>(key(clientId), tool);
  return r ?? { data: null, private: !!getTool(tool)?.privateByDefault, updatedAt: "" };
}
export async function saveToolRecord(clientId: string, tool: string, r: ToolRecord) {
  await kv().hset(key(clientId), tool, r);
}
/** What admin may see: tools the client has used and not marked private */
export async function sharedTools(clientId: string) {
  const all = await listToolRecords(clientId);
  return TOOLS.map((t) => ({ tool: t, rec: all[t.id] })).filter((x) => x.rec && x.rec.data);
}

/** Keep saved tool data plain and bounded: strings, numbers, booleans, arrays, objects */
export function cleanData(v: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (typeof v === "string") return v.slice(0, 5000);
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 200).map((x) => cleanData(x, depth + 1));
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>).slice(0, 80)) {
      if (/^[A-Za-z0-9_-]{1,40}$/.test(k)) out[k] = cleanData(x, depth + 1);
    }
    return out;
  }
  return null;
}
