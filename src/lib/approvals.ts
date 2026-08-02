import { POLICY } from "./catalog";
import type { ApprovalAnalysis, ApprovalNode, DealSpec, Quote } from "./deal-schema";

type NodeDraft = Omit<ApprovalNode, "policyIds" | "reasons" | "dependsOn"> & {
  policyIds: Set<string>;
  reasons: Set<string>;
  dependsOn: Set<string>;
};

function criticalPath(nodes: ApprovalNode[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const memo = new Map<string, number>();
  const visit = (id: string): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const node = byId.get(id);
    if (!node) return 0;
    const prior = node.dependsOn.reduce((max, dependency) => Math.max(max, visit(dependency)), 0);
    const total = prior + node.slaMinutes;
    memo.set(id, total);
    return total;
  };
  return nodes.reduce((max, node) => Math.max(max, visit(node.id)), 0);
}

export function routeApprovals(deal: DealSpec, quote: Quote): ApprovalAnalysis {
  const drafts = new Map<string, NodeDraft>();
  const clearedRules: string[] = [];

  const add = (
    id: string,
    label: string,
    team: string,
    slaMinutes: number,
    policyId: string,
    reason: string,
    dependsOn: string[] = [],
  ) => {
    const existing = drafts.get(id) ?? {
      id,
      label,
      team,
      slaMinutes,
      policyIds: new Set<string>(),
      reasons: new Set<string>(),
      dependsOn: new Set<string>(),
    };
    existing.policyIds.add(policyId);
    existing.reasons.add(reason);
    dependsOn.forEach((dependency) => existing.dependsOn.add(dependency));
    drafts.set(id, existing);
  };

  if (deal.discountBps > POLICY.managerDiscountBps) {
    add(
      "sales-manager",
      "Sales manager",
      "Sales",
      120,
      "DISC-010",
      `${(deal.discountBps / 100).toFixed(1)}% discount exceeds the 10% self-serve limit`,
    );
  } else clearedRules.push("DISC-010 · Discount at or below 10%");

  if (deal.discountBps > POLICY.vpDiscountBps) {
    add(
      "vp-sales",
      "VP Sales",
      "Sales",
      240,
      "DISC-020",
      `${(deal.discountBps / 100).toFixed(1)}% discount exceeds the 20% manager limit`,
      ["sales-manager"],
    );
  } else clearedRules.push("DISC-020 · Discount at or below 20%");

  const financeDependencies = drafts.has("sales-manager") ? ["sales-manager"] : [];
  if (deal.paymentTerms === "NET_60") {
    add("finance", "Finance", "Finance", 180, "PAY-060", "Net 60 terms require working-capital review", financeDependencies);
  } else clearedRules.push("PAY-060 · Standard Net 30 terms");

  if (quote.marginBps < POLICY.financeMarginBps) {
    add(
      "finance",
      "Finance",
      "Finance",
      180,
      "MARGIN-065",
      `${(quote.marginBps / 100).toFixed(1)}% gross margin is below the 65% floor`,
      financeDependencies,
    );
  } else clearedRules.push("MARGIN-065 · Gross margin at or above 65%");

  if (deal.regions.includes("EU")) {
    add("legal", "Legal", "Legal", 240, "REG-EU", "EU contracting entity requires DPA review");
    add("security", "Security", "Security", 360, "REG-EU", "EU data residency requires security review");
  } else clearedRules.push("REG-EU · US-only deployment");

  if (deal.deployment === "PRIVATE_CLOUD") {
    add("security", "Security", "Security", 360, "CLOUD-PRIVATE", "Private-cloud topology requires architecture review");
  } else clearedRules.push("CLOUD-PRIVATE · Shared cloud deployment");

  if (quote.netTcvCents > POLICY.cfoTcvCents) {
    const dependencies = ["finance", "sales-manager"].filter((id) => drafts.has(id));
    add(
      "cfo",
      "CFO",
      "Executive",
      240,
      "TCV-2000",
      `$${(quote.netTcvCents / 100_000_000).toFixed(2)}M TCV exceeds the $2M threshold`,
      dependencies,
    );
  } else clearedRules.push("TCV-2000 · TCV at or below $2M");

  const required = Array.from(drafts.values()).map((node) => ({
    ...node,
    policyIds: Array.from(node.policyIds),
    reasons: Array.from(node.reasons),
    dependsOn: Array.from(node.dependsOn),
  }));

  return { required, clearedRules, criticalPathMinutes: criticalPath(required) };
}
