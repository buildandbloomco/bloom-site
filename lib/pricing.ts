// Shared by the portal (to show the summary) and the server (to charge). The server always recalculates.

export type PayOption = "retainer" | "balance" | "custom" | "addons";

export interface PayChoice {
  id: PayOption;
  label: string;
  detail: string;
  amount: number;
}

export interface Investment {
  total: number;
  retainer: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function outstanding(inv: Investment, paid: number): number {
  return Math.max(0, r2((Number(inv.total) || 0) - paid));
}

export function payChoices(inv: Investment, paid: number): PayChoice[] {
  const out: PayChoice[] = [];
  const owe = outstanding(inv, paid);
  const retainerLeft = Math.max(0, r2((Number(inv.retainer) || 0) - paid));
  if (retainerLeft > 0 && retainerLeft < owe) {
    out.push({ id: "retainer", label: "Retainer to begin", detail: "Reserves your start date", amount: retainerLeft });
  }
  if (owe > 0) {
    out.push({ id: "balance", label: "Full remaining balance", detail: "Pay everything at once", amount: owe });
    out.push({ id: "custom", label: "Another amount", detail: "Put any amount toward your balance", amount: 0 });
  }
  out.push({ id: "addons", label: "Add-ons only", detail: "Just the add-ons you selected", amount: 0 });
  return out;
}

export interface ChargeLine {
  label: string;
  amount: number;
}

export function buildCharge(opts: {
  inv: Investment;
  paid: number;
  option: PayOption;
  customAmount?: number;
  addOns: { name: string; price: number | null }[];
  packageTitle?: string;
}): { lines: ChargeLine[]; total: number; error?: string } {
  const { inv, paid, option, addOns } = opts;
  const lines: ChargeLine[] = [];
  const owe = outstanding(inv, paid);
  const name = opts.packageTitle || "Your package";
  const choice = payChoices(inv, paid).find((c) => c.id === option);
  if (!choice) return { lines, total: 0, error: "That payment option is not available." };

  if (option === "retainer" || option === "balance") {
    lines.push({ label: `${name}: ${choice.label.toLowerCase()}`, amount: choice.amount });
  } else if (option === "custom") {
    const amt = r2(Number(opts.customAmount) || 0);
    if (amt < 1) return { lines, total: 0, error: "Enter an amount of at least $1." };
    if (amt > owe) return { lines, total: 0, error: `That is more than your remaining balance.` };
    lines.push({ label: `${name}: payment toward balance`, amount: amt });
  }
  for (const a of addOns) {
    if (typeof a.price === "number" && a.price > 0) lines.push({ label: `Add-on: ${a.name}`, amount: r2(a.price) });
  }
  const total = r2(lines.reduce((s, l) => s + l.amount, 0));
  if (total <= 0) return { lines, total, error: "Choose an amount or at least one priced add-on." };
  return { lines, total };
}
