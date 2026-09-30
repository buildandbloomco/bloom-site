import "server-only";
import { kv } from "./kv";
import type { Lead } from "./types";

const KEY = "bb:leads";

export async function listLeads(): Promise<Lead[]> {
  const all = await kv().hgetall<Lead>(KEY);
  return Object.values(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLead(id: string): Promise<Lead | null> {
  return kv().hget<Lead>(KEY, id);
}

export async function saveLead(l: Lead) {
  await kv().hset(KEY, l.id, l);
}

export async function deleteLead(id: string) {
  await kv().hdel(KEY, id);
}
