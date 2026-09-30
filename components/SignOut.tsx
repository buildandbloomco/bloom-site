"use client";

export default function SignOut({ admin = false, light = false }: { admin?: boolean; light?: boolean }) {
  async function out() {
    await fetch(admin ? "/api/admin/logout" : "/api/logout", { method: "POST" });
    window.location.href = admin ? "/admin/login" : "/portal";
  }
  return (
    <button type="button" className={`btn btn-sm ${light ? "btn-ghost-light" : "btn-ghost"}`} onClick={out}>
      Sign out
    </button>
  );
}
