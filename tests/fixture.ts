import type { DealSpec } from "../src/lib/deal-schema";

export const sampleDeal: DealSpec = {
  accountName: "Acme Robotics",
  industry: "AI infrastructure",
  startDate: "2026-09-01",
  termMonths: 36,
  currency: "USD",
  paymentTerms: "NET_60",
  regions: ["US", "EU"],
  seats: [
    { year: 1, quantity: 420 },
    { year: 2, quantity: 420 },
    { year: 3, quantity: 420 },
  ],
  computeCredits: [
    { year: 1, quantity: 100_000 },
    { year: 2, quantity: 200_000 },
    { year: 3, quantity: 400_000 },
  ],
  support: "PREMIUM",
  deployment: "SHARED",
  discountBps: 1_200,
  yearOneBudgetCents: 90_000_000,
  assumptions: ["Flat seat count"],
  confidence: 0.9,
};
