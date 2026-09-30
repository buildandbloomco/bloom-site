import Link from "next/link";
import { affirmationFor, canSee, getDone, getLibrarySettings, libraryViewer, listPieces } from "@/lib/library";
import { PIECE_TYPES, typeLabel, type PieceType } from "@/lib/wellness-types";
import { firstName } from "@/lib/format";

export default async function LibraryHome({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams;
  const v = (await libraryViewer())!;
  const [all, settings, done] = await Promise.all([listPieces(), getLibrarySettings(), v.client ? getDone(v.client.id) : Promise.resolve({} as Record<string, string>)]);
  const visible = all.filter((p) => canSee(p, v));
  const type = PIECE_TYPES.some((t) => t.id === sp.type) ? (sp.type as PieceType) : null;
  const shown = type ? visible.filter((p) => p.type === type) : visible;
  const collections = [...new Set(shown.map((p) => p.collection))];
  const doneCount = visible.filter((p) => done[p.id]).length;
  const types = PIECE_TYPES.filter((t) => visible.some((p) => p.type === t.id));
  const name = v.client ? firstName(v.client.contactName || v.client.name) : "";

  return (
    <main>
      <section className="lib-hero">
        <div className="wrap lib-hero-grid">
          <div className="stack" style={{ gap: 14 }}>
            <p className="eyebrow">The Wellness Library</p>
            <h1>{name ? <>Welcome back, <span className="ink">{name}.</span></> : "Care you can come back to."}</h1>
            <span className="rule" aria-hidden="true" />
            {settings.intro && <p className="lede">{settings.intro}</p>}
            {v.client && <p className="small muted">You&rsquo;ve completed {doneCount} of {visible.length} pieces.{v.access?.plan === "team" && v.access.teamName ? ` Team: ${v.access.teamName}.` : ""}</p>}
          </div>
          {settings.affirmations.length > 0 && (
            <div className="dark-card stack" style={{ gap: 10 }}>
              <span className="eyebrow gold">Today&rsquo;s affirmation</span>
              <p className="lib-affirmation">{affirmationFor(settings.affirmations)}</p>
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap stack" style={{ gap: 28 }}>
          <nav className="lib-filters" aria-label="Filter by type">
            <Link href="/library" className={`btn btn-sm ${!type ? "btn-dark" : "btn-ghost"}`} aria-current={!type ? "page" : undefined}>Everything</Link>
            {types.map((t) => (
              <Link key={t.id} href={`/library?type=${t.id}`} className={`btn btn-sm ${type === t.id ? "btn-dark" : "btn-ghost"}`} aria-current={type === t.id ? "page" : undefined}>{t.plural}</Link>
            ))}
          </nav>
          {!shown.length && <p className="muted">Nothing here yet. New pieces are added every month.</p>}
          {collections.map((c) => (
            <div key={c} className="stack" style={{ gap: 16 }}>
              <h2 className="lib-collection">{c}</h2>
              <div className="lib-grid">
                {shown.filter((p) => p.collection === c).map((p) => (
                  <Link key={p.id} href={`/library/${p.slug}`} className={`lib-card type-${p.type}`}>
                    <div className="row between" style={{ gap: 8 }}>
                      <span className="tag">{typeLabel(p.type)}</span>
                      <span className="tiny muted">{p.minutes ? `${p.minutes} min` : ""}</span>
                    </div>
                    <h3>{p.title}</h3>
                    <p className="small">{p.summary}</p>
                    <div className="row between lib-card-foot">
                      <span className="tiny muted">{p.when}</span>
                      {done[p.id] ? <span className="tag green">Done</span> : p.status === "draft" ? <span className="tag">Draft</span> : p.type === "audio" && !p.audioUrl ? <span className="tiny muted">Audio soon</span> : p.type === "soundscape" ? <span className="tiny muted">Video</span> : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
