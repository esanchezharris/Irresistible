import { describe, expect, it } from "vitest";
import { parseDemoPrompt } from "../src/lib/demo-parser";

describe("transparent demo parser", () => {
  it("extracts an annual doubling ramp", () => {
    const deal = parseDemoPrompt(
      "Quote Acme Robotics for 420 seats over 3 years, starting at 100k credits and double annually, Net 60, EU, 12% discount, $900k budget.",
    );
    expect(deal.accountName).toBe("Acme Robotics");
    expect(deal.termMonths).toBe(36);
    expect(deal.computeCredits.map((value) => value.quantity)).toEqual([100_000, 200_000, 400_000]);
    expect(deal.paymentTerms).toBe("NET_60");
    expect(deal.regions).toEqual(["US", "EU"]);
    expect(deal.discountBps).toBe(1_200);
  });

  it("extracts a private-cloud deal and defaults to standard support", () => {
    const deal = parseDemoPrompt(
      "Build a 2 year quote for Northstar Bank with 700 users, 250k compute credits each year, private cloud, US only, Net 30, and 8% off. Year-one budget is $1.4m.",
    );
    expect(deal.accountName).toBe("Northstar Bank");
    expect(deal.deployment).toBe("PRIVATE_CLOUD");
    expect(deal.support).toBe("STANDARD");
    expect(deal.yearOneBudgetCents).toBe(140_000_000);
  });

  it("extracts an above-manager-limit discount", () => {
    const deal = parseDemoPrompt(
      "Quote Meridian Labs for 300 seats, 80k credits, EU and US, over 3 years, Net 60, premium support, 22% discount, and an $800k budget.",
    );
    expect(deal.discountBps).toBe(2_200);
    expect(deal.support).toBe("PREMIUM");
  });

  it("keeps integer cents and basis points", () => {
    const deal = parseDemoPrompt("Quote Cedar Systems for 100 seats over 1 year, 50k credits, 7.5% discount, and a $750.5k budget.");
    expect(Number.isInteger(deal.discountBps)).toBe(true);
    expect(Number.isInteger(deal.yearOneBudgetCents)).toBe(true);
    expect(deal.discountBps).toBe(750);
    expect(deal.yearOneBudgetCents).toBe(75_050_000);
  });
});
