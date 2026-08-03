"use client";

import { useState } from "react";
import type { Alternative, CompileResult } from "@/lib/deal-schema";

const samples = [
  {
    label: "Ramped manufacturing deal",
    value:
      "Quote Atlas Manufacturing for 125 seats in year one and 250 seats in year two over 24 months. Include 50,000 compute credits each year, Net 30, shared cloud, standard support, US only, and a 5% discount.",
  },
  {
    label: "Private-cloud bank",
    value:
      "Build a two-year quote for Northstar Bank with 700 users and 250,000 compute credits each year. Use private cloud, US only, Net 30, and 8% off. Keep year one below a $1.4 million budget.",
  },
  {
    label: "Ambiguous discount",
    value:
      "Quote Meridian Labs for 300 seats over three years with 80,000 compute credits annually, US and EU, premium support, and Net 60. The buyer asked for roughly twenty percent off, somewhere between 18% and 22%, while keeping year one under $800,000 without reducing scope.",
  },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const formatMoney = (cents: number) => money.format(cents / 100);
const formatCompactMoney = (cents: number) => compactMoney.format(cents / 100);
const formatDuration = (minutes: number) => {
  if (minutes === 0) return "Immediate";
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)} hours` : `${minutes} minutes`;
};

function IntentField({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="intentField">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function QuoteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="quoteMetric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AlternativeAction({
  alternative,
  active,
  onSelect,
}: {
  alternative: Alternative;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`alternativeAction ${active ? "alternativeActionActive" : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={active}
    >
      <span>Proactive alternative</span>
      <strong>{alternative.label}</strong>
      <p>{alternative.rationale}</p>
      <small>
        {formatCompactMoney(alternative.quote.netTcvCents)} TCV · {alternative.approvals.required.length} approval
        {alternative.approvals.required.length === 1 ? "" : "s"}
      </small>
      <b>{active ? "Viewing alternative" : "Model this scenario"}</b>
    </button>
  );
}

export function DealWorkbench({ initialPrompt, initialResult }: { initialPrompt: string; initialResult: CompileResult }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [result, setResult] = useState(initialResult);
  const [activeYear, setActiveYear] = useState(1);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [sample, setSample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = result.alternatives.find((alternative) => alternative.id === selectedAlternative);
  const view = selected
    ? { deal: selected.deal, quote: selected.quote, approvals: selected.approvals }
    : { deal: result.deal, quote: result.quote, approvals: result.approvals };
  const year = view.quote.years.find((value) => value.year === activeYear) ?? view.quote.years[0];
  const yearOne = view.quote.years[0]?.netCents ?? 0;
  const yearTwo = view.quote.years[1]?.netCents ?? 0;
  const averageMonthly = Math.round(view.quote.netTcvCents / view.deal.termMonths);
  const budgetDelta = view.deal.yearOneBudgetCents === null ? null : view.deal.yearOneBudgetCents - yearOne;
  const primaryAlternative = result.alternatives[0];
  const autoApproved = view.approvals.required.length === 0;
  const ramp = view.deal.seats.map((value) => value.quantity.toLocaleString()).join(" → ");
  const paymentTerms = view.deal.paymentTerms.replace("_", " ").replace("NET", "Net");
  const approvalReasons = Array.from(new Set(view.approvals.required.flatMap((node) => node.reasons))).slice(0, 3);

  function selectSample(value: string) {
    setSample(value);
    const next = samples.find((item) => item.label === value);
    if (next) setPrompt(next.value);
  }

  async function runCompiler() {
    setBusy(true);
    setError(null);
    setSelectedAlternative(null);
    setActiveYear(1);

    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Compilation failed");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Compilation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="top">
      <header className="topbar">
        <a className="brand" href="#top"><img src="/mascot.png" alt="" style={{ width: 22, height: 22, verticalAlign: -4, marginRight: 6 }} />Irresistible</a>
        <span className="pricingLabel">Deterministic pricing</span>
      </header>

      <section className="requestSection" aria-labelledby="request-title">
        <div className="requestField">
          <div className="requestLabel">
            <label id="request-title" htmlFor="deal-prompt">Editable request</label>
            <span>{prompt.length} / 2,000</span>
          </div>
          <textarea
            id="deal-prompt"
            value={prompt}
            maxLength={2000}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </div>
        <div className="requestActions">
          <label className="sampleSelect">
            <span>Load example</span>
            <select value={sample} onChange={(event) => selectSample(event.target.value)}>
              <option value="">Choose an example</option>
              {samples.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
            </select>
          </label>
          <button className="compileButton" type="button" onClick={runCompiler} disabled={busy || prompt.trim().length < 20}>
            {busy ? "Compiling…" : "Compile deal"}
          </button>
        </div>
      </section>

      <div className="runMeta" aria-live="polite">
        <span>{busy ? "Compiling typed intent and recalculating the transaction…" : `Compiled in ${result.durationMs} ms`}</span>
        <span>{result.source === "openai" ? result.model : "Deterministic preview"}</span>
        <span>{Math.round(result.deal.confidence * 100)}% extraction confidence</span>
        {selected && <button type="button" onClick={() => setSelectedAlternative(null)}>Return to requested deal</button>}
      </div>
      {error && <p className="errorBanner" role="alert">Compilation failed: {error}. The last valid result remains below.</p>}
      {result.warning && <p className="warningBanner">{result.warning}</p>}

      <div className="decisionFlow">
        <section className="stage" aria-labelledby="intent-heading">
          <div className="stageLabel">
            <span className="stageNumber">1</span>
            <div><h2 id="intent-heading">Intent understood</h2><p>Normalized DealSpec</p></div>
          </div>
          <div className="stageSurface intentSurface">
            <div className="intentGrid">
              <IntentField label="Account" value={view.deal.accountName} detail={view.deal.industry} />
              <IntentField label="Seat ramp" value={ramp} detail={`${view.quote.years.length} contract years`} />
              <IntentField label="Term" value={`${view.deal.termMonths} months`} detail={view.deal.startDate} />
              <IntentField label="Discount" value={`${(view.deal.discountBps / 100).toFixed(1)}%`} detail="blended" />
              <IntentField label="Payment" value={paymentTerms} detail={view.deal.support.toLowerCase()} />
              <IntentField
                label="Year-one budget"
                value={view.deal.yearOneBudgetCents === null ? "Not supplied" : formatCompactMoney(view.deal.yearOneBudgetCents)}
                detail={view.deal.deployment.replace("_", " ").toLowerCase()}
              />
            </div>
            <p className="confidenceLine">Extraction confidence {Math.round(view.deal.confidence * 100)}% · strict schema validated before pricing</p>
          </div>
        </section>

        <section className="stage quoteStage" aria-labelledby="quote-heading">
          <div className="stageLabel">
            <span className="stageNumber stageNumberActive">2</span>
            <div><h2 id="quote-heading">Quote verified</h2><p>Integer money · full recompute</p></div>
          </div>
          <div className="stageSurface quoteSurface">
            <div className="quoteSummary">
              <div className="quoteMetrics">
                <QuoteMetric label="TCV" value={formatMoney(view.quote.netTcvCents)} />
                <QuoteMetric label="Year 1" value={formatMoney(yearOne)} />
                <QuoteMetric label={view.quote.years.length > 1 ? "Year 2" : "List TCV"} value={view.quote.years.length > 1 ? formatMoney(yearTwo) : formatMoney(view.quote.listTcvCents)} />
                <QuoteMetric label="Average monthly" value={formatMoney(averageMonthly)} />
              </div>
              <div className={`constraintResult ${budgetDelta !== null && budgetDelta < 0 ? "constraintFailed" : ""}`}>
                <strong>
                  {budgetDelta === null
                    ? "No buyer budget supplied"
                    : budgetDelta >= 0
                      ? `Under year-one budget by ${formatMoney(budgetDelta)}`
                      : `Over year-one budget by ${formatMoney(Math.abs(budgetDelta))}`}
                </strong>
                <span>{budgetDelta === null || budgetDelta >= 0 ? "Deterministic checks complete" : "Budget constraint requires attention"}</span>
              </div>
            </div>

            <div className="quoteDetailGrid">
              <div className="annualBreakdown">
                <h3>Annual breakdown</h3>
                <div className="tableWrap">
                  <table>
                    <thead><tr><th>Year</th><th>Seats</th><th>List</th><th>Discount</th><th>Net</th></tr></thead>
                    <tbody>
                      {view.quote.years.map((quoteYear) => (
                        <tr key={quoteYear.year} className={quoteYear.year === activeYear ? "activeYear" : ""}>
                          <td><button type="button" onClick={() => setActiveYear(quoteYear.year)} aria-pressed={quoteYear.year === activeYear}>Year {quoteYear.year}</button></td>
                          <td>{view.deal.seats.find((item) => item.year === quoteYear.year)?.quantity.toLocaleString() ?? "—"}</td>
                          <td>{formatMoney(quoteYear.listCents)}</td>
                          <td>{formatMoney(quoteYear.discountCents)}</td>
                          <td><strong>{formatMoney(quoteYear.netCents)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><th scope="row" colSpan={2}>Total</th><td>{formatMoney(view.quote.listTcvCents)}</td><td>{formatMoney(view.quote.listTcvCents - view.quote.netTcvCents)}</td><td>{formatMoney(view.quote.netTcvCents)}</td></tr></tfoot>
                  </table>
                </div>
              </div>
              {primaryAlternative && (
                <AlternativeAction
                  alternative={primaryAlternative}
                  active={selectedAlternative === primaryAlternative.id}
                  onSelect={() => {
                    setSelectedAlternative(selectedAlternative === primaryAlternative.id ? null : primaryAlternative.id);
                    setActiveYear(1);
                  }}
                />
              )}
            </div>
          </div>
        </section>

        <section className="stage" aria-labelledby="approval-heading">
          <div className="stageLabel">
            <span className="stageNumber">3</span>
            <div><h2 id="approval-heading">Approval plan</h2><p>Policy DAG</p></div>
          </div>
          <div className="stageSurface approvalSurface">
            <div className="approvalDecision">
              <span className={`approvalStatus ${autoApproved ? "approvalStatusClear" : "approvalStatusReview"}`}>
                {autoApproved ? "Auto-approved" : `${view.approvals.required.length} approvals required`}
              </span>
              <h3>{autoApproved ? "No manual approval required" : `Critical path: ${formatDuration(view.approvals.criticalPathMinutes)}`}</h3>
              <p>
                {autoApproved
                  ? `The ${view.deal.discountBps / 100}% discount, ${paymentTerms} terms, deployment, and deal value remain within configured authority.`
                  : approvalReasons.join(" · ")}
              </p>
            </div>
            <div className="approvalPath">
              <h3>Approval path</h3>
              {autoApproved ? (
                <div className="pathRow"><strong>System decision</strong><span>Deal ready</span><small>Immediate</small></div>
              ) : (
                <ol>
                  {view.approvals.required.map((node) => (
                    <li key={node.id}>
                      <div><strong>{node.team} · {node.label}</strong><span>{node.reasons.join(" · ")}</span></div>
                      <small>{formatDuration(node.slaMinutes)}</small>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="disclosures">
        <details>
          <summary>Evidence &amp; assumptions</summary>
          <div className="disclosureContent evidenceGrid">
            <div><span>Regions</span><strong>{view.deal.regions.join(" + ")}</strong></div>
            <div><span>Compute ramp</span><strong>{view.deal.computeCredits.map((item) => item.quantity.toLocaleString()).join(" → ")}</strong></div>
            <div><span>Gross margin</span><strong>{(view.quote.marginBps / 100).toFixed(1)}%</strong></div>
            <div><span>Selected detail</span><strong>{year ? `Year ${year.year} · ${year.lineItems.length} products` : "No year selected"}</strong></div>
            <ul>
              {view.deal.assumptions.length > 0
                ? view.deal.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)
                : <li>No unstated assumptions were required.</li>}
            </ul>
          </div>
        </details>
        <details>
          <summary>Audit &amp; replay</summary>
          <div className="disclosureContent auditList">
            <div className="auditMeta"><span>{result.audit.length} ordered events</span><code>final hash {result.audit.at(-1)?.digest}</code></div>
            {result.audit.map((event, index) => (
              <div className="auditEvent" key={event.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{event.type.replaceAll("_", " ")}</strong><small>{event.actor}</small></div>
                <p>{event.detail}</p>
                <code>{event.digest}</code>
              </div>
            ))}
          </div>
        </details>
      </div>

      <footer>
        <span>Explainable prompt → quote → approve</span>
        <span>The model proposes. The transaction engine proves.</span>
      </footer>
    </main>
  );
}
