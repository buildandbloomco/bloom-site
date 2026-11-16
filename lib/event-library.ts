import "server-only";
import { getAccess, saveAccess } from "./library";
import type { EventOffer } from "./event-def";

const guestNote = (e: Pick<EventOffer, "name">) => `${e.name} guest`;

/** Give an event guest the Wellness Library through the event's date. Never shortens or replaces a membership they already have. */
export async function grantEventLibrary(clientId: string, e: Pick<EventOffer, "name" | "libraryUntil">) {
  if (!e.libraryUntil) return false;
  const a = await getAccess(clientId);
  if (a && a.status === "active" && (!a.until || a.until >= e.libraryUntil)) return false; // already has as much or more
  if (a && a.status !== "active" && !a.until) return false; // you paused or ended a real membership; leave it
  await saveAccess({
    clientId, plan: a?.plan ?? "individual", teamName: a?.teamName ?? "", status: "active", founding: a?.founding ?? false,
    since: a?.since ?? new Date().toISOString(), note: a?.note || guestNote(e), until: e.libraryUntil,
  });
  return true;
}

/** Take back event access (a removed complimentary seat), only if the event is what gave it */
export async function endEventLibrary(clientId: string, e: Pick<EventOffer, "name" | "libraryUntil">) {
  const a = await getAccess(clientId);
  if (a && a.note === guestNote(e) && a.until && a.until === e.libraryUntil) await saveAccess({ ...a, status: "ended" });
}
