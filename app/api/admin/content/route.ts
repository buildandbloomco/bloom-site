import { blankContent, saveContent } from "@/lib/content";
import { CONTENT_TYPES, type ContentType } from "@/lib/content-types";
import { error, json, requireAdmin } from "@/lib/http";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || "").trim().slice(0, 200);
  if (!title) return error("Add a title.");
  const type: ContentType = CONTENT_TYPES.some((t) => t.id === b.type) ? b.type : "graphic";
  const p = blankContent(title, String(b.date || ""), type);
  await saveContent(p);
  return json(p);
}
