import Link from "next/link";
import { notFound } from "next/navigation";
import { canSee, getAnswers, getDone, getPieceBySlug, libraryViewer, listPieces } from "@/lib/library";
import { typeLabel } from "@/lib/wellness-types";
import { loops, playableAudio } from "@/lib/wellness-sanitize";
import Md from "@/components/library/Md";
import PieceActions from "@/components/library/PieceActions";
import PrintButton from "@/components/course/PrintButton";

const PAUSES = /\s*\[pause[^\]]*\]/gi;

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = (await libraryViewer())!;
  const piece = await getPieceBySlug(slug);
  if (!piece || !canSee(piece, v)) notFound();
  const [answers, done, all] = await Promise.all([
    v.client ? getAnswers(v.client.id, piece.id) : Promise.resolve({}),
    v.client ? getDone(v.client.id) : Promise.resolve({} as Record<string, string>),
    listPieces(),
  ]);
  const list = all.filter((p) => canSee(p, v));
  const i = list.findIndex((p) => p.id === piece.id);
  const next = list.at(i + 1) ?? null;

  return (
    <main className="section" style={{ paddingTop: 36 }}>
      <article className="wrap narrow stack lib-piece" style={{ gap: 22 }}>
        <Link href="/library" className="small no-print">&larr; The library</Link>
        <div className="stack" style={{ gap: 10 }}>
          <p className="eyebrow">{typeLabel(piece.type)}{piece.minutes ? ` · ${piece.minutes} min` : ""}{piece.when ? ` · ${piece.when}` : ""}</p>
          <h1 className="lib-title">{piece.title}</h1>
          {piece.summary && <p className="lede">{piece.summary}</p>}
          {piece.status === "draft" && <p className="tag" style={{ alignSelf: "flex-start" }}>Draft: only you can see this</p>}
        </div>

        {piece.videoUrl ? (
          <div className="lib-video no-print">
            <video controls playsInline preload="metadata" loop={loops(piece)} src={piece.videoUrl} />
            {loops(piece) && <p className="tiny muted" style={{ margin: "8px 0 0" }}>This plays on a loop. Stop it whenever you&rsquo;re ready.</p>}
          </div>
        ) : piece.type === "soundscape" ? (
          <p className="lib-note no-print">The video for this soundscape is on its way.</p>
        ) : null}

        {piece.type === "audio" && (
          piece.audioUrl ? (
            <div className="card stack no-print" style={{ gap: 10 }}>
              <span className="eyebrow">Listen</span>
              <audio controls preload="metadata" src={playableAudio(piece.audioUrl)} style={{ width: "100%" }}>
                <a href={piece.audioUrl}>Open the recording</a>
              </audio>
            </div>
          ) : (
            <p className="lib-note no-print">The recording is on its way. Until then, read along below at your own pace.</p>
          )
        )}

        {piece.body && (
          piece.type === "audio" ? (
            <details className="card lib-readalong" open={!piece.audioUrl}>
              <summary>Read along</summary>
              <Md text={piece.body} strip={PAUSES} />
            </details>
          ) : (
            <div className="card"><Md text={piece.body} /></div>
          )
        )}

        <PieceActions
          pieceId={piece.id}
          prompts={piece.prompts}
          initial={answers}
          done={!!done[piece.id]}
          preview={v.preview}
          nextHref={next ? `/library/${next.slug}` : "/library"}
          nextLabel={next ? `Next: ${next.title}` : "Back to the library"}
        />
        <div className="row no-print"><PrintButton label={piece.prompts.length ? "Print with my answers" : "Print this page"} /></div>
      </article>
    </main>
  );
}
