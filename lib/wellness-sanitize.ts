import type { LibraryPiece, PieceType } from "./wellness-types";
import type { PromptType } from "./course-types";
import { slugify } from "./data";

const str = (v: unknown, max = 5000) => String(v ?? "").slice(0, max);
const num = (v: unknown, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const TYPES: PieceType[] = ["audio", "soundscape", "journal", "tool", "reading", "team"];
const PTYPES: PromptType[] = ["short", "long", "checklist", "scale"];
const rid = () => Math.random().toString(36).slice(2, 10);

/** Whether a piece's video plays on repeat */
export const loops = (p: Pick<LibraryPiece, "videoLoop" | "type">) => p.videoLoop ?? p.type === "soundscape";

export function sanitizePiece(b: Partial<LibraryPiece>, saved: LibraryPiece): LibraryPiece {
  return {
    ...saved,
    title: str(b.title, 200) || saved.title,
    slug: slugify(str(b.slug, 80) || str(b.title, 80) || saved.slug),
    type: TYPES.includes(b.type as PieceType) ? (b.type as PieceType) : saved.type,
    minutes: num(b.minutes, 0, 240),
    summary: str(b.summary, 600),
    when: str(b.when, 200),
    body: str(b.body, 40000),
    prompts: arr<LibraryPiece["prompts"][number]>(b.prompts).slice(0, 40).map((p) => ({
      id: str(p.id, 40).replace(/[^a-zA-Z0-9_-]/g, "") || rid(),
      type: PTYPES.includes(p.type) ? p.type : "long",
      label: str(p.label, 500),
      help: str(p.help, 300),
      columns: [],
      rows: [],
      blankRows: 0,
      options: arr<string>(p.options).map((x) => str(x, 200)).filter((x) => x.trim()).slice(0, 30),
    })).filter((p) => p.label.trim()),
    audioUrl: /^https?:\/\//.test(str(b.audioUrl)) ? str(b.audioUrl, 1000) : "",
    videoUrl: /^https?:\/\//.test(str(b.videoUrl)) ? str(b.videoUrl, 1000) : "",
    videoLoop: typeof b.videoLoop === "boolean" ? b.videoLoop : saved.videoLoop,
    adminNote: str(b.adminNote, 1000),
    teamOnly: !!b.teamOnly,
    collection: str(b.collection, 120) || "Starter library",
    status: b.status === "published" ? "published" : "draft",
    order: num(b.order, 0, 10000),
  };
}

/** Turn Google Drive and Dropbox share links into links an audio player can stream */
export function playableAudio(url: string): string {
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/) ?? url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (/dropbox\.com/.test(url)) {
    if (/[?&]dl=\d/.test(url)) return url.replace(/([?&])dl=\d/, "$1raw=1");
    if (/[?&]raw=1/.test(url)) return url;
    return url + (url.includes("?") ? "&" : "?") + "raw=1";
  }
  return url;
}
