import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  transcript: z.string().min(20).max(20_000),
  context: z.string().max(500).optional(),
});

const SYSTEM_PROMPT = `You summarise transcribed voice notes from a goalkeeper mentor into a short, structured coaching summary.

Return STRICT JSON with this exact shape:
{
  "headline": string,                 // one sentence, max 120 chars
  "strengths": string[],              // 0-5 concise bullets (max 140 chars each)
  "improvements": string[],           // 0-5 concise bullets
  "keyMoments": string[]              // 0-5 concise time/event bullets
}

Rules:
- Only include information the transcript supports. Do not invent details.
- Keep player, club, drill, opponent and score references verbatim.
- If a section has nothing, return an empty array.
- Do NOT wrap in markdown fences. Return only the JSON object.`;

export type StructuredSummary = {
  headline: string;
  strengths: string[];
  improvements: string[];
  keyMoments: string[];
};

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((s) => (s.length > 200 ? `${s.slice(0, 197)}…` : s));
}

export const summarizeTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI service is not configured." };

    const userText =
      (data.context?.trim() ? `Context: ${data.context.trim()}\n\n` : "") +
      `Transcript:\n${data.transcript.trim()}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { ok: false as const, error: "Rate limit reached — please try again in a moment." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted — add credits in workspace settings." };
      console.error("summarizeTranscript gateway error", res.status);
      return { ok: false as const, error: `Summary failed (${res.status}).` };
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return { ok: false as const, error: "No summary returned." };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // try to extract the first JSON object
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return { ok: false as const, error: "Could not parse summary." };
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return { ok: false as const, error: "Could not parse summary." };
      }
    }

    const obj = (parsed ?? {}) as Record<string, unknown>;
    const headlineRaw = typeof obj.headline === "string" ? obj.headline.trim() : "";
    const summary: StructuredSummary = {
      headline: headlineRaw.length > 200 ? `${headlineRaw.slice(0, 197)}…` : headlineRaw,
      strengths: coerceStringArray(obj.strengths),
      improvements: coerceStringArray(obj.improvements),
      keyMoments: coerceStringArray(obj.keyMoments),
    };

    return { ok: true as const, summary };
  });
