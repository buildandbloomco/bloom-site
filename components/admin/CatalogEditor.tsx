"use client";

import { useState } from "react";
import type { Catalog, LibraryItem, Service } from "@/lib/types";

export default function CatalogEditor({ initial, mode }: { initial: Catalog; mode: "services" | "library" }) {
  const [cat, setCat] = useState<Catalog>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function update(fn: (d: Catalog) => void) {
    setCat((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
    setMsg("");
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg(data.error || "Could not save.");
    setCat(data);
    setDirty(false);
    setMsg("Saved");
  }

  const move = <T,>(arr: T[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  const blankService = (kind: "core" | "addon"): Service => ({ id: "", name: "", kind, description: "", price: kind === "addon" ? 0 : null, unit: kind === "addon" ? "per session" : "", active: true });
  const blankLib = (): LibraryItem => ({ id: "", title: "", kind: "product", description: "", url: "", priceLabel: "", audience: "all", active: true });

  return (
    <div className="stack" style={{ gap: 20 }}>
      {mode === "services" ? (
        <>
          {(["core", "addon"] as const).map((kind) => (
            <section className="stack" key={kind} style={{ gap: 14 }}>
              <div className="row between">
                <div className="stack" style={{ gap: 2 }}>
                  <h3>{kind === "core" ? "Core services" : "Add-ons"}</h3>
                  <p className="small muted">
                    {kind === "core"
                      ? "What you include in packages. Clients see these as “Included.”"
                      : "Extras clients can choose and pay for in their portal. Leave price blank for “custom quote.”"}
                  </p>
                </div>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => update((d) => void d.services.push(blankService(kind)))}>+ Add</button>
              </div>
              {cat.services.map((s, i) =>
                s.kind !== kind ? null : (
                  <div className="panel" key={s.id || `new${i}`}>
                    <div className="grid-2" style={{ gap: 12 }}>
                      <label>Name<input type="text" value={s.name} onChange={(e) => update((d) => void (d.services[i].name = e.target.value))} /></label>
                      <div className="grid-2" style={{ gap: 12 }}>
                        <label>
                          Price ($)
                          <input type="number" min={0} step="0.01" placeholder="Custom quote" value={s.price ?? ""} onChange={(e) => update((d) => void (d.services[i].price = e.target.value === "" ? null : Number(e.target.value)))} />
                        </label>
                        <label>Unit<input type="text" placeholder="per session" value={s.unit} onChange={(e) => update((d) => void (d.services[i].unit = e.target.value))} /></label>
                      </div>
                    </div>
                    <label>Description<textarea value={s.description} onChange={(e) => update((d) => void (d.services[i].description = e.target.value))} /></label>
                    <div className="row between">
                      <div className="checks">
                        <label><input type="checkbox" checked={s.active} onChange={() => update((d) => void (d.services[i].active = !d.services[i].active))} /> Active</label>
                        <label><input type="checkbox" checked={s.showOnSite ?? s.kind === "core"} onChange={() => update((d) => void (d.services[i].showOnSite = !(d.services[i].showOnSite ?? d.services[i].kind === "core")))} /> Show on website</label>
                        {s.kind === "core" && (
                          <label style={{ gap: 8 }}>
                            Website section
                            <select value={s.lane ?? "both"} style={{ minHeight: 38, padding: "4px 10px", width: "auto" }} onChange={(e) => update((d) => void (d.services[i].lane = e.target.value as Service["lane"]))}>
                              <option value="orgs">Helping organizations</option>
                              <option value="business">Entrepreneurs & businesses</option>
                              <option value="both">Any team</option>
                            </select>
                          </label>
                        )}
                      </div>
                      <div className="row">
                        <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.services, i, -1))}>Move up</button>
                        <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.services, i, 1))}>Move down</button>
                        <button type="button" className="linkbtn danger small" onClick={() => confirm("Delete this service? Clients who had it will no longer see it.") && update((d) => void d.services.splice(i, 1))}>Delete</button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </section>
          ))}
        </>
      ) : (
        <section className="stack" style={{ gap: 14 }}>
          <div className="row between">
            <p className="small muted" style={{ maxWidth: 620 }}>
              Digital products, workshop links, recordings, and tools. “Everyone” items show in every client’s portal. “Only
              assigned” items show for the clients you check them for.
            </p>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => update((d) => void d.library.push(blankLib()))}>+ Add item</button>
          </div>
          {cat.library.map((l, i) => (
            <div className="panel" key={l.id || `new${i}`}>
              <div className="grid-2" style={{ gap: 12 }}>
                <label>Title<input type="text" value={l.title} onChange={(e) => update((d) => void (d.library[i].title = e.target.value))} /></label>
                <label>Link<input type="url" placeholder="https://..." value={l.url} onChange={(e) => update((d) => void (d.library[i].url = e.target.value))} /></label>
                <label>
                  Type
                  <select value={l.kind} onChange={(e) => update((d) => void (d.library[i].kind = e.target.value as LibraryItem["kind"]))}>
                    <option value="product">Digital product</option>
                    <option value="workshop">Workshop or training</option>
                    <option value="resource">Resource</option>
                  </select>
                </label>
                <label>Date <span className="hint">for workshops and events</span><input type="date" value={l.date ?? ""} onChange={(e) => update((d) => void (d.library[i].date = e.target.value))} /></label>
                <label>Price label<input type="text" placeholder="Free, $27, Included" value={l.priceLabel} onChange={(e) => update((d) => void (d.library[i].priceLabel = e.target.value))} /></label>
                <label>
                  Who sees it
                  <select value={l.audience} onChange={(e) => update((d) => void (d.library[i].audience = e.target.value as LibraryItem["audience"]))}>
                    <option value="all">Everyone</option>
                    <option value="assigned">Only assigned clients</option>
                  </select>
                </label>
              </div>
              <label>Description<textarea value={l.description} onChange={(e) => update((d) => void (d.library[i].description = e.target.value))} /></label>
              <div className="row between">
                <div className="checks">
                  <label><input type="checkbox" checked={l.active} onChange={() => update((d) => void (d.library[i].active = !d.library[i].active))} /> Active</label>
                  <label><input type="checkbox" checked={l.showOnSite ?? l.kind !== "resource"} onChange={() => update((d) => void (d.library[i].showOnSite = !(d.library[i].showOnSite ?? d.library[i].kind !== "resource")))} /> Show on website</label>
                </div>
                <div className="row">
                  <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.library, i, -1))}>Move up</button>
                  <button type="button" className="linkbtn small" onClick={() => update((d) => move(d.library, i, 1))}>Move down</button>
                  <button type="button" className="linkbtn danger small" onClick={() => confirm("Delete this item?") && update((d) => void d.library.splice(i, 1))}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {(dirty || msg) && (
        <div className="savebar" role="status">
          <span className="small">{saving ? "Saving..." : msg || "Unsaved changes"}</span>
          {dirty && <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>Save changes</button>}
        </div>
      )}
    </div>
  );
}
