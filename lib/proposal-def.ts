/** One package the client can choose. A proposal with one option is a plain yes or no. */
export interface ProposalOption {
  id: string;
  name: string;
  summary: string;
  serviceIds: string[];
  customItems: { title: string; detail: string }[];
  lineItems: { label: string; amount: number }[];
  retainer: number;
  recommended: boolean;
}
export interface Proposal {
  status: "draft" | "sent" | "accepted";
  intro: string;
  /** Last day they can accept, YYYY-MM-DD, or "" for no deadline */
  expires: string;
  options: ProposalOption[];
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  acceptedOptionId: string;
  acceptedName: string;
  acceptedTitle: string;
  acceptedIp: string;
}
export const optionTotal = (o: Pick<ProposalOption, "lineItems">) => Math.max(0, Math.round(o.lineItems.reduce((t, l) => t + (Number(l.amount) || 0), 0) * 100) / 100);
export const isExpired = (p: Pick<Proposal, "status" | "expires">, today: string) => p.status === "sent" && !!p.expires && today > p.expires;
/** Where a proposal stands, in words for your client list */
export function proposalState(p: Proposal | null, today: string): { label: string; tone: "" | "gold" | "green" | "rust" } | null {
  if (!p) return null;
  if (p.status === "accepted") return { label: "Proposal accepted", tone: "green" };
  if (p.status === "draft") return { label: "Proposal draft", tone: "" };
  if (isExpired(p, today)) return { label: "Proposal expired", tone: "rust" };
  return { label: p.viewedAt ? "Proposal viewed" : "Proposal sent", tone: "gold" };
}
