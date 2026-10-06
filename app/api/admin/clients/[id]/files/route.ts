import { getClient } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import { eraseBlob, fileFrom, listFiles, removeFile, saveFile } from "@/lib/files";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!(await getClient(id))) return error("Not found.", 404);
  const f = fileFrom(await req.json().catch(() => ({})), "us", id, newId());
  if (!f) return error("That file could not be added.");
  await saveFile(id, f);
  return json({ files: await listFiles(id) });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const fid = new URL(req.url).searchParams.get("id") || "";
  const f = (await listFiles(id)).find((x) => x.id === fid);
  if (!f) return error("Not found.", 404);
  await removeFile(id, fid);
  await eraseBlob(f.url);
  return json({ files: await listFiles(id) });
}
