import { describe, expect, it } from "vitest";
import { compileDeal } from "../src/lib/compiler";
import { parseDemoPrompt } from "../src/lib/demo-parser";

const prompt =
  "Quote Acme Robotics for 420 seats over 3 years. Start at 100k compute credits and double annually. Keep year one under a $900k budget, Net 60, US + EU, with a 12% discount.";

describe("compiler vertical slice", () => {
  it("normalizes a natural-language deal into a replayable transaction", () => {
    const deal = parseDemoPrompt(prompt);
    const result = compileDeal(prompt, deal, {
      source: "demo-parser",
      model: null,
      warning: null,
      durationMs: 4,
    });

    expect(result.deal.accountName).toBe("Acme Robotics");
    expect(result.deal.computeCredits.map((year) => year.quantity)).toEqual([100_000, 200_000, 400_000]);
    expect(result.audit.map((event) => event.type)).toEqual([
      "DEAL_REQUESTED",
      "SPEC_COMPILED",
      "QUOTE_PRICED",
      "APPROVALS_ROUTED",
      "COUNTERFACTUALS_EVALUATED",
    ]);
    expect(result.audit.every((event) => /^[a-f0-9]{8}$/.test(event.digest))).toBe(true);
  });
});
