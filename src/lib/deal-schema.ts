import { z } from "zod";

export const yearlyQuantitySchema = z.object({
  year: z.number().int().min(1).max(5),
  quantity: z.number().int().nonnegative(),
});

export const dealSpecSchema = z.object({
  accountName: z.string().min(1),
  industry: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  termMonths: z.number().int().min(12).max(60),
  currency: z.literal("USD"),
  paymentTerms: z.enum(["NET_30", "NET_60"]),
  regions: z.array(z.enum(["US", "EU"])).min(1),
  seats: z.array(yearlyQuantitySchema).min(1).max(5),
  computeCredits: z.array(yearlyQuantitySchema).min(1).max(5),
  support: z.enum(["STANDARD", "PREMIUM"]),
  deployment: z.enum(["SHARED", "PRIVATE_CLOUD"]),
  discountBps: z.number().int().min(0).max(3000),
  yearOneBudgetCents: z.number().int().positive().nullable(),
  assumptions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type DealSpec = z.infer<typeof dealSpecSchema>;

export type LineItem = {
  key: string;
  label: string;
  quantity: number;
  unit: string;
  listCents: number;
  discountCents: number;
  netCents: number;
  costCents: number;
};

export type QuoteYear = {
  year: number;
  lineItems: LineItem[];
  listCents: number;
  discountCents: number;
  netCents: number;
  costCents: number;
  marginBps: number;
};

export type Quote = {
  years: QuoteYear[];
  listTcvCents: number;
  netTcvCents: number;
  costTcvCents: number;
  marginBps: number;
};

export type ApprovalNode = {
  id: string;
  label: string;
  team: string;
  policyIds: string[];
  reasons: string[];
  dependsOn: string[];
  slaMinutes: number;
};

export type ApprovalAnalysis = {
  required: ApprovalNode[];
  clearedRules: string[];
  criticalPathMinutes: number;
};

export type Alternative = {
  id: string;
  label: string;
  rationale: string;
  changes: string[];
  deal: DealSpec;
  quote: Quote;
  approvals: ApprovalAnalysis;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: "AE" | "COMPILER" | "PRICING_KERNEL" | "POLICY_ENGINE" | "SEARCH_AGENT";
  type: string;
  detail: string;
  digest: string;
};

export type CompileResult = {
  source: "openai" | "demo-parser";
  model: string | null;
  warning: string | null;
  durationMs: number;
  deal: DealSpec;
  quote: Quote;
  approvals: ApprovalAnalysis;
  alternatives: Alternative[];
  audit: AuditEvent[];
};
