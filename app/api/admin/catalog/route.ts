import { saveCatalog, slugify } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json, requireAdmin } from "@/lib/http";
import type { LibraryItem, Service } from "@/lib/types";

const str = (v: unknown, max = 2000) => String(v ?? "").slice(0, max);

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b || !Array.isArray(b.services) || !Array.isArray(b.library)) return error("Bad request.");
  // Existing ids never change (clients point at them). New items get an id from their name.
  const reserved = new Set<string>(
    [...b.services, ...b.library].map((x: { id?: string }) => String(x.id || "")).filter(Boolean)
  );
  const seen = new Set<string>();
  const uid = (id: string, fallback: string) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      return id;
    }
    let v = slugify(fallback) || newId();
    while (seen.has(v) || reserved.has(v)) v = `${slugify(fallback)}-${newId().slice(0, 4)}`;
    seen.add(v);
    return v;
  };
  const services: Service[] = b.services
    .filter((s: Service) => str(s.name).trim())
    .map((s: Service) => ({
      id: uid(s.id, s.name),
      name: str(s.name, 200),
      kind: s.kind === "core" ? "core" : "addon",
      description: str(s.description),
      price: s.price === null || (s.price as unknown) === "" || s.price === undefined ? null : Math.max(0, Math.round(Number(s.price) * 100) / 100),
      unit: str(s.unit, 80),
      active: !!s.active,
      showOnSite: s.showOnSite === undefined ? s.kind === "core" : !!s.showOnSite,
      lane: s.lane === "orgs" || s.lane === "business" ? s.lane : "both",
    }));
  const library: LibraryItem[] = b.library
    .filter((l: LibraryItem) => str(l.title).trim())
    .map((l: LibraryItem) => ({
      id: uid(l.id, "lib-" + l.title),
      title: str(l.title, 200),
      kind: ["workshop", "product", "resource"].includes(l.kind) ? l.kind : "resource",
      description: str(l.description),
      url: /^https?:\/\//i.test(str(l.url)) ? str(l.url, 1000) : "",
      priceLabel: str(l.priceLabel, 60),
      audience: l.audience === "assigned" ? "assigned" : "all",
      active: !!l.active,
      showOnSite: l.showOnSite === undefined ? l.kind !== "resource" : !!l.showOnSite,
      date: /^\d{4}-\d{2}-\d{2}$/.test(str(l.date)) ? str(l.date) : "",
    }));
  await saveCatalog({ services, library });
  return json({ services, library });
}
