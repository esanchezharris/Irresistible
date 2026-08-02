import type { DealSpec } from "./deal-schema";

const moneyToCents = (amount: number, suffix: string | undefined) => {
  const multiplier = suffix?.toLowerCase() === "m" ? 1_000_000 : suffix?.toLowerCase() === "k" ? 1_000 : 1;
  return Math.round(amount * multiplier * 100);
};

export function parseDemoPrompt(prompt: string): DealSpec {
  const compact = prompt.replace(/,/g, "");
  const seats = Number(compact.match(/(\d+)\s*(?:seats?|users?|licenses?)/i)?.[1] ?? 420);
  const years = Number(compact.match(/(\d+)\s*(?:years?|yr)/i)?.[1] ?? 3);
  const credits = Number(compact.match(/(?:start(?:ing)?\s+(?:at\s+)?)?(\d+)\s*k\s*(?:compute\s*)?credits?/i)?.[1] ?? 100) * 1_000;
  const discount = Number(compact.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i)?.[1] ?? 12);
  const budgetMatch =
    compact.match(/\$\s*(\d+(?:\.\d+)?)\s*([mk])?\s*(?:year[- ]?one|y1|first[- ]year)?\s*budget/i) ??
    compact.match(/(?:year[- ]?one|y1|first[- ]year)?\s*budget\s*(?:is|of|at)?\s*\$\s*(\d+(?:\.\d+)?)\s*([mk])?/i);
  const account = prompt.match(/(?:for|quote)\s+([A-Z][A-Za-z0-9 &.-]{1,32}?)(?:,|\s+for\s+|\s+with\s+)/)?.[1]?.trim() ?? "Acme Robotics";

  return {
    accountName: account,
    industry: /real estate/i.test(prompt) ? "Real estate software" : "AI infrastructure",
    startDate: "2026-09-01",
    termMonths: Math.min(60, Math.max(12, years * 12)),
    currency: "USD",
    paymentTerms: /net\s*60/i.test(prompt) ? "NET_60" : "NET_30",
    regions: /\bEU\b|europe/i.test(prompt) ? ["US", "EU"] : ["US"],
    seats: Array.from({ length: years }, (_, index) => ({ year: index + 1, quantity: seats })),
    computeCredits: Array.from({ length: years }, (_, index) => ({
      year: index + 1,
      quantity: /double|2x/i.test(prompt) ? credits * 2 ** index : credits,
    })),
    support: /premium\s+support/i.test(prompt) ? "PREMIUM" : "STANDARD",
    deployment: /private\s+cloud/i.test(prompt) ? "PRIVATE_CLOUD" : "SHARED",
    discountBps: Math.round(discount * 100),
    yearOneBudgetCents: budgetMatch ? moneyToCents(Number(budgetMatch[1]), budgetMatch[2]) : 90_000_000,
    assumptions: [
      "Seat quantity is flat across the term because no seat ramp was specified.",
      "Premium support is included for enterprise coverage.",
      "The requested compute ramp begins in contract year one.",
    ],
    confidence: 0.76,
  };
}
