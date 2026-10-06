"use client";

import { useEffect, useRef, useState } from "react";

/** Private notes that save as you type. Never shown to the client. */
export default function PrivateNotes({ clientId, initial }: { clientId: string; initial: string }) {
  const [v, setV] = useState(initial);
  const [state, setState] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setState("Saving...");
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/notes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: v }) });
      setState(res.ok ? "Saved" : "Not saved");
    }, 900);
    return () => clearTimeout(t);
  }, [v, clientId]);
  return (
    <>
      <textarea rows={7} value={v} onChange={(e) => setV(e.target.value)} aria-label="Private notes" placeholder="Only you see these." />
      <span className="tiny muted" role="status">{state}</span>
    </>
  );
}
