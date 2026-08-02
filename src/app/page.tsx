import { DealWorkbench } from "@/components/deal-workbench";
import { compileDeal } from "@/lib/compiler";
import { parseDemoPrompt } from "@/lib/demo-parser";

export const dynamic = "force-static";

const initialPrompt =
  "Quote Atlas Manufacturing for 125 seats in year one and 250 seats in year two over 24 months. Include 50,000 compute credits each year, Net 30, shared cloud, standard support, US only, and a 5% discount.";

export default function Home() {
  const initialResult = compileDeal(initialPrompt, parseDemoPrompt(initialPrompt), {
    source: "demo-parser",
    model: null,
    warning: null,
    durationMs: 4,
  });

  return <DealWorkbench initialPrompt={initialPrompt} initialResult={initialResult} />;
}
