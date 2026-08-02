# Architecture notes

## Goal

Demonstrate one credible vertical slice of agentic quote infrastructure: natural-language input, composable pricing, approval routing, proactive alternatives, and replay. Optimize for explainability and correctness under a weekend constraint.

## Data flow

1. The API accepts a bounded free-text request.
2. OpenAI Structured Outputs compiles it to `DealSpec`; Zod rejects malformed output.
3. The pricing kernel resolves annual quantities, graduated tiers, add-ons, support, discounts, COGS, and margin in integer arithmetic.
4. The policy engine evaluates independent rules and merges triggers assigned to the same approver.
5. Dependencies form a DAG. A memoized traversal calculates the critical-path SLA while independent nodes remain parallel.
6. Counterfactual search changes a bounded set of commercial levers. Every candidate re-enters steps 3 and 4; the model cannot claim that a candidate is compliant.
7. The compiler emits a typed ordered event sequence whose digests make replay differences visible.

## Why a compiler metaphor?

An AE prompt is closer to source code than to a database row: expressive, ambiguous, and not safe to execute. `DealSpec` is the typed intermediate representation. Pricing and policy evaluation are deterministic compiler passes. The final quote and approval plan are executable outputs.

This creates useful seams:

- the language stage can improve without risking price logic;
- catalog and policy versions can be pinned to a replay;
- golden specs can test the LLM independently from transaction tests;
- a quote can be fully regenerated from intent plus versioned configuration.

## Money model

All money is stored as integer cents and percentages as integer basis points. Each line item records list, discount, net, and cost cents. Annual and TCV values are reductions over those records; tests assert reconciliation.

Rounding currently occurs once per line item per contract year. A production system would make the rounding policy explicit by currency and preserve it as versioned configuration.

## Approval model

Rules add evidence to approver nodes rather than blindly creating one node per trigger. For example, EU residency and private cloud both attach evidence to one Security review. Dependencies refer to stable node IDs.

The current router is synchronous and in-memory. A production workflow would persist transition attempts, require idempotency keys, evaluate authorization at every transition, support timers/escalations, and use an outbox for side effects.

## Alternative search

The prototype searches only three intentional strategies:

- **Max approved revenue:** remove unused discount while respecting the year-one budget and use standard payment terms.
- **Preserve buyer terms:** keep payment and commitment terms while removing unused discount.
- **Fastest approval path:** evaluate annual commitment boundaries, standard terms, and the minimum budget-compliant discount; minimize node count, then critical path, then maximize commitment.

This bounded lattice is preferable to free-form generation for the demo because its completeness and constraints are easy to explain. A production optimizer could add product constraints and Pareto ranking while retaining deterministic validation.

## Failure behavior

- Invalid client payload → HTTP 400.
- Missing API key → visibly labeled deterministic demo parser.
- Invalid or refused structured model output → HTTP 502; nothing is priced.
- No budget-valid alternative → omit that strategy rather than show a noncompliant recommendation.

## Production evolution

The next architectural moves would be:

1. version `DealSpec`, catalog, policies, and rounding rules;
2. store commands/events with tenant and actor identity;
3. make workflow transitions idempotent and resumable;
4. separate extraction evals from transaction property tests;
5. add authorization, PII controls, audit retention, and regional storage;
6. trace latency and cost across extraction, pricing, routing, and search;
7. add human clarification when intent confidence or material fields are ambiguous.
