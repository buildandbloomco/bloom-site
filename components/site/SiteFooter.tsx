import { bookProps } from "@/lib/booking";
import Link from "next/link";
import type { Settings } from "@/lib/types";

export default function SiteFooter({ s }: { s: Settings }) {
  return (
    <footer className="site-footer">
      <div className="wrap stack" style={{ gap: 40 }}>
        <div className="cols">
          <div className="stack" style={{ gap: 12 }}>
            <div className="brandmark">
              <img src="/logo.png" alt="" style={{ width: 46, height: 50 }} />
              <span style={{ color: "var(--on-dark)" }}>BUILD &amp; BLOOM COLLECTIVE</span>
            </div>
            <p className="small">{s.tagline}</p>
            <p className="small">{s.location}</p>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <p className="h">Work with us</p>
            <Link href="/services">Services</Link>
            <Link href="/masterclass">Sustained Healer Masterclass</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/wellness-library">Wellness Library</Link>
            <Link href="/workshops">Workshops & events</Link>
            <Link href="/guides">Free guidebooks</Link>
            <a {...bookProps(s)}>Book a free consult</a>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <p className="h">Collective</p>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/portal">Client portal</Link>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <p className="h">Connect</p>
            {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
            {s.phone && <span>{s.phone}</span>}
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
          </div>
        </div>
        <p className="tiny" style={{ color: "var(--on-dark-3)" }}>
          © {new Date().getFullYear()} {s.brandName}. Rooted in Justice. Built for Care.
        </p>
      </div>
    </footer>
  );
}
