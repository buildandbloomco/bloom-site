import "server-only";
import { kv } from "./kv";
import { ACCOUNTS, blankBuild, BUILD_KINDS, FIELD, STAGES, type Build } from "./build-def";

const KEY = "bb:builds";
export async function getBuild(clientId: string): Promise<Build> {
  return { ...blankBuild(), ...((await kv().hget<Build>(KEY, clientId)) ?? {}) };
}
export async function saveBuild(clientId: string, b: Build) { await kv().hset(KEY, clientId, b); }

const isUrl = (v: string) => /^https:\/\/[^\s]+$/i.test(v);
/** Merge a few intake answers into the saved ones. Only known questions are accepted, so two people typing never wipe each other's other answers. */
export function applyIntake(b: Build, patch: unknown) {
  if (!patch || typeof patch !== "object") return;
  for (const [k, raw] of Object.entries(patch as Record<string, unknown>).slice(0, 80)) {
    const f = FIELD.get(k);
    if (!f) continue;
    if (f.type === "multi") b.intake[k] = (Array.isArray(raw) ? raw : []).map(String).filter((x) => f.options!.includes(x));
    else if (f.type === "choice") b.intake[k] = f.options!.includes(String(raw)) ? String(raw) : "";
    else if (f.type === "color") b.intake[k] = /^#[0-9a-f]{6}$/i.test(String(raw)) ? String(raw).toLowerCase() : "";
    else b.intake[k] = String(raw ?? "").slice(0, f.type === "long" ? 6000 : 500);
  }
}
export function applyAccounts(b: Build, patch: unknown) {
  if (!patch || typeof patch !== "object") return;
  for (const a of ACCOUNTS) {
    const v = (patch as Record<string, unknown>)[a.key];
    if (v === "done" || v === "todo") b.accounts[a.key] = v;
  }
}
/** The parts only you control */
export function applyAdmin(b: Build, x: Record<string, unknown>) {
  if (typeof x.enabled === "boolean") b.enabled = x.enabled;
  if (BUILD_KINDS.some((k) => k.id === x.kind)) b.kind = x.kind as Build["kind"];
  if (STAGES.some((s) => s.id === x.stage)) b.stage = x.stage as Build["stage"];
  if (typeof x.targetDate === "string") b.targetDate = /^\d{4}-\d{2}-\d{2}$/.test(x.targetDate) ? x.targetDate : "";
  if (typeof x.previewUrl === "string") b.previewUrl = isUrl(x.previewUrl.trim()) ? x.previewUrl.trim().slice(0, 500) : "";
  if (typeof x.liveUrl === "string") b.liveUrl = isUrl(x.liveUrl.trim()) ? x.liveUrl.trim().slice(0, 500) : "";
}
export const cleanLink = (v: unknown) => (isUrl(String(v ?? "").trim()) ? String(v).trim().slice(0, 500) : "");
