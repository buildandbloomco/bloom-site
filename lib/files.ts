import "server-only";
import { kv } from "./kv";

/** A document shared between you and a client */
import type { SharedFile } from "./files-def";
export type { SharedFile };
const key = (clientId: string) => `bb:files:${clientId}`;
export async function listFiles(clientId: string): Promise<SharedFile[]> {
  return Object.values(await kv().hgetall<SharedFile>(key(clientId))).sort((a, b) => b.at.localeCompare(a.at));
}
export async function saveFile(clientId: string, f: SharedFile) { await kv().hset(key(clientId), f.id, f); }
export async function removeFile(clientId: string, id: string) { await kv().hdel(key(clientId), id); }
export { FILE_TYPES, FILE_ACCEPT, isBlobUrl, fileSize, CLIENT_MAX } from "./files-def";
import { isBlobUrl } from "./files-def";

/** Build a file record from what the browser sends, or null if it is not a file from your own storage */
export function fileFrom(b: Record<string, unknown>, by: "us" | "client", clientId: string, id: string): SharedFile | null {
  const url = String(b.url || "");
  if (!isBlobUrl(url)) return null;
  // Clients can only register files that were uploaded into their own folder
  if (by === "client" && !new URL(url).pathname.startsWith(`/clients/${clientId}/`)) return null;
  const name = String(b.name || "").replace(/[\r\n]/g, " ").trim().slice(0, 160) || "File";
  return { id, name, url, size: Math.max(0, Math.round(Number(b.size) || 0)), by, at: new Date().toISOString(), note: String(b.note || "").trim().slice(0, 300) };
}
/** Remove the stored file itself (best effort) */
export async function eraseBlob(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !isBlobUrl(url)) return;
  try { const { del } = await import("@vercel/blob"); await del(url); } catch { /* the link is already gone from the portal */ }
}
