import type { Alternative, DealSpec } from "./deal-schema";
import { priceDeal } from "./pricing";
import { routeApprovals } from "./approvals";

function discountForBudget(deal: DealSpec) {
  if (!deal.yearOneBudgetCents) return 0;
  const listDeal = { ...deal, discountBps: 0 };
  const listYearOne = priceDeal(listDeal).years[0]?.listCents ?? 0;
  if (listYearOne <= deal.yearOneBudgetCents) return 0;
  return Math.min(3_000, Math.ceil(((listYearOne - deal.yearOneBudgetCents) * 10_000) / listYearOne));
}

function describeChanges(before: DealSpec, after: DealSpec) {
  const changes: string[] = [];
  if (before.discountBps !== after.discountBps) {
    changes.push(`Discount ${(before.discountBps / 100).toFixed(1)}% → ${(after.discountBps / 100).toFixed(1)}%`);
  }
  if (before.paymentTerms !== after.paymentTerms) {
    changes.push(`Terms ${before.paymentTerms.replace("_", " ")} → ${after.paymentTerms.replace("_", " ")}`);
  }
  if (before.termMonths !== after.termMonths) changes.push(`Commitment ${before.termMonths} → ${after.termMonths} months`);
  return changes;
}

function materialize(id: string, label: string, rationale: string, original: DealSpec, deal: DealSpec): Alternative {
  const quote = priceDeal(deal);
  return {
    id,
    label,
    rationale,
    changes: describeChanges(original, deal),
    deal,
    quote,
    approvals: routeApprovals(deal, quote),
  };
}

const signature = (deal: DealSpec) => `${deal.termMonths}:${deal.paymentTerms}:${deal.discountBps}`;

export function findAlternatives(deal: DealSpec): Alternative[] {
  const minimumDiscount = discountForBudget(deal);
  const candidates: Alternative[] = [];

  const revenueDeal: DealSpec = {
    ...deal,
    discountBps: minimumDiscount,
    paymentTerms: "NET_30",
  };
  candidates.push(
    materialize(
      "revenue",
      "Max approved revenue",
      "Uses only the discount needed to respect the year-one budget and restores standard payment terms.",
      deal,
      revenueDeal,
    ),
  );

  const termsDeal: DealSpec = { ...deal, discountBps: minimumDiscount };
  candidates.push(
    materialize(
      "terms",
      "Preserve buyer terms",
      "Keeps the requested payment and commitment terms while removing unused discount headroom.",
      deal,
      termsDeal,
    ),
  );

  const fastCandidates = [12, 24, 36, 48, 60]
    .filter((months) => months <= deal.termMonths)
    .map((termMonths) => {
      const candidate: DealSpec = { ...deal, termMonths, discountBps: Math.min(minimumDiscount, 1_000), paymentTerms: "NET_30" };
      const quote = priceDeal(candidate);
      return { candidate, quote, approvals: routeApprovals(candidate, quote) };
    })
    .filter(({ candidate, quote }) => {
      const yearOne = quote.years[0]?.netCents ?? 0;
      return !candidate.yearOneBudgetCents || yearOne <= candidate.yearOneBudgetCents;
    })
    .sort((a, b) => {
      const nodeDelta = a.approvals.required.length - b.approvals.required.length;
      if (nodeDelta !== 0) return nodeDelta;
      const pathDelta = a.approvals.criticalPathMinutes - b.approvals.criticalPathMinutes;
      if (pathDelta !== 0) return pathDelta;
      return b.candidate.termMonths - a.candidate.termMonths;
    });

  if (fastCandidates[0]) {
    candidates.push(
      materialize(
        "fast",
        "Fastest approval path",
        "Minimizes approval nodes first, then critical-path SLA, while staying inside the year-one budget.",
        deal,
        fastCandidates[0].candidate,
      ),
    );
  }

  const seen = new Set([signature(deal)]);
  return candidates.filter((alternative) => {
    const key = signature(alternative.deal);
    if (seen.has(key) || alternative.changes.length === 0) return false;
    seen.add(key);
    return true;
  });
}
