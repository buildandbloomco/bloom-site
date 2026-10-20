import { NextResponse } from "next/server";
import { currentClient } from "@/lib/auth";
import { getOrder, getProduct, ownedIds, readDlToken } from "@/lib/shop";

// A download link from a receipt (?t=), or from the buyer's portal (?p=<product id>)
export async function GET(req: Request) {
  const u = new URL(req.url);
  let productId = "";
  const t = readDlToken(u.searchParams.get("t"));
  if (t) {
    const o = await getOrder(t.orderId);
    if (o?.status === "paid") productId = t.productId;
  } else if (u.searchParams.get("p")) {
    const me = await currentClient();
    const pid = u.searchParams.get("p") || "";
    if (me && (await ownedIds(me.id)).includes(pid)) productId = pid;
  }
  const p = productId ? await getProduct(productId) : null;
  if (!p?.file) return new NextResponse("This download link has expired or isn't valid. Sign in to your portal to find your purchases, or reach out and we'll help.", { status: 404 });
  return NextResponse.redirect(new URL(p.file, req.url));
}
