import "server-only";
import { cookies } from "next/headers";
import { normalizeCode, safeEqual, sign, verify } from "./crypto";
import { eventOpen, getEvent, type EventOffer } from "./event-def";

/** Room codes, said out loud at the event. Change them here. Codes are not case sensitive. */
const CODES: Record<string, string> = {
  create: process.env.EVENT_CODE_CREATE || "BLOOM",
};

const cookieName = (slug: string) => `bb_ev_${slug}`;

export function checkEventCode(slug: string, code: string): boolean {
  const want = CODES[slug];
  if (!want) return false;
  return safeEqual(normalizeCode(code), normalizeCode(want));
}

export async function grantEvent(e: EventOffer) {
  const secs = Math.max(60, Math.ceil((new Date(e.endsAt).getTime() - Date.now()) / 1000) + 3600);
  (await cookies()).set(cookieName(e.slug), sign(e.slug, secs), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: secs });
}

/** The event, if it is open and this browser entered the room code */
export async function eventAccess(slug: string): Promise<EventOffer | null> {
  const e = getEvent(slug);
  if (!e || !eventOpen(e)) return null;
  return verify((await cookies()).get(cookieName(slug))?.value) === slug ? e : null;
}
