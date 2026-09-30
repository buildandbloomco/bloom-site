import { listPieces, savePiece } from "@/lib/library";
import { newId } from "@/lib/crypto";
import { slugify } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import type { LibraryPiece } from "@/lib/wellness-types";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || "").trim().slice(0, 200) || "New piece";
  const all = await listPieces();
  let slug = slugify(title) || "piece";
  for (let i = 2; all.some((p) => p.slug === slug); i++) slug = `${slugify(title)}-${i}`;
  const now = new Date().toISOString();
  const p: LibraryPiece = {
    id: newId(), slug, title, type: ["audio", "soundscape", "journal", "tool", "reading", "team"].includes(b.type) ? b.type : "journal",
    minutes: 10, summary: "", when: "", body: "", prompts: [], audioUrl: "", videoUrl: "", adminNote: "", teamOnly: b.type === "team",
    collection: String(b.collection || "").slice(0, 120) || "Starter library", status: "draft",
    order: Math.max(0, ...all.map((x) => x.order)) + 1, createdAt: now, updatedAt: now,
  };
  if (!p.title) return error("Add a title.");
  await savePiece(p);
  return json(p);
}
