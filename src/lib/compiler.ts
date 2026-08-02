import type { AuditEvent, CompileResult, DealSpec } from "./deal-schema";
import { priceDeal } from "./pricing";
import { routeApprovals } from "./approvals";
import { findAlternatives } from "./alternatives";

function digest(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(16).padStart(8, "0");
}

export function compileDeal(
  prompt: string,
  deal: DealSpec,
  metadata: Pick<CompileResult, "source" | "model" | "warning" | "durationMs">,
): CompileResult {
  const quote = priceDeal(deal);
  const approvals = routeApprovals(deal, quote);
  const alternatives = findAlternatives(deal);
  const baseTime = Date.now();
  const rawEvents: Array<Omit<AuditEvent, "id" | "at" | "digest">> = [
    { actor: "AE", type: "DEAL_REQUESTED", detail: prompt },
    {
      actor: "COMPILER",
      type: "SPEC_COMPILED",
      detail: `${deal.accountName} · ${deal.termMonths} months · ${(deal.discountBps / 100).toFixed(1)}% discount`,
    },
    {
      actor: "PRICING_KERNEL",
      type: "QUOTE_PRICED",
      detail: `${quote.years.length} periods · ${quote.netTcvCents} cents TCV · ${quote.marginBps} bps margin`,
    },
    {
      actor: "POLICY_ENGINE",
      type: "APPROVALS_ROUTED",
      detail: `${approvals.required.length} approvers · ${approvals.criticalPathMinutes} minute critical path`,
    },
    {
      actor: "SEARCH_AGENT",
      type: "COUNTERFACTUALS_EVALUATED",
      detail: `${alternatives.length} policy-valid alternatives surfaced`,
    },
  ];
  const audit = rawEvents.map((event, index) => {
    const payload = `${event.actor}:${event.type}:${event.detail}`;
    return {
      ...event,
      id: `evt_${String(index + 1).padStart(3, "0")}`,
      at: new Date(baseTime + index * 17).toISOString(),
      digest: digest(payload),
    };
  });

  return { ...metadata, deal, quote, approvals, alternatives, audit };
}
