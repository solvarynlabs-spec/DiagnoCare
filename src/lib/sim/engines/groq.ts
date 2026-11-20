import { TOPICS, detectTopics } from "@/lib/catalog";
import type { Emotion } from "../types";
import { EMOTIONS, systemPrompt } from "./anthropic";
import type { PatientEngine, PatientTurnInput, PatientTurnOutput } from "./types";

/**
 * Groq (OpenAI-compatible Chat Completions API). Key in GROQ_API_KEY, model in GROQ_MODEL.
 * JSON mode keeps the reply machine-readable; the expected shape is spelled out in the prompt.
 */
export const groqModel = () => process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export type GroqMsg = { role: "system" | "user" | "assistant"; content: string };

export async function groqChat(messages: GroqMsg[], { maxTokens = 2048, temperature = 0.6, reasoning = "low" as "low" | "medium" | "high" } = {}): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY manquant");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: groqModel(),
      messages,
      max_tokens: maxTokens,
      temperature,
      response_format: { type: "json_object" },
      // gpt-oss models think before answering: keep it short for a live conversation.
      ...(groqModel().startsWith("openai/gpt-oss") ? { reasoning_effort: reasoning } : {}),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = j.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse Groq vide");
  return text;
}

const JSON_RULES = `

# Output format
Respond with ONE JSON object only, no prose around it:
{"reply": string, "emotion": one of ${JSON.stringify(EMOTIONS)}, "topics": array of zero or more of ${JSON.stringify(TOPICS.map((t) => t.key))}}
- "reply": what the patient says, in character, 1 to 3 sentences.
- "emotion": the patient's current emotion.
- "topics": the history topics the student's latest question addressed.`;

export const groqEngine: PatientEngine = {
  id: "groq",
  async respond(input: PatientTurnInput): Promise<PatientTurnOutput> {
    const messages: GroqMsg[] = [{ role: "system", content: systemPrompt(input) + JSON_RULES }];
    for (const m of input.history.slice(-40)) messages.push({ role: m.role === "student" ? "user" : "assistant", content: m.content });
    messages.push({ role: "user", content: input.question });
    const parsed = JSON.parse(await groqChat(messages)) as { reply?: string; emotion?: Emotion; topics?: string[] };
    if (!parsed.reply) throw new Error("Réponse Groq sans champ reply");
    const valid = new Set<string>(TOPICS.map((t) => t.key));
    return {
      reply: parsed.reply.trim(),
      emotion: parsed.emotion && EMOTIONS.includes(parsed.emotion) ? parsed.emotion : input.content.patient.baselineEmotion,
      topics: [...new Set([...(parsed.topics ?? []).filter((t) => valid.has(t)), ...detectTopics(input.question)])],
      engine: "groq",
    };
  },
};
