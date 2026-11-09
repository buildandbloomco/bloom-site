import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import { listLeads } from "@/lib/leads";
import { allNotices } from "@/lib/paynotices";
import { listOrders } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const [leads, notices, orders] = await Promise.all([listLeads(), allNotices(), listOrders()]);
  const toConfirm = Object.values(notices).flat().filter((n) => n.status === "pending").length + orders.filter((o) => o.status === "pending" && o.method === "zelle").length;
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brandmark">
          <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
          <span style={{ fontSize: "0.9rem" }}>BUILD &amp; BLOOM</span>
        </div>
        <AdminNav newLeads={leads.filter((l) => l.status === "new").length} toConfirm={toConfirm} />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
