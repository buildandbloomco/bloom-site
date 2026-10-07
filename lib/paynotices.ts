import "server-only";
import { kv } from "./kv";

/** A client telling you "I sent this by Zelle". It becomes a recorded payment only when you confirm it arrived. */
export interface PayNotice {
  id: string;
  at: string;
  method: "zelle";
  amount: number;
  /** How much of it is for the package, and how much is add-ons */
  packageAmount: number;
  addOnTotal: number;
  addOnIds: string[];
  label: string;
  name: string;
  note: string;
  status: "pending" | "confirmed" | "dismissed";
}
const KEY = "bb:paynotices";
export async function listNotices(clientId: string): Promise<PayNotice[]> { return (await kv().hget<PayNotice[]>(KEY, clientId)) ?? []; }
export async function saveNotices(clientId: string, list: PayNotice[]) { await kv().hset(KEY, clientId, list.slice(0, 60)); }
