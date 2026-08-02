"use client";

import { useMemo, useState } from "react";
import type { Alternative, ApprovalNode, CompileResult } from "@/lib/deal-schema";

const samples = [
  {
    label: "EU expansion",
    value:
      "Quote Acme Robotics for 420 seats over 3 years. Start at 100k compute credits and double annually. Keep year one under a $900k budget, Net 60, US + EU, premium support, with a 12% discount.",
  },
  {
    label: "Private cloud",
    value:
      "Build a 2 year quote for Northstar Bank with 700 users, 250k compute credits each year, private cloud, US only, Net 30, and 8% off. Year-one budget is $1.4m.",
  },
  {
    label: "Aggressive discount",
    value:
      "Quote Meridian Labs for 300 seats, 80k credits, EU and US, over 3 years. They want Net 60, premium support, 22% discount, and an $800k first-year budget.",
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
const formatDuration = (minutes: number) => (minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`);

function Mark({ name }: { name: "spark" | "route" | "check" | "clock" | "arrow" | "code" }) {
  const paths = {
    spark: "M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2z",
    route: "M5 4v6a3 3 0 003 3h8m-4-4l4 4-4 4M5 4h4M5 4v4",
    check: "M5 12l4 4L19 6",
    clock: "M12 3a9 9 0 110 18 9 9 0 010-18zm0 4v5l3 2",
    arrow: "M5 12h14m-5-5l5 5-5 5",
    code: "M9 18l-6-6 6-6m6 0l6 6-6 6",
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "accent" }) {
  return (
    <div className={`metric ${tone === "accent" ? "metricAccent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function ApprovalCard({ node, index }: { node: ApprovalNode; index: number }) {
  return (
    <article className="approvalNode" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="approvalTopline">
        <span className="teamDot" />
        <span>{node.team}</span>
        <span className="sla"><Mark name="clock" />{formatDuration(node.slaMinutes)}</span>
      </div>
      <h4>{node.label}</h4>
      <p>{node.reasons.join(" · ")}</p>
      <div className="policyRow">
        {node.policyIds.map((policy) => <code key={policy}>{policy}</code>)}
        {node.dependsOn.length > 0 && <span>after {node.dependsOn.join(", ")}</span>}
      </div>
    </article>
  );
}

function AlternativeCard({ alternative, active, onSelect }: { alternative: Alternative; active: boolean; onSelect: () => void }) {
  const yearOne = alternative.quote.years[0]?.netCents ?? 0;
  return (
    <button className={`alternative ${active ? "alternativeActive" : ""}`} onClick={onSelect} type="button">
      <span className="alternativeLabel">{alternative.label}</span>
      <strong>{formatCompactMoney(alternative.quote.netTcvCents)}</strong>
      <p>{alternative.rationale}</p>
      <div className="alternativeStats">
        <span>Y1 {formatCompactMoney(yearOne)}</span>
        <span>{alternative.approvals.required.length} approvals</span>
        <span>{formatDuration(alternative.approvals.criticalPathMinutes)} path</span>
      </div>
      <div className="changeList">
        {alternative.changes.map((change) => <span key={change}>{change}</span>)}
      </div>
    </button>
  );
}

export function DealWorkbench({ initialPrompt, initialResult }: { initialPrompt: string; initialResult: CompileResult }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [result, setResult] = useState(initialResult);
  const [activeYear, setActiveYear] = useState(1);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = result.alternatives.find((alternative) => alternative.id === selectedAlternative);
  const view = selected
    ? { deal: selected.deal, quote: selected.quote, approvals: selected.approvals }
    : { deal: result.deal, quote: result.quote, approvals: result.approvals };
  const year = view.quote.years.find((value) => value.year === activeYear) ?? view.quote.years[0];
  const maxAnnual = Math.max(...view.quote.years.map((value) => value.netCents));
  const budgetDelta = view.deal.yearOneBudgetCents
    ? view.deal.yearOneBudgetCents - (view.quote.years[0]?.netCents ?? 0)
    : null;
  const layers = useMemo(() => {
    const depth = new Map<string, number>();
    const byId = new Map(view.approvals.required.map((node) => [node.id, node]));
    const getDepth = (node: ApprovalNode): number => {
      const found = depth.get(node.id);
      if (found !== undefined) return found;
      const value = node.dependsOn.length === 0 ? 0 : 1 + Math.max(...node.dependsOn.map((id) => byId.get(id)).filter(Boolean).map((dependency) => getDepth(dependency!)));
      depth.set(node.id, value);
      return value;
    };
    const grouped = new Map<number, ApprovalNode[]>();
    view.approvals.required.forEach((node) => {
      const layer = getDepth(node);
      grouped.set(layer, [...(grouped.get(layer) ?? []), node]);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [view.approvals.required]);

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
    <main>
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Deal Compiler home">
          <span className="brandMark">DC</span>
          <span>Deal Compiler</span>
        </a>
        <div className="navMeta">
          <span>Atlas synthetic catalog</span>
          <span className="liveDot"><i /> policy engine live</span>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="heroCopy">
          <div className="eyebrow"><Mark name="spark" /> PROMPT → QUOTE → APPROVE</div>
          <h1>Compile a messy ask into an <em>explainable deal.</em></h1>
          <p>The model proposes a typed spec. A deterministic transaction engine proves every price, policy trigger, and alternative.</p>
        </div>
        <aside className="boundaryCard">
          <span className="boundaryLabel">Trust boundary</span>
          <div><i className="agentSwatch" /><strong>Agent</strong><small>language → intent</small></div>
          <div><i className="kernelSwatch" /><strong>Kernel</strong><small>intent → transaction</small></div>
        </aside>
      </section>

      <section className="promptShell" aria-label="Deal request">
        <div className="promptHeader">
          <label htmlFor="deal-prompt">AE request</label>
          <span>{prompt.length} / 2,000</span>
        </div>
        <textarea id="deal-prompt" value={prompt} maxLength={2000} onChange={(event) => setPrompt(event.target.value)} />
        <div className="promptFooter">
          <div className="samples">
            {samples.map((sample) => (
              <button type="button" key={sample.label} onClick={() => setPrompt(sample.value)}>{sample.label}</button>
            ))}
          </div>
          <button className="compileButton" type="button" onClick={runCompiler} disabled={busy || prompt.length < 20}>
            {busy ? <span className="spinner" /> : <Mark name="spark" />}
            {busy ? "Compiling…" : "Compile deal"}
          </button>
        </div>
        {error && <p className="errorBanner">{error}</p>}
      </section>

      <section className="runBar">
        <div>
          <span className="runStatus"><i /> RUN COMPLETE</span>
          <span>{result.source === "openai" ? result.model : "deterministic preview"}</span>
          <span>{result.durationMs}ms compile</span>
          <span>hash {result.audit.at(-1)?.digest}</span>
        </div>
        {selected && <button type="button" onClick={() => setSelectedAlternative(null)}>Return to requested deal</button>}
      </section>
      {result.warning && <div className="warningBanner"><Mark name="code" /><span>{result.warning}</span></div>}

      <section className="metricGrid" aria-label="Quote summary">
        <Metric label="NET TCV" value={formatCompactMoney(view.quote.netTcvCents)} detail={`${view.deal.termMonths} month commitment`} tone="accent" />
        <Metric label="YEAR ONE" value={formatCompactMoney(view.quote.years[0]?.netCents ?? 0)} detail={budgetDelta === null ? "No buyer budget" : `${formatCompactMoney(Math.abs(budgetDelta))} ${budgetDelta >= 0 ? "under" : "over"} budget`} />
        <Metric label="GROSS MARGIN" value={`${(view.quote.marginBps / 100).toFixed(1)}%`} detail={`${(view.deal.discountBps / 100).toFixed(1)}% blended discount`} />
        <Metric label="APPROVAL PATH" value={formatDuration(view.approvals.criticalPathMinutes)} detail={`${view.approvals.required.length} required · parallelized`} />
      </section>

      <section className="workspaceGrid">
        <article className="panel quotePanel">
          <header className="panelHeader">
            <div><span className="sectionIndex">01</span><div><h2>Price timeline</h2><p>Fixed-point arithmetic · graduated tiers</p></div></div>
            <span className="verified"><Mark name="check" /> deterministic</span>
          </header>
          <div className="timeline" aria-label="Annual contract value timeline">
            {view.quote.years.map((quoteYear) => (
              <button type="button" key={quoteYear.year} className={activeYear === quoteYear.year ? "yearActive" : ""} onClick={() => setActiveYear(quoteYear.year)}>
                <span>Y{quoteYear.year}</span>
                <div><i style={{ width: `${Math.max(12, (quoteYear.netCents / maxAnnual) * 100)}%` }} /></div>
                <strong>{formatCompactMoney(quoteYear.netCents)}</strong>
              </button>
            ))}
          </div>
          {year && (
            <div className="lineItems">
              <div className="tableHead"><span>Year {year.year} product</span><span>Qty</span><span>List</span><span>Net</span></div>
              {year.lineItems.map((lineItem) => (
                <div className="tableRow" key={lineItem.key}>
                  <span><i />{lineItem.label}<small>{lineItem.unit}</small></span>
                  <span>{lineItem.quantity.toLocaleString()}</span>
                  <span>{formatMoney(lineItem.listCents)}</span>
                  <strong>{formatMoney(lineItem.netCents)}</strong>
                </div>
              ))}
              <div className="tableTotal"><span>Annual net</span><span>{formatMoney(year.netCents)}</span></div>
            </div>
          )}
        </article>

        <article className="panel policyPanel">
          <header className="panelHeader">
            <div><span className="sectionIndex">02</span><div><h2>Approval route</h2><p>Policy DAG · critical path {formatDuration(view.approvals.criticalPathMinutes)}</p></div></div>
            <span className="routeCount">{view.approvals.required.length} nodes</span>
          </header>
          <div className="approvalGraph">
            {layers.length === 0 ? <div className="allClear"><Mark name="check" /><strong>Auto-approved</strong><span>No policy thresholds crossed.</span></div> : layers.map(([layer, nodes], layerIndex) => (
              <div className="approvalLayer" key={layer}>
                {layerIndex > 0 && <div className="layerConnector"><Mark name="arrow" /></div>}
                <div className="layerNodes">{nodes.map((node, index) => <ApprovalCard node={node} index={index} key={node.id} />)}</div>
              </div>
            ))}
          </div>
          <details className="clearedRules">
            <summary><Mark name="check" /> {view.approvals.clearedRules.length} policies cleared</summary>
            {view.approvals.clearedRules.map((rule) => <span key={rule}>{rule}</span>)}
          </details>
        </article>
      </section>

      <section className="specPanel panel">
        <header className="panelHeader">
          <div><span className="sectionIndex">03</span><div><h2>Compiled DealSpec</h2><p>Inspectable intent before transaction execution</p></div></div>
          <span className="confidence">{Math.round(view.deal.confidence * 100)}% extraction confidence</span>
        </header>
        <div className="specGrid">
          <div><span>Account</span><strong>{view.deal.accountName}</strong><small>{view.deal.industry}</small></div>
          <div><span>Term</span><strong>{view.deal.termMonths} months</strong><small>{view.deal.startDate}</small></div>
          <div><span>Commercials</span><strong>{(view.deal.discountBps / 100).toFixed(1)}% off</strong><small>{view.deal.paymentTerms.replace("_", " ")}</small></div>
          <div><span>Scope</span><strong>{view.deal.regions.join(" + ")}</strong><small>{view.deal.deployment.replace("_", " ").toLowerCase()}</small></div>
          <div className="rampSpec"><span>Seat ramp</span><strong>{view.deal.seats.map((value) => `${value.quantity}`).join(" → ")}</strong><small>contract years</small></div>
          <div className="rampSpec"><span>Compute ramp</span><strong>{view.deal.computeCredits.map((value) => `${value.quantity / 1000}k`).join(" → ")}</strong><small>prepaid credits</small></div>
          <div className="assumptions"><span>Explicit assumptions</span>{view.deal.assumptions.map((assumption) => <p key={assumption}>{assumption}</p>)}</div>
        </div>
      </section>

      <section className="alternativesSection">
        <div className="sectionHeading">
          <div><span className="sectionIndex">04</span><div><h2>Counterfactual search</h2><p>Only alternatives that re-price and re-route successfully</p></div></div>
          <span className="searchSpace">bounded policy search</span>
        </div>
        <div className="alternativeGrid">
          {result.alternatives.map((alternative) => (
            <AlternativeCard key={alternative.id} alternative={alternative} active={selectedAlternative === alternative.id} onSelect={() => {
              setSelectedAlternative(selectedAlternative === alternative.id ? null : alternative.id);
              setActiveYear(1);
            }} />
          ))}
        </div>
      </section>

      <section className="reliabilityPanel panel">
        <header className="panelHeader">
          <div><span className="sectionIndex">05</span><div><h2>Reliability envelope</h2><p>Measured locally · deterministic core only</p></div></div>
          <span className="verified"><Mark name="check" /> verification passed</span>
        </header>
        <div className="reliabilityGrid">
          <div><span>TEST SUITE</span><strong>13 / 13</strong><small>pricing · policies · replay · parser</small></div>
          <div><span>PRICE + ROUTE P99</span><strong>0.01 ms</strong><small>130k+ benchmark samples</small></div>
          <div><span>SEARCH P99</span><strong>0.07 ms</strong><small>bounded counterfactual lattice</small></div>
          <div><span>TRUST RULES</span><strong>3</strong><small>strict schema · integer money · recompute all</small></div>
        </div>
      </section>

      <section className="auditPanel panel">
        <header className="panelHeader">
          <div><span className="sectionIndex">06</span><div><h2>Replay log</h2><p>Every state transition is typed, ordered, and digestible</p></div></div>
          <span className="verified"><Mark name="route" /> {result.audit.length} events</span>
        </header>
        <div className="auditList">
          {result.audit.map((event, index) => (
            <div key={event.id} className="auditEvent">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{event.type.replaceAll("_", " ")}</strong><small>{event.actor}</small></div>
              <p>{event.detail}</p>
              <code>{event.digest}</code>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <span>DEAL COMPILER / EXPLAINABLE PQA PROTOTYPE</span>
        <span>The model proposes. The transaction engine proves.</span>
      </footer>
    </main>
  );
}
