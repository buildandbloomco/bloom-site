import { error, json, requireAdmin } from "@/lib/http";
import { cleanProducts, listProducts, saveProducts } from "@/lib/shop";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json({ products: await listProducts() });
}
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  const products = cleanProducts(b?.products);
  if (typeof products === "string") return error(products);
  await saveProducts(products);
  return json({ ok: true, products });
}
