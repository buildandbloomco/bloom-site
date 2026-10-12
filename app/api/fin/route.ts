import { currentClient, isAdmin } from "@/lib/auth";
import { getClient, rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";
import { cleanSettings, cleanTx, delTx, forAdmin, getFin, listTx, putTx, saveFin } from "@/lib/finance";
import { activeShare, monthOf, r2, splitByPct, unallocated, type ShareLevel, type Tx } from "@/lib/finance-def";
import { nowET } from "@/lib/booking";
import { notifyAdmin } from "@/lib/notify";

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
  const tx = await listTx(me.client.id);
  if (!me.admin) return json({ view: "own", settings: s, tx });
  // You only see what the client has chosen to share, and every look is logged for them
  const sh = activeShare(s, nowET().date);
  if (sh.level !== "private") { s.accessLog = [new Date().toISOString(), ...(s.accessLog ?? [])].slice(0, 20); await saveFin(me.client.id, s); }
  return json(forAdmin(s, tx, sh.level, sh.includeTeam));
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
  // Build & Bloom can turn the feature on or off and ask to review. Everything else is the client's.
  if (me.admin) {
    if (b.op === "settings" && typeof b.patch?.enabled === "boolean") { s.enabled = b.patch.enabled; await saveFin(id, s); }
    else if (b.op === "requestAccess") { s.accessRequest = { at: new Date().toISOString(), note: String(b.note || "").slice(0, 500) }; await saveFin(id, s); }
    else return error(`Only ${me.client.name} can change their Money. You can view whatever they choose to share.`, 403);
    const sh = activeShare(s, nowET().date);
    return json(forAdmin(s, await listTx(id), sh.level, sh.includeTeam));
  }
  const tx = await listTx(id);
  const find = (tid: unknown) => tx.find((t) => t.id === String(tid));

  switch (b.op) {
    case "settings": {
      s = cleanSettings(b.patch ?? {}, s);
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
      const out = { view: "own", settings: s, tx: await listTx(id), added, skipped };
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
    case "share": {
      const level: ShareLevel = b.level === "summary" || b.level === "full" ? b.level : "private";
      const until = /^\d{4}-\d{2}-\d{2}$/.test(String(b.until)) ? String(b.until) : "";
      s.share = { level, includeTeam: level !== "private" && b.includeTeam === true, until: level === "private" ? "" : until, changedAt: new Date().toISOString() };
      if (level !== "private") s.accessRequest = null;
      await saveFin(id, s);
      const what = level === "private" ? "made their Money private" : level === "summary" ? "shared a summary of their Money" : "shared their Money for review";
      await notifyAdmin(`${me.client.name} ${what}`, [`${me.client.contactName || me.client.name} ${what}${s.share.includeTeam ? ", including team pay" : ""}${s.share.until ? ` until ${s.share.until}` : ""}.`], `/admin/clients/${id}/money`);
      break;
    }
    case "dismissRequest": { s.accessRequest = null; await saveFin(id, s); break; }
    case "addPay": {
      // Record a paycheck or contractor payment, and (by default) the money leaving the account
      const p = b.pay ?? {};
      const person = s.people.find((x) => x.id === String(p.personId));
      if (!person) return error("Choose a team member.");
      const rec = { id: newId(), personId: person.id, date: String(p.date), gross: Number(p.gross) || 0, employerCost: Number(p.employerCost) || 0, reimbursement: Number(p.reimbursement) || 0, hours: Number(p.hours) || 0, note: String(p.note || ""), txId: "" };
      const total = r2(Math.abs(rec.gross) + Math.abs(rec.employerCost) + Math.abs(rec.reimbursement));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.date) || !total) return error("Add a pay date and an amount.");
      if (b.alsoTx !== false) {
        const cat = person.kind === "contractor" ? "Contractors" : "Payroll";
        const t = cleanTx({ type: "out", amount: total, date: rec.date, desc: `${person.kind === "contractor" ? "Contractor" : "Payroll"}: ${person.name}`, category: s.expenseCategories.includes(cat) ? cat : "", bucket: s.buckets.some((x) => x.id === "opex") ? "opex" : "" }, s);
        if (t) { await putTx(id, t); rec.txId = t.id; }
      }
      s = cleanSettings({ pay: [...s.pay, rec] }, s);
      await saveFin(id, s);
      break;
    }
    case "deletePay": {
      const rec = s.pay.find((x) => x.id === String(b.id));
      if (!rec) return error("Not found.", 404);
      if (b.alsoTx && rec.txId && find(rec.txId)) await delTx(id, rec.txId);
      s.pay = s.pay.filter((x) => x.id !== rec.id);
      await saveFin(id, s);
      break;
    }
    default: return error("Unknown action.");
  }
  return json({ view: "own", settings: s, tx: await listTx(id) });
}
