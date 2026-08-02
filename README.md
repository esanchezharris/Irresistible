# Deal Compiler

**The model proposes. The transaction engine proves.**

[**Try the live model-backed demo**](https://dealcompiler.vercel.app/) · [Architecture](docs/architecture.md) · [Model smoke tests](docs/model-smoke-tests.md) · [90-second walkthrough](https://emiliosanchezharris.com/dc-walkthrough.mp4)

![Next.js](https://img.shields.io/badge/Next.js-16-111111?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square) ![Tests](https://img.shields.io/badge/tests-13%2F13-15803D?style=flat-square) ![OpenAI](https://img.shields.io/badge/OpenAI-Structured_Outputs-412991?style=flat-square)

Deal Compiler turns an account executive's unstructured request into an inspectable quote, approval DAG, and set of policy-valid alternatives. The LLM is deliberately constrained to language understanding. It cannot calculate prices or decide approvals.

> “Quote Atlas Manufacturing for 125 seats in year one and 250 seats in year two over 24 months. Include 50,000 compute credits each year, Net 30, shared cloud, standard support, US only, and a 5% discount.”

That request compiles into:

- a strict, replayable `DealSpec`;
- a two-year ramped quote using integer cents and basis points;
- a parallel approval graph with rule IDs, reasons, dependencies, and critical-path SLA;
- counterfactuals such as the highest-revenue budget-compliant quote and the fastest approval path;
- a typed event log with stable digests.

This is a focused portfolio prototype built over a weekend. The catalog, customer, and policies are synthetic.

## Live demo

Open [dealcompiler.vercel.app](https://dealcompiler.vercel.app/), choose a sample request or write your own, and click **Compile deal**. The production deployment uses server-side OpenAI Structured Outputs for intent extraction; the API key never reaches the browser. The resulting price, approval route, alternatives, and audit digests are recomputed by deterministic TypeScript.

The default Atlas Manufacturing request is the shortest proof of the full trust boundary: a model-normalized 125 → 250 seat ramp becomes a $771,400 deterministic quote and an explainable auto-approval. The private-cloud and ambiguous-discount examples exercise the manual approval and assumption branches without crowding the first screen.

The interface follows the same decision order as the engine—**intent understood → quote verified → approval plan**—with assumptions and replay available as secondary evidence. The [design contract](docs/design-contract.md) records the product hierarchy, required states, responsive behavior, and anti-slop constraints used for the final pass.

## Trust boundary

```mermaid
flowchart TD
    A["AE request"] --> B["LLM intent compiler"]
    B --> C["Strict DealSpec"]
    C --> D["Deterministic transaction core"]
    D --> E["Quote + policy DAG"]
    D --> F["Bounded alternative search"]
```

The critical design choice is what the model **does not** own:

| Concern | Owner | Why |
|---|---|---|
| Ambiguous language and normalization | LLM | This is probabilistic interpretation work. |
| Schema validation | Zod boundary | Invalid structures fail before execution. |
| Price, discount, and margin | Pricing kernel | Money uses integer cents; discounts use basis points. |
| Approval routing | Policy engine | Every trigger maps to an explicit rule and dependency. |
| Alternatives | Bounded deterministic search | Every candidate is fully re-priced and re-routed. |
| Replay | Typed event log | State transitions are ordered and digestible. |

## Vertical slice

The synthetic Atlas catalog includes:

- a platform fee;
- graduated seat tiers;
- prepaid compute credits with annual ramps;
- EU data residency and private-cloud add-ons;
- premium support calculated from the product subtotal.

The policy engine demonstrates merged and parallel routing:

- discount above 10% → Sales Manager;
- discount above 20% → VP Sales after manager;
- Net 60 or gross margin below 65% → Finance;
- EU → Legal and Security in parallel;
- private cloud → Security (merged with any EU reason);
- TCV above $2M → CFO after any commercial prerequisites.

## Performance and verification

On the local development runner:

| Operation | Samples | p99 |
|---|---:|---:|
| Price + route | 130,859 | 0.01 ms |
| Bounded counterfactual search | 29,964 | 0.07 ms |

These figures measure the in-process deterministic core, not network or model latency. Reproduce them with `npm run bench`.

The live application reports model latency separately from the deterministic result. Production smoke tests on August 2, 2026 compiled the default deal plus three non-demo requests in 2.4-4.8 seconds, returned schema-valid `DealSpec` objects, and produced no Vercel runtime errors. The exact prompts and observed results are documented in [model-smoke-tests.md](docs/model-smoke-tests.md).

The suite currently covers 13 cases across graduated pricing, ramp carry-forward, subtotal reconciliation, approval dependencies, approver deduplication, auto-approval, budget-valid counterfactuals, parser normalization, and event replay.

```bash
npm test
npm run bench
npm run lint
npm run build
```

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add an existing OpenAI API key to `.env.local` to enable model-backed compilation:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
```

The key is server-only and `.env*` is ignored. The API uses the OpenAI Responses API with Zod Structured Outputs. Without a key, the UI transparently labels and uses a narrow deterministic parser so the transaction core remains explorable.

## Project map

```text
src/app/api/compile/route.ts  Language → DealSpec boundary
src/lib/pricing.ts            Fixed-point pricing kernel
src/lib/approvals.ts          Policy evaluation and approval DAG
src/lib/alternatives.ts       Bounded counterfactual search
src/lib/compiler.ts           Orchestration and replay events
src/components/               Interactive workbench
tests/                        Golden cases and microbenchmarks
docs/                         Architecture, demo, and user-test notes
```

## Deliberate limitations

This is a narrow production-shaped slice, not a CPQ clone. It does not include authentication, CRM sync, tax, multi-currency, quote PDFs, durable event storage, or a policy authoring interface. The next production steps would be tenant-scoped persistence, idempotent workflow execution, versioned catalogs and policies, authorization at each transition, model evals against annotated AE requests, and observability across the model and deterministic stages.

See [architecture.md](docs/architecture.md) for the tradeoffs and [demo-script.md](docs/demo-script.md) for the 90-second walkthrough.

## Why I built it

I wanted to test a specific enterprise-agent thesis: natural language is useful at the boundary, but transaction truth should remain explicit, reproducible, and inspectable. Deal Compiler is deliberately narrow enough to understand in one sitting and deep enough to discuss data modeling, workflow execution, agent trust, performance, testing, and product tradeoffs.
