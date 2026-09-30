import { getPiece, libraryViewer, saveAnswers, getAnswers, canSee } from "@/lib/library";
import { error, json } from "@/lib/http";

// Private journaling: saved per member, never shown to anyone else
export async function POST(req: Request) {
  const v = await libraryViewer();
  if (!v) return error("Please sign in again.", 401);
  if (v.preview || !v.client) return error("Preview mode: answers aren't saved.", 400);
  const b = await req.json().catch(() => null);
  const piece = b ? await getPiece(String(b.pieceId || "")) : null;
  if (!piece || !canSee(piece, v) || typeof b.answers !== "object") return error("Bad request.");
  const valid = new Set(piece.prompts.map((p) => p.id));
  const cur = await getAnswers(v.client.id, piece.id);
  for (const [k, val] of Object.entries(b.answers as Record<string, unknown>)) {
    if (!valid.has(k)) continue;
    if (typeof val === "string") cur[k] = val.slice(0, 20000);
    else if (Array.isArray(val)) cur[k] = val.map((x) => String(x).slice(0, 500)).slice(0, 50);
  }
  await saveAnswers(v.client.id, piece.id, cur);
  return json({ ok: true });
}
