import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { SessionSummary } from "./sessions";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const SummarySchema = z.object({
  decisions: z.array(z.string()),
  openQuestions: z.array(z.string()),
  differences: z.array(z.string()),
});

const SYSTEM_PROMPT = `You summarize a team's strategic discussion into short, scannable snippets.

You receive the meeting's topic and a transcript. Produce three lists:
- decisions: concrete calls the room actually made or converged on
- openQuestions: unresolved questions or things the team still needs to settle
- differences: points where participants genuinely disagreed or saw it differently

Rules:
- Each item is one tight sentence (max ~15 words). No preamble, no "the team discussed".
- 0 to 5 items per list. Empty lists are fine — do NOT invent items to fill space.
- Only include things actually grounded in the transcript. Never speculate.
- Prefer specificity ("Ship the CSV importer before Q1 close") over vagueness ("improve onboarding").`;

export async function summarizeTranscript(
  topic: string,
  transcript: string
): Promise<SessionSummary> {
  const response = await client.messages.parse({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\n\nTranscript:\n${transcript}`,
      },
    ],
    output_config: { format: zodOutputFormat(SummarySchema) },
  });

  return (
    response.parsed_output ?? {
      decisions: [],
      openQuestions: [],
      differences: [],
    }
  );
}
