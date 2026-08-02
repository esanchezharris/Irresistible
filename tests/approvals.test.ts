import { describe, expect, it } from "vitest";
import { routeApprovals } from "../src/lib/approvals";
import { priceDeal } from "../src/lib/pricing";
import { sampleDeal } from "./fixture";

describe("approval router", () => {
  it("builds a parallel DAG with deterministic dependencies", () => {
    const approvals = routeApprovals(sampleDeal, priceDeal(sampleDeal));
    const byId = new Map(approvals.required.map((node) => [node.id, node]));

    expect([...byId.keys()]).toEqual(["sales-manager", "finance", "legal", "security", "cfo"]);
    expect(byId.get("finance")?.dependsOn).toEqual(["sales-manager"]);
    expect(byId.get("cfo")?.dependsOn).toEqual(["finance", "sales-manager"]);
    expect(byId.get("legal")?.dependsOn).toEqual([]);
    expect(byId.get("security")?.dependsOn).toEqual([]);
    expect(approvals.criticalPathMinutes).toBe(540);
  });

  it("merges multiple policy triggers for the same approver", () => {
    const deal = { ...sampleDeal, deployment: "PRIVATE_CLOUD" as const };
    const approvals = routeApprovals(deal, priceDeal(deal));
    const security = approvals.required.find((node) => node.id === "security");
    expect(security?.policyIds).toEqual(["REG-EU", "CLOUD-PRIVATE"]);
    expect(security?.reasons).toHaveLength(2);
  });

  it("auto-approves a standard US deal below every threshold", () => {
    const deal = {
      ...sampleDeal,
      termMonths: 12,
      paymentTerms: "NET_30" as const,
      regions: ["US" as const],
      support: "STANDARD" as const,
      discountBps: 500,
    };
    const approvals = routeApprovals(deal, priceDeal(deal));
    expect(approvals.required).toEqual([]);
    expect(approvals.criticalPathMinutes).toBe(0);
  });
});
