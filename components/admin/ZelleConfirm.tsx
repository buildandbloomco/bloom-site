"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** A Zelle payment a client says they sent. Confirm it once you see it in your bank. */
export default function ZelleConfirm({ clientId, notice }: { clientId: string; notice: { id: string; amount: number; name: string; label: string; at: string; note: string } }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(notice.amount));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function go(action: "confirm" | "dismiss") {
    if (action === "dismiss" && !confirm("Dismiss this notice? Nothing will be recorded as paid.")) return;
    setBusy(true); setMsg("");
    const res = await fetch(`/api/admin/clients/${clientId}/zelle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noticeId: notice.id, action, amount }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Something went wrong."); return; }
    router.refresh();
  }
  return (
    <div className="stack small" style={{ gap: 6 }}>
      <span><strong>Zelle reported:</strong> ${notice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} from {notice.name}<br /><span className="muted">{notice.label} · {new Date(notice.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{notice.note ? ` · ${notice.note}` : ""}</span></span>
      <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
        <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount that arrived" style={{ width: 110 }} />
        <button type="button" className="btn btn-sm btn-dark" disabled={busy} onClick={() => go("confirm")}>It arrived</button>
        <button type="button" className="linkbtn small" disabled={busy} onClick={() => go("dismiss")}>Dismiss</button>
      </div>
      {msg && <span className="error-text" role="alert">{msg}</span>}
    </div>
  );
}
