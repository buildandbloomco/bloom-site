"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin", "Clients"],
  ["/admin/leads", "Leads"],
  ["/admin/courses", "Courses"],
  ["/admin/wellness", "Wellness Library"],
  ["/admin/waitlist", "Waitlist"],
  ["/admin/calendar", "Calendar"],
  ["/admin/content", "Content"],
  ["/admin/services", "Services & add-ons"],
  ["/admin/library", "Library"],
  ["/admin/settings", "Settings"],
];

export default function AdminNav({ newLeads = 0 }: { newLeads?: number }) {
  const path = usePathname();
  async function out() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return (
    <nav aria-label="Admin">
      {LINKS.map(([href, label]) => {
        const on = href === "/admin" ? path === "/admin" || path.startsWith("/admin/clients") : path.startsWith(href);
        return (
          <Link key={href} href={href} className={on ? "on" : ""}>
            {label}
            {href === "/admin/leads" && newLeads > 0 && <span className="tag gold" style={{ marginLeft: 8, padding: "2px 8px" }}>{newLeads}</span>}
          </Link>
        );
      })}
      <a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a>
      <a href="/portal" target="_blank" rel="noopener noreferrer">View client login ↗</a>
      <button type="button" onClick={out}>Sign out</button>
    </nav>
  );
}
