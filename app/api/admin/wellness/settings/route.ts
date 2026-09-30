import { saveLibrarySettings } from "@/lib/library";
import { error, json, requireAdmin } from "@/lib/http";

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const s = {
    intro: String(b.intro ?? "").slice(0, 1000),
    affirmations: (Array.isArray(b.affirmations) ? b.affirmations : []).map((x: unknown) => String(x).trim().slice(0, 300)).filter(Boolean).slice(0, 100),
  };
  await saveLibrarySettings(s);
  return json(s);
}
