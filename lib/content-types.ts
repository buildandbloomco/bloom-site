export const CONTENT_TYPES = [
  { id: "reel", label: "Reel" },
  { id: "carousel", label: "Carousel" },
  { id: "graphic", label: "Graphic" },
  { id: "story", label: "Story" },
  { id: "face", label: "Face content" },
  { id: "youtube", label: "YouTube" },
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number]["id"];

export const CONTENT_STATUSES = [
  { id: "idea", label: "Idea" },
  { id: "draft", label: "Draft" },
  { id: "ready", label: "Ready" },
  { id: "posted", label: "Posted" },
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number]["id"];

export interface ContentMedia {
  url: string;
  kind: "image" | "video";
  /** "Slide 2", "Story", "Thumbnail" */
  label: string;
}

export interface ContentPost {
  id: string;
  /** YYYY-MM-DD, or "" for an unscheduled idea */
  date: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  campaign: string;
  media: ContentMedia[];
  caption: string;
  hashtags: string;
  keywords: string[];
  /** YouTube only */
  ytTitle: string;
  notes: string;
  launch: boolean;
  createdAt: string;
  updatedAt: string;
}

export const contentTypeLabel = (t: string) => CONTENT_TYPES.find((x) => x.id === t)?.label ?? t;
export const contentStatusLabel = (s: string) => CONTENT_STATUSES.find((x) => x.id === s)?.label ?? s;

/** Preview image for the reels that come with the site */
export const posterFor = (url: string) => (/^\/content\/reels\/[^/]+\.mp4$/.test(url) ? url.replace(/\.mp4$/, ".jpg") : undefined);
