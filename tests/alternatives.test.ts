import { describe, expect, it } from "vitest";
import { findAlternatives } from "../src/lib/alternatives";
import { sampleDeal } from "./fixture";

describe("counterfactual search", () => {
  it("surfaces distinct, budget-valid alternatives", () => {
    const alternatives = findAlternatives(sampleDeal);
    expect(alternatives.map((value) => value.id)).toEqual(["revenue", "terms", "fast"]);
    expect(new Set(alternatives.map((value) => `${value.deal.termMonths}:${value.deal.paymentTerms}:${value.deal.discountBps}`)).size).toBe(3);
    for (const alternative of alternatives) {
      expect(alternative.quote.years[0].netCents).toBeLessThanOrEqual(sampleDeal.yearOneBudgetCents!);
    }
  });

  it("finds the longest commitment on the minimum-node fast path", () => {
    const fast = findAlternatives(sampleDeal).find((value) => value.id === "fast");
    expect(fast?.deal.termMonths).toBe(24);
    expect(fast?.deal.paymentTerms).toBe("NET_30");
    expect(fast?.approvals.required.map((node) => node.id)).toEqual(["legal", "security"]);
  });
});
