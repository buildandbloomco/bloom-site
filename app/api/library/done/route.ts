import { getDone, getPiece, libraryViewer, saveDone } from "@/lib/library";
import { error, json } from "@/lib/http";

export async function POST(req: Request) {
  const v = await libraryViewer();
  if (!v) return error("Please sign in again.", 401);
  if (v.preview || !v.client) return json({ ok: true, preview: true });
  const b = await req.json().catch(() => ({}));
  const piece = await getPiece(String(b.pieceId || ""));
  if (!piece) return error("Not found.", 404);
  const d = await getDone(v.client.id);
  if (b.done === false) delete d[piece.id];
  else d[piece.id] = new Date().toISOString();
  await saveDone(v.client.id, d);
  return json({ ok: true });
}
