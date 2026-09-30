export function money(n: number): string {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function priceLabel(price: number | null, unit: string): string {
  if (price === null || price === undefined) return unit ? `Custom quote · ${unit}` : "Custom quote";
  return unit ? `${money(price)} ${unit}` : money(price);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "Dr. Alicia Grant" -> "Alicia" */
export function firstName(full: string): string {
  const parts = full.trim().split(/\s+/).filter((p) => !/^(dr|mr|mrs|ms|mx|rev|prof)\.?$/i.test(p));
  return parts[0] || full.trim();
}
