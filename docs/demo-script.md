# 90-second demo script

## 0:00–0:12 — Set the thesis

“I built Deal Compiler because I think an enterprise agent should interpret intent, not invent transaction truth. The model proposes a typed deal; deterministic code proves every price, approval, and alternative.”

Show the trust-boundary card.

## 0:12–0:28 — Compile a realistic request

Read only the important fragments of the prompt: “420 seats, three years, compute doubles annually, $900K year-one budget, Net 60, EU, 12% off.” Click **Compile deal**.

“The LLM is constrained by a strict `DealSpec`. It records defaults and ambiguity as assumptions before anything executes.”

Show the seat and compute ramps in Compiled DealSpec.

## 0:28–0:48 — Prove the transaction

Click years one through three in the price timeline.

“The pricing kernel uses cents and basis points, applies graduated seat tiers, doubles the compute ramp, and reconciles each line item. The deterministic core benchmarks around 0.01 milliseconds at p99 locally; model latency is reported separately.”

## 0:48–1:05 — Explain the approval DAG

“The 12% discount requires the sales manager. Net 60 adds Finance. EU adds Legal and Security in parallel. Because TCV crosses $2M, the CFO waits on the commercial chain. The critical path is calculated from dependencies, not the number of approvers.”

Point to rule IDs and the parallel EU nodes.

## 1:05–1:20 — Show agency without surrendering correctness

Select **Fastest approval path**.

“The search agent proactively finds a 24-month structure that fits year-one budget and removes the commercial and CFO gates. It never asserts compliance itself—every candidate is re-priced and re-routed by the same kernels.”

Select **Max approved revenue** briefly to show a different objective.

## 1:20–1:30 — Close on ownership

“The replay log captures every state transition. The repo includes 13 golden tests, microbenchmarks, architecture tradeoffs, and a customer-test protocol. This is a narrow weekend slice, but it is shaped like production software.”

End on: **The model proposes. The transaction engine proves.**

## Recording notes

- Record at 1440p, browser zoom 90%, with notifications disabled.
- Keep the cursor still while speaking; move only when the narration calls for it.
- Do one rehearsal at normal speed, then target 85–90 seconds.
- Do not call the product “Roadrunner” or imitate their branding. It is an independent technical exploration.
- If the live model is slow, compile before recording and cut the waiting time, but retain a short visible transition.
