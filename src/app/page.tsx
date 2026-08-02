import { DealWorkbench } from "@/components/deal-workbench";
import { compileDeal } from "@/lib/compiler";
import { parseDemoPrompt } from "@/lib/demo-parser";

export const dynamic = "force-static";

const initialPrompt =
  "Quote Acme Robotics for 420 seats over 3 years. Start at 100k compute credits and double annually. Keep year one under a $900k budget, Net 60, US + EU, premium support, with a 12% discount.";

export default function Home() {
  const initialResult = compileDeal(initialPrompt, parseDemoPrompt(initialPrompt), {
    source: "demo-parser",
    model: null,
    warning: null,
    durationMs: 4,
  });

  return <DealWorkbench initialPrompt={initialPrompt} initialResult={initialResult} />;
}
