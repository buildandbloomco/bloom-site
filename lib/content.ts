import "server-only";
import { kv } from "./kv";
import { newId } from "./crypto";
import seed from "./content-seed.json";
import seed2 from "./content-seed-2.json";
import seed3 from "./content-seed-3.json";
import { CONTENT_STATUSES, CONTENT_TYPES, type ContentMedia, type ContentPost } from "./content-types";

const K = { posts: "bb:content:posts", mig: "bb:mig:content1" };

let seeding: Promise<void> | null = null;
function ensureSeed() {
  if (!seeding) {
    seeding = (async () => {
      if (await kv().get(K.mig)) return;
      const now = new Date().toISOString();
      for (const s of seed as Omit<ContentPost, "id" | "status" | "createdAt" | "updatedAt">[]) {
        const p: ContentPost = { ...s, id: newId(), status: s.type === "face" || !s.date ? "idea" : "ready", createdAt: now, updatedAt: now } as ContentPost;
        delete (p as unknown as Record<string, unknown>).key;
        await kv().hset(K.posts, p.id, p);
      }
      await kv().set(K.mig, now);
    })().then(async () => {
      // Second batch: the Hard Conversations workshop campaign. Face slots start as ideas; everything else comes with its graphics.
      if (await kv().get("bb:mig:content2")) return;
      const now = new Date().toISOString();
      for (const s of seed2 as Omit<ContentPost, "id" | "status" | "createdAt" | "updatedAt">[]) {
        const p: ContentPost = { ...s, id: newId(), status: s.type === "face" ? "idea" : s.media.length ? "ready" : "draft", createdAt: now, updatedAt: now } as ContentPost;
        delete (p as unknown as Record<string, unknown>).key;
        await kv().hset(K.posts, p.id, p);
      }
      await kv().set("bb:mig:content2", now);
    }).then(async () => {
      // Third batch: the custom portals and systems launch
      if (await kv().get("bb:mig:content3")) return;
      const now = new Date().toISOString();
      for (const s of seed3 as Omit<ContentPost, "id" | "status" | "createdAt" | "updatedAt">[]) {
        const p: ContentPost = { ...s, id: newId(), status: s.media.length ? "ready" : "idea", createdAt: now, updatedAt: now } as ContentPost;
        delete (p as unknown as Record<string, unknown>).key;
        await kv().hset(K.posts, p.id, p);
      }
      await kv().set("bb:mig:content3", now);
    }).catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

export async function listContent(): Promise<ContentPost[]> {
  await ensureSeed();
  return Object.values(await kv().hgetall<ContentPost>(K.posts)).sort(
    (a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.createdAt.localeCompare(b.createdAt) || a.title.localeCompare(b.title)
  );
}
export async function getContent(id: string) {
  await ensureSeed();
  return kv().hget<ContentPost>(K.posts, id);
}
export async function saveContent(p: ContentPost) {
  await kv().hset(K.posts, p.id, { ...p, updatedAt: new Date().toISOString() });
}
export async function deleteContent(id: string) {
  await kv().hdel(K.posts, id);
}

const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Clean up whatever the editor sends before saving */
export function sanitizeContent(b: Record<string, unknown>, prev: ContentPost): ContentPost {
  const type = CONTENT_TYPES.some((t) => t.id === b.type) ? (b.type as ContentPost["type"]) : prev.type;
  const status = CONTENT_STATUSES.some((s) => s.id === b.status) ? (b.status as ContentPost["status"]) : prev.status;
  const date = str(b.date, 10);
  const media: ContentMedia[] = Array.isArray(b.media)
    ? (b.media as Record<string, unknown>[]).slice(0, 30).map((m) => ({
        url: str(m.url, 1000).trim(),
        kind: (m.kind === "video" ? "video" : "image") as ContentMedia["kind"],
        label: str(m.label, 60),
      })).filter((m) => m.url.startsWith("/") || /^https:\/\//.test(m.url))
    : prev.media;
  return {
    ...prev,
    date: date === "" || isDate(date) ? date : prev.date,
    type,
    status,
    title: str(b.title, 200).trim() || prev.title,
    campaign: str(b.campaign, 80),
    media,
    caption: str(b.caption, 5000),
    hashtags: str(b.hashtags, 600),
    keywords: Array.isArray(b.keywords) ? (b.keywords as unknown[]).map((k) => str(k, 80).trim()).filter(Boolean).slice(0, 20) : prev.keywords,
    ytTitle: str(b.ytTitle, 200),
    notes: str(b.notes, 3000),
    launch: !!b.launch,
  };
}

export function blankContent(title: string, date: string, type: ContentPost["type"]): ContentPost {
  const now = new Date().toISOString();
  return {
    id: newId(), date: isDate(date) ? date : "", type, status: type === "face" || !isDate(date) ? "idea" : "draft",
    title, campaign: "", media: [], caption: "", hashtags: "", keywords: [], ytTitle: "", notes: "", launch: false, createdAt: now, updatedAt: now,
  };
}
