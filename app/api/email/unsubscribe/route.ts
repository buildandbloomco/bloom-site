import { readUnsubToken, resubscribe, unsubscribe } from "@/lib/email";

// Unsubscribe from the button on /unsubscribe, or one click from the inbox (List-Unsubscribe-Post)
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const t = url.searchParams.get("t") || String(form?.get("t") || "");
  const email = readUnsubToken(t);
  if (!email) return new Response("That link has expired.", { status: 400 });
  if (form?.get("action") === "resubscribe") await resubscribe(email);
  else await unsubscribe(email);
  // The inbox's one-click request just needs a 200; the page's form comes back to the page
  if (!form?.get("from")) return new Response("ok");
  return Response.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(t)}&done=${form.get("action") === "resubscribe" ? "back" : "1"}`, req.url), 303);
}
