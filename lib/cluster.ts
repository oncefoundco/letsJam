import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Perspective, Reflection, SessionSummary } from "./sessions";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const ClusterSchema = z.object({
  perspectives: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      attribution: z.string(),
    })
  ),
});

const SYSTEM_PROMPT = `You read a team's PRIVATE written reflections on a strategic question and cluster them into exactly TWO distinct paths the room could take.

For each path:
- title: a short, concrete name for the direction (max ~10 words). Not vague.
- body: 2-3 sentences explaining what this path is and the reasoning behind it.
- attribution: which participants' thinking shaped this path, by name. e.g. "Shaped by Simon's focus on retention and Anjila's cost concerns."

Rules:
- Return EXACTLY 2 paths. They must be genuinely DIFFERENT directions — not two phrasings of the same idea.
- Ground everything in what people actually wrote. Do not invent positions nobody raised.
- If the room largely agrees, surface the strongest path vs. its most credible alternative or the key unresolved tension.
- Be specific and decision-oriented — these are the two options the team will vote between.
- The transcript summary (if provided) is only background context; the reflections are the real signal to cluster.`;

export async function clusterReflections(
  topic: string,
  reflections: Reflection[],
  summary?: SessionSummary
): Promise<Perspective[]> {
  const written = reflections
    .filter((r) => !r.passed && r.text.trim().length > 0)
    .map((r) => `${r.name}: ${r.text}`)
    .join("\n\n");

  const context = summary
    ? [
        "Discussion context (background only):",
        summary.decisions.length
          ? `Decisions: ${summary.decisions.join("; ")}`
          : "",
        summary.openQuestions.length
          ? `Open questions: ${summary.openQuestions.join("; ")}`
          : "",
        summary.differences.length
          ? `Differences: ${summary.differences.join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const response = await client.messages.parse({
    model: "claude-sonnet-4-6",
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
        content: `Topic: ${topic}\n\n${context}\n\nPrivate reflections:\n${written}`,
      },
    ],
    output_config: { format: zodOutputFormat(ClusterSchema) },
  });

  const out = response.parsed_output?.perspectives ?? [];
  const labels = ["Perspective A", "Perspective B"];
  return out.slice(0, 2).map((p, i) => ({ label: labels[i] ?? `Perspective ${i + 1}`, ...p }));
}
