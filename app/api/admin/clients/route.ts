import { blankClient, getSettings, saveClient, setClientCode, uniqueSlug } from "@/lib/data";
import { generateCode } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return error("Add the client or organization name.");
  const client = blankClient(name, await getSettings());
  client.slug = await uniqueSlug(name);
  await saveClient(client);
  for (let i = 0; i < 5; i++) {
    try {
      await setClientCode(client, generateCode());
      break;
    } catch {
      /* extremely unlikely collision, try again */
    }
  }
  return json({ id: client.id });
}
