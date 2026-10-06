import { currentClient } from "@/lib/auth";
import { rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";
import { eraseBlob, fileFrom, listFiles, removeFile, saveFile } from "@/lib/files";
import { notifyAdmin } from "@/lib/notify";

// After an upload finishes, the client's page records the file here so both of you can see it
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (!(await rateLimit(`file:${client.id}`, 60, 60 * 60))) return error("Too many tries. Try again later.", 429);
  const f = fileFrom(await req.json().catch(() => ({})), "client", client.id, newId());
  if (!f) return error("That file could not be added.");
  await saveFile(client.id, f);
  await notifyAdmin(`${client.name} shared a file`, [`${client.contactName || client.name} uploaded "${f.name}".`, f.note], `/admin/clients/${client.id}/desk`);
  return json({ files: await listFiles(client.id) });
}

// Clients can remove files they uploaded themselves
export async function DELETE(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  const id = new URL(req.url).searchParams.get("id") || "";
  const f = (await listFiles(client.id)).find((x) => x.id === id);
  if (!f) return error("Not found.", 404);
  if (f.by !== "client") return error("Only files you uploaded can be removed.", 403);
  await removeFile(client.id, id);
  await eraseBlob(f.url);
  return json({ files: await listFiles(client.id) });
}
