import "server-only";
import { kv } from "./kv";
import { currentClient, isAdmin } from "./auth";
import { seedPieces, SEED_LIBRARY_SETTINGS } from "./wellness-seed";
import type { LibraryAccess, LibraryPiece, LibrarySettings } from "./wellness-types";
import type { Client } from "./types";

const K = {
  pieces: "bb:lib:pieces",
  settings: "bb:lib:settings",
  members: "bb:lib:members",
  answers: "bb:lib:answers",
  done: "bb:lib:done",
  mig: "bb:mig:lib1",
  mig2: "bb:mig:lib2",
};

let seeding: Promise<void> | null = null;
function ensureSeed() {
  if (!seeding) {
    seeding = (async () => {
      if (await kv().get(K.mig)) {
        // Later additions: soundscapes
        if (!(await kv().get(K.mig2))) {
          const now = new Date().toISOString();
          const have = await kv().hgetall<LibraryPiece>(K.pieces);
          for (const p of seedPieces(now)) if (p.type === "soundscape" && !have[p.id]) await kv().hset(K.pieces, p.id, p);
          await kv().set(K.mig2, now);
        }
        return;
      }
      const now = new Date().toISOString();
      for (const p of seedPieces(now)) await kv().hset(K.pieces, p.id, p);
      if (!(await kv().get(K.settings))) await kv().set(K.settings, SEED_LIBRARY_SETTINGS);
      await kv().set(K.mig, now);
      await kv().set(K.mig2, now);
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

export async function listPieces(): Promise<LibraryPiece[]> {
  await ensureSeed();
  return Object.values(await kv().hgetall<LibraryPiece>(K.pieces)).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
export async function getPiece(id: string) {
  await ensureSeed();
  return kv().hget<LibraryPiece>(K.pieces, id);
}
export async function getPieceBySlug(slug: string) {
  return (await listPieces()).find((p) => p.slug === slug) ?? null;
}
export async function savePiece(p: LibraryPiece) {
  await kv().hset(K.pieces, p.id, { ...p, updatedAt: new Date().toISOString() });
}
export async function deletePiece(id: string) {
  await kv().hdel(K.pieces, id);
}

export async function getLibrarySettings(): Promise<LibrarySettings> {
  await ensureSeed();
  return { ...SEED_LIBRARY_SETTINGS, ...((await kv().get<LibrarySettings>(K.settings)) ?? {}) };
}
export async function saveLibrarySettings(s: LibrarySettings) {
  await kv().set(K.settings, s);
}

export async function listMembers(): Promise<LibraryAccess[]> {
  return Object.values(await kv().hgetall<LibraryAccess>(K.members)).sort((a, b) => b.since.localeCompare(a.since));
}
export async function getAccess(clientId: string) {
  return kv().hget<LibraryAccess>(K.members, clientId);
}
export async function saveAccess(a: LibraryAccess) {
  await kv().hset(K.members, a.clientId, a);
}
export async function removeAccess(clientId: string) {
  await kv().hdel(K.members, clientId);
}

/** Private journaling answers: only ever read back by the member who wrote them */
export async function getAnswers(clientId: string, pieceId: string): Promise<Record<string, unknown>> {
  return (await kv().hget<Record<string, unknown>>(K.answers, `${clientId}:${pieceId}`)) ?? {};
}
export async function saveAnswers(clientId: string, pieceId: string, a: Record<string, unknown>) {
  await kv().hset(K.answers, `${clientId}:${pieceId}`, a);
}
export async function getDone(clientId: string): Promise<Record<string, string>> {
  return (await kv().hget<Record<string, string>>(K.done, clientId)) ?? {};
}
export async function saveDone(clientId: string, d: Record<string, string>) {
  await kv().hset(K.done, clientId, d);
}

export interface Viewer {
  client: Client | null;
  access: LibraryAccess | null;
  /** You, looking at the library from admin */
  preview: boolean;
}

/** Who is looking at the library, and are they allowed in */
export async function libraryViewer(): Promise<Viewer | null> {
  const client = await currentClient();
  if (client) {
    const access = await getAccess(client.id);
    if (access && access.status === "active") return { client, access, preview: false };
  }
  if (await isAdmin()) return { client: null, access: { clientId: "", plan: "team", teamName: "", status: "active", founding: false, since: "", note: "" }, preview: true };
  return null;
}

export const canSee = (p: LibraryPiece, v: Viewer) => (p.status === "published" || v.preview) && (!p.teamOnly || v.access?.plan === "team" || v.preview);

/** Today's affirmation, the same for everyone all day */
export function affirmationFor(list: string[], date = new Date()) {
  if (!list.length) return "";
  const day = Math.floor(date.getTime() / 864e5);
  return list[day % list.length];
}
