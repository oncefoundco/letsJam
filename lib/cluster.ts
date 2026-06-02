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
  summary?: SessionSummary,
  refineContext?: string[]
): Promise<Perspective[]> {
  const written = reflections
    .filter((r) => !r.passed && r.text.trim().length > 0)
    .map((r) => `${r.name}: ${r.text}`)
    .join("\n\n");

  const refine =
    refineContext && refineContext.length > 0
      ? `\n\nThe previous round was sent back to refine. What people said was missing:\n${refineContext.join(
          "\n"
        )}\nMake the two paths genuinely sharper and address these gaps.`
      : "";

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
        content: `Topic: ${topic}\n\n${context}\n\nPrivate reflections:\n${written}${refine}`,
      },
    ],
    output_config: { format: zodOutputFormat(ClusterSchema) },
  });

  const out = response.parsed_output?.perspectives ?? [];
  const labels = ["Perspective A", "Perspective B"];
  return out.slice(0, 2).map((p, i) => ({ label: labels[i] ?? `Perspective ${i + 1}`, ...p }));
}

// ── Dot-voting options ───────────────────────────────────────────────────────
// Each private reflection is a participant's proposed direction. Turn the takes
// into distinct option cards the room will dot-vote on (one per proposal, merging
// only near-identical ones).

const OptionsSchema = z.object({
  options: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      attribution: z.string(),
    })
  ),
});

const OPTIONS_SYSTEM_PROMPT = `You read a team's PRIVATE ideas on a strategic question. Each line is ONE idea a participant proposed (a single person may have submitted several). Cluster ideas that ALIGN across different people into OPTION CARDS — "buckets" — the room will dot-vote on.

For each option (bucket):
- title: a short, concrete name for the direction (max ~8 words). Not vague.
- body: 2-3 sentences — what the option is and the reasoning behind it.
- attribution: whose ideas it merges, by name. e.g. "Simon's idea" or "Shaped by Maya and Theo".

Rules:
- Bucket ideas that mean the same thing into ONE card — especially when two or more DIFFERENT people proposed it — and combine their attributions.
- Produce one card per distinct idea/bucket. Aim for 2-6 cards; each must be a genuinely DIFFERENT direction, not a rephrasing.
- Ground everything in what people actually wrote. Do not invent ideas nobody raised.
- Be specific and decision-oriented — these are the options the team votes between.
- The transcript summary (if provided) is only background; the ideas are the real signal.`;

export type ProposedOption = { title: string; body: string; attribution: string };

export async function proposeOptions(
  topic: string,
  // One entry per idea (the 3-takes-per-person rows), each tagged with its
  // author. The clusterer buckets aligned ideas across people into option cards.
  entries: { name: string; text: string }[],
  summary?: SessionSummary,
  refineContext?: string[]
): Promise<ProposedOption[]> {
  const written = entries
    .filter((e) => e.text.trim().length > 0)
    .map((e) => `${e.name}: ${e.text}`)
    .join("\n\n");

  const refine =
    refineContext && refineContext.length > 0
      ? `\n\nThe previous round was sent back to refine. What was missing:\n${refineContext.join(
          "\n"
        )}\nMake the options genuinely sharper and address these gaps.`
      : "";

  const context = summary
    ? [
        "Discussion context (background only):",
        summary.decisions.length ? `Decisions: ${summary.decisions.join("; ")}` : "",
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
        text: OPTIONS_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\n\n${context}\n\nIdeas (one per line, tagged by author):\n${written}${refine}`,
      },
    ],
    output_config: { format: zodOutputFormat(OptionsSchema) },
  });

  return (response.parsed_output?.options ?? []).slice(0, 6);
}
