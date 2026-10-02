import type { OpsKey, Priority } from "./assessment-def";

export interface TeamResponse {
  id: string;
  at: string;
  role: string;
  answers: Record<string, number>;
  open: string[];
}

export interface Recommendation {
  id: string;
  domain: string;
  title: string;
  detail: string;
  /** Now, Next, or Later */
  priority: Priority;
  /** Turned into a plan task */
  taskId: string;
}

export interface Assessment {
  clientId: string;
  enabled: boolean;
  status: "leader" | "team" | "review" | "shared";
  /** Secret part of the anonymous team survey link */
  token: string;
  /** Optional date to close the team survey, YYYY-MM-DD */
  closesOn: string;
  profile: {
    orgName: string;
    teamSize: string;
    roles: string;
    services: string;
    policies: string[];
    priorities: string;
    recentChanges: string;
    success: string;
  } & Record<OpsKey, string>;
  /** The leader rates the same statements, so we can compare views */
  leaderAnswers: Record<string, number>;
  leaderSubmittedAt: string | null;
  leaderName: string;
  /** Your findings, shown with results */
  summary: string;
  recommendations: Recommendation[];
  /** Show the team's written comments in the client's results */
  shareComments: boolean;
  sharedAt: string | null;
  updatedAt: string;
}
