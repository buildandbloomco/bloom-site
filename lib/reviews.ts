import "server-only";
import { kv } from "./kv";
import { getPlan } from "./workspace";
import { roomDigest, scorecardHistory } from "./room";

/** A progress review you have written up and (optionally) shared with the client */
export interface Review { from: string; to: string; summary: string; next: string; sharedAt: string | null }
const KEY = "bb:reviews";
export async function getReview(clientId: string): Promise<Review | null> { return kv().hget<Review>(KEY, clientId); }
export async function saveReview(clientId: string, r: Review) { await kv().hset(KEY, clientId, r); }

/** Everything the review page shows for a date range */
export async function reviewData(clientId: string, from: string, to: string) {
  const [plan, digest, scores] = await Promise.all([getPlan(clientId), roomDigest(clientId, from, to), scorecardHistory(clientId, from, to)]);
  const inRange = (d?: string) => !!d && d.slice(0, 10) >= from && d.slice(0, 10) <= to;
  const done = plan.tasks.filter((t) => t.status === "done" && inRange(t.doneAt));
  const open = plan.tasks.filter((t) => t.status !== "done");
  return {
    sessions: digest.sessions.map((s) => ({ id: s.id, title: s.title, date: s.date, goal: s.goal, held: s.status === "done" })),
    wins: digest.wins, decisions: digest.decisions, chosen: digest.chosen,
    done: done.map((t) => ({ id: t.id, title: t.title, owner: t.owner })),
    open: open.map((t) => ({ id: t.id, title: t.title, owner: t.owner, due: t.due, status: t.status })),
    scores: scores.filter((s) => s.points.length > 0),
    untracked: plan.tasks.filter((t) => t.status === "done" && !t.doneAt).length,
  };
}
export type ReviewData = Awaited<ReturnType<typeof reviewData>>;
