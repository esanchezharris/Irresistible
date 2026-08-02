import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { dealSpecSchema } from "@/lib/deal-schema";
import { parseDemoPrompt } from "@/lib/demo-parser";
import { compileDeal } from "@/lib/compiler";

export const runtime = "nodejs";

const requestSchema = z.object({ prompt: z.string().min(20).max(2_000) });

const SYSTEM_PROMPT = `You compile an account executive's unstructured deal request into a DealSpec.

Rules:
- Extract intent; never invent policy decisions, approval routes, or calculated prices.
- Currency is USD. discountBps is percentage points times 100 (12% = 1200).
- Convert budgets to integer cents.
- Normalize the requested term to 12-60 months.
- Produce one seat and compute-credit quantity for every contract year. Carry a quantity forward when no later change is given.
- "double annually" means year N is 2x year N-1.
- Use ISO date 2026-09-01 when no start date is supplied.
- Default to Net 30, shared cloud, standard support, and US when omitted.
- Put every material default or ambiguity in assumptions. confidence reflects extraction certainty.
- Ask no follow-up questions in this demo; represent ambiguity in assumptions.`;

export async function POST(request: Request) {
  const startedAt = performance.now();
  const parsedRequest = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedRequest.success) {
    return Response.json({ error: "Enter a deal request between 20 and 2,000 characters." }, { status: 400 });
  }

  const { prompt } = parsedRequest.data;
  if (!process.env.OPENAI_API_KEY) {
    const deal = dealSpecSchema.parse(parseDemoPrompt(prompt));
    return Response.json(
      compileDeal(prompt, deal, {
        source: "demo-parser",
        model: null,
        warning: "OPENAI_API_KEY is not configured, so this run used the transparent deterministic demo parser.",
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      text: { format: zodTextFormat(dealSpecSchema, "deal_spec") },
    });

    if (!response.output_parsed) throw new Error("The model returned no parsed DealSpec.");
    const deal = dealSpecSchema.parse(response.output_parsed);
    return Response.json(
      compileDeal(prompt, deal, {
        source: "openai",
        model,
        warning: null,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown model error";
    return Response.json({ error: `Deal compilation failed: ${message}` }, { status: 502 });
  }
}
