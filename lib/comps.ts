import "server-only";
import { kv } from "./kv";

/** A complimentary seat you gave someone at an event. It holds a seat but has no payment. */
export interface Comp {
  clientId: string;
  tierId: string;
  at: string;
  note: string;
  /** Printed on her gift certificate */
  message?: string;
  /** The event tag was added to their lead by this comp (so removing the comp takes it off again) */
  addedTag?: boolean;
}

const key = (slug: string) => `bb:comps:${slug}`;
/** The spot-pool reference a complimentary seat holds */
export const compRef = (clientId: string) => `comp-${clientId}`;

export async function listComps(slug: string): Promise<Comp[]> { return (await kv().get<Comp[]>(key(slug))) ?? []; }
export async function saveComps(slug: string, list: Comp[]) { await kv().set(key(slug), list); }
