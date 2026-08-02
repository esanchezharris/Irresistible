import { describe, expect, it } from "vitest";
import { annualSeatListCents, priceDeal } from "../src/lib/pricing";
import { sampleDeal } from "./fixture";

describe("pricing kernel", () => {
  it("prices graduated seat tiers without floating-point dollars", () => {
    expect(annualSeatListCents(100)).toBe(18_000_000);
    expect(annualSeatListCents(420)).toBe(64_080_000);
    expect(annualSeatListCents(600)).toBe(87_000_000);
  });

  it("prices a three-year ramp and reconciles every subtotal", () => {
    const quote = priceDeal(sampleDeal);

    expect(quote.years).toHaveLength(3);
    expect(quote.years.map((year) => year.lineItems.find((item) => item.key === "compute")?.quantity)).toEqual([
      100_000,
      200_000,
      400_000,
    ]);
    expect(quote.years[0].listCents).toBe(98_417_000);
    expect(quote.years[0].netCents).toBe(86_606_960);
    expect(quote.netTcvCents).toBe(292_204_880);
    expect(quote.netTcvCents).toBe(quote.years.reduce((sum, year) => sum + year.netCents, 0));
    expect(quote.costTcvCents).toBe(quote.years.reduce((sum, year) => sum + year.costCents, 0));
  });

  it("carries the last specified ramp quantity forward", () => {
    const quote = priceDeal({
      ...sampleDeal,
      seats: [{ year: 1, quantity: 100 }],
      computeCredits: [{ year: 1, quantity: 50_000 }],
    });
    expect(quote.years[2].lineItems.find((item) => item.key === "seats")?.quantity).toBe(100);
    expect(quote.years[2].lineItems.find((item) => item.key === "compute")?.quantity).toBe(50_000);
  });
});
