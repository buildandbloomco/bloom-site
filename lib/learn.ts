import "server-only";
import { redirect } from "next/navigation";
import { currentClient } from "./auth";
import { getCourse, getEnrollment } from "./courses";

/** Load a learner's enrollment, or send them to the login page */
export async function learnerContext(eid: string) {
  const client = await currentClient();
  if (!client) redirect("/portal");
  const enrollment = await getEnrollment(eid);
  if (!enrollment || enrollment.clientId !== client.id) redirect("/portal");
  const course = await getCourse(enrollment.courseId);
  if (!course) redirect("/portal");
  return { client, enrollment, course };
}

/** Same check for API routes: returns null instead of redirecting */
export async function learnerApi(eid: string) {
  const client = await currentClient();
  if (!client) return null;
  const enrollment = await getEnrollment(eid);
  if (!enrollment || enrollment.clientId !== client.id) return null;
  const course = await getCourse(enrollment.courseId);
  if (!course) return null;
  return { client, enrollment, course };
}
