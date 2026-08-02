# Deal Compiler design contract

## Screen job

Turn a natural-language enterprise deal request into one inspectable decision narrative: normalized intent, a deterministic quote, and the approval outcome.

## Primary user and action

- Primary user: an account executive preparing a non-standard B2B software quote.
- Primary action: edit a deal request and select **Compile deal**.
- Secondary actions: load a realistic example, inspect annual pricing, model one counterfactual, and open evidence or replay details.

## Content hierarchy

1. Editable request and compile action.
2. Intent understood: the normalized commercial inputs the system will price.
3. Quote verified: TCV, annual values, constraint result, annual breakdown, and one proactive alternative.
4. Approval plan: outcome, policy rationale, path, and time estimate.
5. Evidence, assumptions, and audit replay as collapsed secondary detail.

## Navigation and controls

- A slim product header only; this is a focused workbench, not a multi-page dashboard.
- The request remains editable in place.
- Examples use a native select so the visible control always has a result.
- Annual quote rows select the active year's product detail.
- The proactive alternative is a real button that changes the active deal view and exposes a return action.
- Evidence and audit use native disclosure controls with keyboard support.
- No share menu, action menu, decorative tabs, or other inert controls.

## Visual language

- Warm off-white canvas, white working surfaces, ink text, hairline neutral borders.
- A very light warm quote surface makes the priced decision the visual center.
- Orange is reserved for the compile action and selected interactive state.
- Green appears only in outcome text or the single approval-status chip; never as a glowing indicator.
- System sans for product copy and a single monospace stack for hashes and policy identifiers.
- Minimal shadow, 8–12px radii, compact enterprise spacing, restrained motion.
- The three stages form one continuous vertical narrative, not a grid of dashboard cards.

## Required states

- Ready: prefilled request with a deterministic preview result.
- Loading: disabled compile control, explicit `Compiling…` label, and polite live-region update.
- Success: run provenance, duration, confidence, quote, constraints, approval outcome, and audit trail.
- Error: inline error notice adjacent to the request without destroying the previous valid result.
- Disabled: compile is unavailable while running or when the request is too short.
- Alternative selected: the result narrative updates and a return-to-requested-deal control appears.
- Empty and permission states: not applicable; the workbench is intentionally prefilled and has no authenticated roles.

## Responsive behavior

- Desktop: a narrow numbered rail anchors each stage; intent fields run in a compact row; quote details and the proactive alternative share the quote surface; approval rationale and path share a row.
- Tablet: stage content keeps the numbered rail while quote and approval sub-layouts become single-column.
- Mobile: the rail becomes compact numbered section headers, quote KPIs form a 2×2 summary, annual rows remain horizontally inspectable, disclosures stay full-width, and the primary action spans the request footer.
- Layout remains usable at 200% zoom without clipping core controls.

## Evidence used

- Roadrunner product language and visual restraint: [roadrunner.ai](https://roadrunner.ai/)
- Selected Deal Narrative direction: `generated_images/exec-06d3c2bd-3cba-4f16-a116-64ad9446b38d.png`
- Tightened implementation target: `generated_images/exec-b0397c5f-6323-412c-bcc3-d891ef5224a9.png`
- [Paperclip design guide](https://www.skills.sh/paperclipai/paperclip/design-guide): dense but scannable, semantic tokens, whitespace as separation, minimal elevation.
- [Anti UI Slop](https://www.skills.sh/site/uizze.com/anti-ui-slop): product-specific hierarchy, real nouns and data, functional controls, explicit states, and accessibility finish gate.
- Existing Deal Compiler behavior, typed result model, deterministic pricing engine, approval DAG, counterfactuals, and replay data.

## Forbidden defaults

- No glowing green dot or ambient “live” indicator.
- No decorative gradient, grid background, glass, giant hero, generic AI sparkle, or fake chart.
- No excess badges, pill clusters, icon containers, or decorative icons.
- No unrelated dashboard tiles, floating cards, or multiple competing primary actions.
- No invented quote values, policies, or customer claims.
- No visible control without a real outcome.

## Acceptance criteria

- A reviewer can explain the request → quote → approval flow in under ten seconds.
- The quote is the strongest result surface, but the request remains the obvious starting action.
- All displayed price and approval values come from the current compile result.
- Deterministic pricing is communicated in plain text with no glowing dot.
- Loading, success, error, disabled, and selected-alternative states are implemented.
- Every visible control works with mouse and keyboard and has a visible focus state.
- Text and status colors meet WCAG AA contrast; motion respects reduced-motion preferences.
- Desktop and mobile visual QA have no overlap, clipping, accidental horizontal page scroll, or unreadable table content.
- Tests, lint, typecheck, production build, and browser smoke checks pass.
