"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** [link, label, also highlight for these paths] */
type Item = [string, string, string[]?];
const GROUPS: [string, Item[]][] = [
  ["People", [
    ["/admin", "Clients", ["/admin/clients"]],
    ["/admin/leads", "Leads"],
    ["/admin/calendar", "Calendar"],
  ]],
  ["Money & events", [
    ["/admin/payments", "Payments"],
    ["/admin/events", "Events"],
  ]],
  ["What you offer", [
    ["/admin/services", "Services & add-ons"],
    ["/admin/courses", "Courses"],
    ["/admin/shop", "Shop & books", ["/admin/library"]],
    ["/admin/wellness", "Wellness Library", ["/admin/waitlist"]],
  ]],
  ["Marketing", [
    ["/admin/content", "Content"],
  ]],
];

export default function AdminNav({ newLeads = 0, toConfirm = 0 }: { newLeads?: number; toConfirm?: number }) {
  const path = usePathname();
  async function out() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  const isOn = ([href, , also = []]: Item) =>
    (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`)) || also.some((a) => path === a || path.startsWith(`${a}/`));
  const badge = (n: number) => <span className="tag gold" style={{ marginLeft: 8, padding: "2px 8px" }}>{n}</span>;
  return (
    <nav aria-label="Admin">
      {GROUPS.map(([title, items]) => (
        <div key={title} className="nav-group">
          <span className="nav-head">{title}</span>
          {items.map((it) => (
            <Link key={it[0]} href={it[0]} className={isOn(it) ? "on" : ""}>
              {it[1]}
              {it[0] === "/admin/leads" && newLeads > 0 && badge(newLeads)}
              {it[0] === "/admin/payments" && toConfirm > 0 && <span title="Zelle payments to confirm">{badge(toConfirm)}</span>}
            </Link>
          ))}
        </div>
      ))}
      <div className="nav-group">
        <Link href="/admin/settings" className={path.startsWith("/admin/settings") ? "on" : ""}>Settings</Link>
        <a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a>
        <a href="/portal" target="_blank" rel="noopener noreferrer">View client login ↗</a>
        <button type="button" onClick={out}>Sign out</button>
      </div>
    </nav>
  );
}
