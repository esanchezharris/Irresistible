# Production model smoke tests

Run on August 2, 2026 against [irresistible-demo.vercel.app](https://irresistible-demo.vercel.app/) with `gpt-5.6-luna` configured server-side.

These are manual production smoke tests, not a statistical model evaluation. Their purpose is to exercise different schema branches, confirm that model output crosses the strict validation boundary, and verify that the deterministic core recomputes the transaction from the parsed intent.

## Results

| Case | What it exercises | Observed result |
|---|---|---|
| Ramped two-year quote | Explicit per-year seat ramp, flat credits, standard terms, no budget | 2.4 s; 99% extraction confidence; 125 -> 250 seats; auto-approved; $771.4K TCV |
| Private-cloud bank | Private cloud, budget, inferred industry, executive threshold | 2.8 s; 98% confidence; Security + CFO route; $1.25M year one, under budget |
| Ambiguous discount | Approximate 18-22% range, EU, Net 60, premium support, hard budget | 4.8 s; 96% confidence; normalized to 20% with assumptions; four-node approval route; $613.64K year one |

## Prompts

### Ramped two-year quote

> Quote Atlas Manufacturing for 125 seats in year one and 250 seats in year two over 24 months. Include 50,000 compute credits each year, Net 30, shared cloud, standard support, US only, and a 5% discount.

### Private-cloud bank

> Build a two-year quote for Northstar Bank with 700 users and 250,000 compute credits each year. Use private cloud, US only, Net 30, and 8% off. Keep year one below a $1.4 million budget.

### Ambiguous discount

> Quote Meridian Labs for 300 seats over three years with 80,000 compute credits annually, US and EU, premium support, and Net 60. The buyer asked for roughly twenty percent off, somewhere between 18% and 22%, while keeping year one under $800,000 without reducing scope.

## What this does not prove

- The three cases are not representative coverage of AE language.
- Confidence is model-reported extraction confidence, not calibrated probability.
- A production eval set should use annotated expected `DealSpec` fields and score extraction separately from deterministic price and policy tests.
- Model refusal, rate limits, and provider outages still need explicit UI recovery states beyond the current error banner.
