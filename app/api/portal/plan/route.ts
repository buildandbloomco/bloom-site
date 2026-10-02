import { currentClient } from "@/lib/auth";
import { rateLimit } from "@/lib/data";
import { newId } from "@/lib/crypto";
import { error, json } from "@/lib/http";
import { getPlan, sanitizePlan, savePlan } from "@/lib/workspace";
import type { PlanRequest } from "@/lib/plan-types";

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

// Everything a client can do on their strategy plan
export async function POST(req: Request) {
  const client = await currentClient();
  if (!client) return error("Your session ended. Please enter your access code again.", 401);
  if (!(await rateLimit(`plan:${client.id}`, 300, 60 * 60))) return error("Too many changes at once. Try again in a bit.", 429);
  const plan = await getPlan(client.id);
  if (!plan.enabled) return error("Your plan isn't ready yet.", 404);
  const b = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const task = plan.tasks.find((t) => t.id === String(b.taskId));
  switch (b.action) {
    case "status": {
      if (!task) return error("We couldn't find that task.", 404);
      if (task.owner !== "client") return error("That task belongs to Build & Bloom. Leave a comment or request a change instead.", 403);
      task.status = b.status === "done" || b.status === "doing" ? b.status : "todo";
      break;
    }
    case "add": {
      if (!plan.clientCanAdd) return error("Adding tasks is turned off for this plan.", 403);
      const title = str(b.title, 300);
      if (!title) return error("Give the task a name.");
      plan.tasks.push({ id: newId(), sessionId: str(b.sessionId, 40), title, detail: str(b.detail, 2000), owner: "client", due: isDate(str(b.due, 10)) ? str(b.due, 10) : "", status: "todo", link: { type: "", refId: "", label: "", url: "" }, createdBy: "client", comments: [], domain: "" });
      break;
    }
    case "edit": {
      if (!task) return error("We couldn't find that task.", 404);
      if (task.owner !== "client") return error("To change a Build & Bloom task, send a change request.", 403);
      if (b.title !== undefined) task.title = str(b.title, 300) || task.title;
      if (b.detail !== undefined) task.detail = str(b.detail, 2000);
      if (b.due !== undefined) task.due = isDate(str(b.due, 10)) ? str(b.due, 10) : "";
      break;
    }
    case "delete": {
      if (!task) return error("We couldn't find that task.", 404);
      if (task.createdBy !== "client") return error("Only tasks you added can be removed. Send a change request for the others.", 403);
      plan.tasks = plan.tasks.filter((t) => t.id !== task.id);
      break;
    }
    case "comment": {
      if (!task) return error("We couldn't find that task.", 404);
      const text = str(b.text, 2000);
      if (!text) return error("Write a comment first.");
      task.comments.push({ id: newId(), by: "client", text, at: now });
      break;
    }
    case "agenda": {
      if (!plan.clientCanAdd) return error("Adding agenda items is turned off for this plan.", 403);
      const s = plan.sessions.find((x) => x.id === String(b.sessionId));
      const text = str(b.text, 500);
      if (!s) return error("We couldn't find that session.", 404);
      if (!text) return error("Write the agenda item first.");
      s.agenda.push({ id: newId(), text, by: "client" });
      break;
    }
    case "request": {
      const text = str(b.text, 3000);
      if (!text) return error("Tell us what you'd like to change.");
      const tt: PlanRequest["targetType"] = ["task", "session"].includes(b.targetType) ? b.targetType : "plan";
      const label = tt === "task" ? plan.tasks.find((t) => t.id === b.targetId)?.title : tt === "session" ? plan.sessions.find((s) => s.id === b.targetId)?.title : plan.title;
      plan.requests.push({ id: newId(), kind: ["change", "new", "remove", "question"].includes(b.kind) ? b.kind : "change", targetType: tt, targetId: str(b.targetId, 40), targetLabel: label ?? "", text, at: now, status: "open", reply: "" });
      break;
    }
    default:
      return error("Unknown action.");
  }
  const next = await sanitizePlan(plan, plan, client);
  await savePlan(next);
  return json(next);
}
