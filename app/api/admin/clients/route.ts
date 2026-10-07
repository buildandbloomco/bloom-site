import { blankClient, getSettings, saveClient, setClientCode, uniqueSlug } from "@/lib/data";
import { generateCode } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import { ensureAgreement } from "@/lib/agreements";
import { getPlan, savePlan } from "@/lib/workspace";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return error("Add the client or organization name.");
  const client = blankClient(name, await getSettings());
  client.slug = await uniqueSlug(name);
  // An existing client you already work with: active right away, nothing to pay on the site
  if (body.existing) {
    client.billing = "none";
    client.status = "active";
    client.package.title = "Our work together";
    client.welcome = "Welcome. This is your home base for our work together: your strategy sessions, tasks, resources, and next steps.";
  }
  await saveClient(client);
  for (let i = 0; i < 5; i++) {
    try {
      await setClientCode(client, generateCode());
      break;
    } catch {
      /* extremely unlikely collision, try again */
    }
  }
  if (body.existing) {
    const plan = await getPlan(client.id);
    await savePlan({ ...plan, enabled: true, title: "Your strategy sessions", focus: "What we are working on, session by session." });
  }
  await ensureAgreement(client, "You added them as an existing client.");
  return json({ id: client.id });
}
