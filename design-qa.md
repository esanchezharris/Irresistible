# Design QA

## Comparison target

- Source visual truth: `/workspace/scratch/f892a9b4cbfe/generated_images/exec-b0397c5f-6323-412c-bcc3-d891ef5224a9.png`
- Source pixels: 1487 × 1058 RGB PNG
- Browser-rendered implementation: `/workspace/scratch/f892a9b4cbfe/dealcompiler-preview-desktop.jpg`
- Implementation pixels: 1054 × 936 JPEG
- Combined comparison: `/workspace/scratch/f892a9b4cbfe/audit/design-comparison-pass1.jpg`
- Browser CSS viewport: 1363 × 936 at device scale factor 1
- Intended additional viewport: 390 × 844 mobile
- State: default Atlas Manufacturing result, disclosures collapsed, no alternative selected
- Preview deployment: `dpl_Dx7AToCJBuVjEVz1HHnzURUfBA65`

## Density normalization

The browser reported a 1363 × 936 CSS viewport at DPR 1, while its synchronized screenshot artifact was 1054 × 936. The 1487 × 1058 source was proportionally normalized to 936 pixels high before it was placed to the left of the unmodified implementation capture. The screenshot-width mismatch is recorded and was not treated as exact pixel evidence for horizontal spacing.

## Findings

- [P1] Mobile browser-rendered evidence is unavailable
  - Location: 390px responsive state.
  - Evidence: the selected cloud browser exposes a fixed desktop viewport. Its security policy blocked the attempted narrow-frame inspection and explicitly prohibited alternate browser surfaces or indirect emulation.
  - Impact: the implemented 800px and 560px breakpoints cannot be visually certified for wrapping, table overflow, touch layout, or accidental horizontal page scroll.
  - Fix: capture the production-shaped preview at approximately 390px in an ordinary browser and attach the screenshot for the final visual comparison, or explicitly accept desktop-only QA before promotion.

## Required fidelity surfaces

- Fonts and typography: the system sans and monospace stacks match the source's restrained enterprise character. Heading hierarchy and KPI emphasis are clear. Supporting provenance text is intentionally denser than the mock; it remains a P3 polish candidate, not a blocking desktop mismatch.
- Spacing and layout rhythm: the continuous three-stage structure, request controls, quote emphasis, approval split, and collapsed evidence rows match the target hierarchy. The implementation is slightly denser and removes the mock's decorative approval line, consistent with the user's simplification request.
- Colors and visual tokens: warm canvas, white surfaces, warm quote surface, hairline borders, orange primary action, and restrained semantic green match the target. There is no decorative gradient or glowing green dot.
- Image quality and asset fidelity: the target requires no product imagery or custom icon assets. The implementation uses no inline SVG, emoji, decorative icon containers, CSS illustration, or replacement image asset.
- Copy and content: implementation values come from the live `CompileResult`, not the mock. The default correctly reports Atlas Manufacturing, 125 → 250 seats, $771,400 TCV, no supplied buyer budget, and auto-approval.

## Full-view comparison evidence

`design-comparison-pass1.jpg` places the normalized source on the left and the browser-rendered implementation on the right. The comparison confirms the same request-first composition, six-field intent row, quote-dominant middle stage, one proactive alternative, approval stage, and secondary disclosures. Intentional deviations are dynamic transaction values, the provenance line, and the plain approval row in place of a decorative path graphic.

## Focused region comparison evidence

- Request controls: editable textarea, native example select, and one orange Compile deal action are aligned and visibly distinct.
- Quote region: four KPIs, constraint result, annual table, and one proactive alternative remain together on the warm result surface.
- Approval region: one restrained outcome chip, direct rationale, and a plain-language path preserve the mock hierarchy with less decoration.
- Mobile focused comparison: blocked by the viewport limitation described above.

## Primary interactions tested

- Loading: Compile deal changes to `Compiling…` and becomes disabled.
- Model-backed success: Atlas compiled with `gpt-5.6-luna` in 2556 ms at 99% extraction confidence; $771,400 TCV; no app error or warning.
- Example selection: Private-cloud bank populated the editable request.
- Manual approval branch: Northstar compiled in 3111 ms at 98% confidence with Security and CFO approvals and the expected critical-path reasons.
- Alternative selection: TCV changed from $2,509,760 to $2,728,000, `aria-pressed` became true, and Return to requested deal appeared.
- Annual selection: Year 2 changed to `aria-pressed=true` and Year 1 to false.
- Evidence and replay: both disclosures opened; five audit events were rendered.
- Keyboard: tab order moved from the textarea to the example select to Compile deal; the selected controls showed a 3px orange focus outline.
- Application console: no Deal Compiler errors or warnings. Logged errors belonged to the browser extension and Vercel authentication page, not the app origin.

## Functional and deployment gates

- Tests: 13/13 passed.
- ESLint: passed.
- TypeScript: passed.
- Production build: passed.
- Preview build: READY; build-error filter returned no failures.
- Preview runtime errors: none in the selected time range.
- Preview response counts: three 200 responses and one 204 response during QA.

## Comparison history

- Iteration 0 finding: the deterministic preview displayed a $900K year-one budget even though the Atlas request supplied none, and the alternative rationale referenced that invented constraint.
- Fix: the fallback parser now returns `null` for an omitted budget, the UI reports `Not supplied` / `No buyer budget supplied`, alternative rationale is conditional, and a regression assertion covers the null budget.
- Post-fix evidence: `dealcompiler-preview-desktop.jpg` and `design-comparison-pass1.jpg`; live preview output shows the corrected copy and still returns $771,400 TCV.
- Iteration 1 desktop result: no actionable desktop P0/P1/P2 visual finding remains. Mobile evidence remains blocked.

## Follow-up polish

- [P3] Consider increasing the smallest provenance and audit metadata from 9–10px if a salesperson test shows scanning difficulty.
- [P3] The Vercel Toolbar button overlaps the preview edge; it is Vercel-injected preview chrome and is not present in the product source.

## Iteration 2 — 390 px mobile gate (2026-08-02, Claude handoff)

- Environment: Playwright + headless Chromium at 390 × 844, production build (`next start`), deterministic demo parser (no key in the QA sandbox; prod uses the model path).
- Exercised: default Atlas state, Compile deal, compiled result including KPI grid, annual table, proactive alternative, approval plan, disclosures.
- [P0 FOUND + FIXED] Horizontal page overflow of 252 px at 390 px. Root cause: the responsive media-query overrides used bare `1fr` grid columns; a grid child's default `min-width: auto` let the 610 px annual table dictate the column's min-content width, blowing out the page. Fix: `minmax(0, 1fr)` in every responsive override plus `min-width: 0` on `.annualBreakdown` / `.approvalPath`. The table now scrolls inside `.tableWrap` as designed.
- Post-fix evidence: `dc-mobile-result.png` (390 px, overflow 0), `dc-desktop-result.png` (1280 px re-verified, overflow 0).
- Re-run after fix: tests 13/13, ESLint passed, `tsc --noEmit` passed, production build passed.

final result: passed
