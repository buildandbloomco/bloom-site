import type { Prompt } from "./course-types";

export type PieceType = "audio" | "soundscape" | "journal" | "tool" | "reading" | "team";

export const PIECE_TYPES: { id: PieceType; label: string; plural: string }[] = [
  { id: "audio", label: "Guided audio", plural: "Guided audio" },
  { id: "soundscape", label: "Soundscape", plural: "Soundscapes" },
  { id: "journal", label: "Journaling", plural: "Journaling" },
  { id: "tool", label: "Coping tool", plural: "Coping tools" },
  { id: "reading", label: "Reading", plural: "Readings" },
  { id: "team", label: "Team tool", plural: "Team tools" },
];
export const typeLabel = (t: PieceType) => PIECE_TYPES.find((x) => x.id === t)?.label ?? t;

/** One piece in the Wellness Library */
export interface LibraryPiece {
  id: string;
  slug: string;
  title: string;
  type: PieceType;
  minutes: number;
  /** One or two sentences shown on the library card */
  summary: string;
  /** When to use it, e.g. "For the start of the day" */
  when: string;
  /** The piece itself. Simple formatting: ## headings, - bullets, 1. steps, **bold**, *italic*, > quotes, | tables | */
  body: string;
  /** Private journaling fields shown under the piece */
  prompts: Prompt[];
  /** Audio: a link to the recording (MP3, Dropbox, or Google Drive share link) */
  audioUrl: string;
  /** Video: an uploaded file or a link (MP4). Soundscapes loop automatically. */
  videoUrl: string;
  /** Admin-only note, e.g. "Script approved, waiting on narrator" */
  adminNote: string;
  teamOnly: boolean;
  /** Grouping shown in the library, e.g. "Starter library" or "December: Rest and the holidays" */
  collection: string;
  status: "draft" | "published";
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibrarySettings {
  intro: string;
  affirmations: string[];
}

/** Who can open the library (kept separate from client records) */
export interface LibraryAccess {
  clientId: string;
  plan: "individual" | "team";
  teamName: string;
  status: "active" | "paused" | "ended";
  founding: boolean;
  since: string;
  note: string;
}
