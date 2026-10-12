import { currentClient, isAdmin } from "@/lib/auth";
import { getClient, rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";
import { cleanSettings, cleanTx, delTx, getFin, listTx, putTx, saveFin } from "@/lib/finance";
import { monthOf, r2, splitByPct, unallocated, type Tx } from "@/lib/finance-def";

/** You (signed in to admin, naming the client) or the client themselves */
async function who(clientId: string | null) {
  if (clientId && (await isAdmin())) { const c = await getClient(clientId); return c ? { admin: true, client: c } : null; }
  const c = await currentClient();
  return c && c.status !== "archived" ? { admin: false, client: c } : null;
}

export async function GET(req: Request) {
  const me = await who(new URL(req.url).searchParams.get("c"));
  if (!me) return error("Please sign in again.", 401);
  const s = await getFin(me.client.id);
  if (!s.enabled && !me.admin) return error("Money isn't turned on for your portal yet.", 404);
  return json({ settings: s, tx: await listTx(me.client.id) });
}

// Every change to a client's money plan goes through here
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const me = await who(typeof b.c === "string" ? b.c : null);
  if (!me) return error("Please sign in again.", 401);
  const id = me.client.id;
  if (!me.admin && !(await rateLimit(`fin:${id}`, 1500, 60 * 60))) return error("Too many changes at once. Give it a minute.", 429);
  let s = await getFin(id);
  if (!s.enabled && !me.admin) return error("Money isn't turned on for your portal yet.", 404);
  const tx = await listTx(id);
  const find = (tid: unknown) => tx.find((t) => t.id === String(tid));

  switch (b.op) {
    case "settings": {
      s = cleanSettings(b.patch ?? {}, s);
      if (me.admin && typeof b.patch?.enabled === "boolean") s.enabled = b.patch.enabled;
      await saveFin(id, s);
      break;
    }
    case "addTx": {
      const t = cleanTx(b.tx ?? {}, s);
      if (!t) return error("Add a date and an amount.");
      await putTx(id, t);
      break;
    }
    case "updateTx": {
      const prev = find(b.id);
      if (!prev) return error("That transaction is gone. Refresh the page.", 404);
      const t = cleanTx(b.tx ?? {}, s, prev);
      if (!t) return error("A transaction needs a date and an amount.");
      await putTx(id, t);
      break;
    }
    case "deleteTx": {
      if (!find(b.id)) return error("That transaction is gone. Refresh the page.", 404);
      await delTx(id, String(b.id));
      break;
    }
    case "import": {
      // Skip anything already entered with the same date, amount, direction, and description
      const seen = new Set(tx.map((t) => `${t.date}|${t.type}|${t.amount}|${t.desc.toLowerCase()}`));
      let added = 0, skipped = 0;
      for (const row of (Array.isArray(b.rows) ? b.rows : []).slice(0, 3000)) {
        const t = cleanTx({ ...row, source: "import" }, s);
        if (!t) continue;
        const k = `${t.date}|${t.type}|${t.amount}|${t.desc.toLowerCase()}`;
        if (seen.has(k)) { skipped++; continue; }
        seen.add(k); await putTx(id, t); added++;
      }
      const out = { settings: s, tx: await listTx(id), added, skipped };
      return json(out);
    }
    case "splitAll": {
      // Put every unsplit deposit in a month into the buckets by their percentages
      const m = String(b.month || "");
      for (const t of tx.filter((x) => x.type === "in" && monthOf(x.date) === m && unallocated(x) > 0)) {
        const add = splitByPct(unallocated(t), s.buckets);
        const alloc = { ...t.alloc };
        for (const [k, v] of Object.entries(add)) alloc[k] = r2((alloc[k] || 0) + v);
        await putTx(id, { ...t, alloc });
      }
      break;
    }
    case "payOwed": {
      // Mark an invoice or bill paid and record the money moving
      const o = s.owed.find((x) => x.id === String(b.id));
      if (!o) return error("Not found.", 404);
      if (o.status === "paid") return error("Already marked paid.");
      const t: Tx = { id: newId(), date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : new Date().toISOString().slice(0, 10), type: o.kind === "receivable" ? "in" : "out", amount: o.amount, desc: o.name, category: "", bucket: "", alloc: {}, receiptUrl: "", note: o.note, source: "owed", createdAt: new Date().toISOString() };
      if (t.amount > 0) await putTx(id, t);
      o.status = "paid"; o.paidTxId = t.id;
      await saveFin(id, s);
      break;
    }
    default: return error("Unknown action.");
  }
  return json({ settings: s, tx: await listTx(id) });
}
