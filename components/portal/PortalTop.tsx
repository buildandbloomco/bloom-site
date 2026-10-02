import Link from "next/link";
import SignOut from "@/components/SignOut";

/** Header for portal sub-pages (plan, assessment) */
export default function PortalTop({ slug, brand, title }: { slug: string; brand: string; title: string }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href={`/p/${slug}`} className="brandmark" style={{ textDecoration: "none", color: "inherit" }}>
          <img src="/logo.png" alt="" style={{ width: 40, height: 44 }} />
          <span>{brand.toUpperCase()}</span>
        </Link>
        <nav className="topnav" aria-label="Workspace">
          <Link href={`/p/${slug}`}>Portal home</Link>
          <Link href={`/p/${slug}/plan`} aria-current={title === "plan" ? "page" : undefined}>Strategy plan</Link>
          <Link href={`/p/${slug}/assessment`} aria-current={title === "assessment" ? "page" : undefined}>Assessment</Link>
        </nav>
        <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
          <Link href={`/p/${slug}`} className="btn btn-sm btn-ghost">&larr; Portal</Link>
          <SignOut />
        </div>
      </div>
    </header>
  );
}
