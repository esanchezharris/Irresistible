import type { DealSpec } from "./deal-schema";

const moneyToCents = (amount: number, suffix: string | undefined) => {
  const multiplier = suffix?.toLowerCase() === "m" ? 1_000_000 : suffix?.toLowerCase() === "k" ? 1_000 : 1;
  return Math.round(amount * multiplier * 100);
};

export function parseDemoPrompt(prompt: string): DealSpec {
  const compact = prompt.replace(/,/g, "");
  const yearWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  const yearMatch = compact.match(/(\d+)\s*(?:years?|yr)/i);
  const monthMatch = compact.match(/(?:over|for)\s+(\d+)\s*months?/i);
  const years = yearMatch ? Number(yearMatch[1]) : monthMatch ? Math.ceil(Number(monthMatch[1]) / 12) : 3;
  const seatMatches = Array.from(compact.matchAll(/(\d+)\s*(?:seats?|users?|licenses?)(?:\s+in\s+(?:contract\s+)?year\s+(one|two|three|four|five|\d+))?/gi));
  const defaultSeats = Number(seatMatches[0]?.[1] ?? 420);
  const seatsByYear = new Map<number, number>();
  seatMatches.forEach((match) => {
    const yearToken = match[2]?.toLowerCase();
    if (yearToken) seatsByYear.set(yearWords[yearToken] ?? Number(yearToken), Number(match[1]));
  });
  const creditsMatch = compact.match(/(\d+(?:\.\d+)?)\s*(k)?\s*(?:compute\s*)?credits?/i);
  const credits = creditsMatch ? Number(creditsMatch[1]) * (creditsMatch[2] ? 1_000 : 1) : 100_000;
  const discount = Number(compact.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i)?.[1] ?? 12);
  const budgetMatch =
    compact.match(/\$\s*(\d+(?:\.\d+)?)\s*([mk])?\s*(?:year[- ]?one|y1|first[- ]year)?\s*budget/i) ??
    compact.match(/(?:year[- ]?one|y1|first[- ]year)?\s*budget\s*(?:is|of|at)?\s*\$\s*(\d+(?:\.\d+)?)\s*([mk])?/i);
  const account = (
    prompt.match(/\bquote\s+(?:for\s+)?([A-Z][A-Za-z0-9 &.-]{1,32}?)(?:,|\s+for\s+|\s+with\s+)/i)?.[1] ??
    prompt.match(/\bfor\s+([A-Z][A-Za-z0-9 &.-]{1,32}?)(?:,|\s+with\s+)/i)?.[1]
  )?.trim() ?? "Acme Robotics";

  return {
    accountName: account,
    industry: /manufactur/i.test(prompt) ? "Manufacturing" : /bank|financial/i.test(prompt) ? "Financial services" : /real estate/i.test(prompt) ? "Real estate software" : "AI infrastructure",
    startDate: "2026-09-01",
    termMonths: Math.min(60, Math.max(12, years * 12)),
    currency: "USD",
    paymentTerms: /net\s*60/i.test(prompt) ? "NET_60" : "NET_30",
    regions: /\bEU\b|europe/i.test(prompt) ? ["US", "EU"] : ["US"],
    seats: Array.from({ length: years }, (_, index) => ({ year: index + 1, quantity: seatsByYear.get(index + 1) ?? defaultSeats })),
    computeCredits: Array.from({ length: years }, (_, index) => ({
      year: index + 1,
      quantity: /double|2x/i.test(prompt) ? credits * 2 ** index : credits,
    })),
    support: /premium\s+support/i.test(prompt) ? "PREMIUM" : "STANDARD",
    deployment: /private\s+cloud/i.test(prompt) ? "PRIVATE_CLOUD" : "SHARED",
    discountBps: Math.round(discount * 100),
    yearOneBudgetCents: budgetMatch ? moneyToCents(Number(budgetMatch[1]), budgetMatch[2]) : null,
    assumptions: ["Preview parsing uses the catalog start date of September 1, 2026."],
    confidence: 0.76,
  };
}
