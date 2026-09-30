import "server-only";
import { kv } from "./kv";
import type { WaitlistEntry } from "./types";

const KEY = "bb:waitlist";

export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const all = await kv().hgetall<WaitlistEntry>(KEY);
  return Object.values(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getWaitlistEntry(id: string) {
  return kv().hget<WaitlistEntry>(KEY, id);
}
export async function saveWaitlistEntry(e: WaitlistEntry) {
  await kv().hset(KEY, e.id, e);
}
export async function deleteWaitlistEntry(id: string) {
  await kv().hdel(KEY, id);
}
