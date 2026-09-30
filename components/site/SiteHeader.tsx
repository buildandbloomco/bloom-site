import { isExternal } from "@/lib/booking";
import Link from "next/link";

export const NAV: [string, string][] = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Masterclass", "/masterclass"],
  ["Courses", "/courses"],
  ["Events", "/workshops"],
  ["Contact", "/contact"],
];

export default function SiteHeader({ bookingUrl }: { bookingUrl: string }) {
  const ext = isExternal(bookingUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brandmark" aria-label="Build & Bloom Collective home">
          <img src="/logo.png" alt="" />
          <span>BUILD &amp; BLOOM COLLECTIVE</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="link">{label}</Link>
          ))}
          <Link href="/portal" className="btn btn-ghost btn-sm">Client portal</Link>
          <a href={bookingUrl} className="btn btn-primary btn-sm" {...ext}>Book a consult</a>
        </nav>
        <details className="mobile-nav">
          <summary className="btn btn-ghost btn-sm" aria-label="Menu">Menu</summary>
          <div className="panel-menu">
            <Link href="/">Home</Link>
            {NAV.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            <Link href="/portal">Client portal</Link>
            <a href={bookingUrl} className="btn btn-primary btn-sm" {...ext} style={{ marginTop: 8, color: "var(--ivory)" }}>Book a consult</a>
          </div>
        </details>
      </div>
    </header>
  );
}
