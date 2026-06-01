import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMBEDDING_DIM } from "@/constants";

const CHAT_MODEL = process.env.MISTRAL_CHAT_MODEL ?? "mistral-large-latest";
const EMBED_MODEL = process.env.MISTRAL_EMBED_MODEL ?? "mistral-embed";

// Rough public pricing ($/1M tokens) used only for the cost_estimate audit
// column — not billing-grade, just an order of magnitude for observability.
const COST_PER_1M = { input: 2, output: 6 } as const;

let client: Mistral | null = null;
function getClient(): Mistral {
  if (!client) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error("MISTRAL_API_KEY is not set");
    client = new Mistral({ apiKey });
  }
  return client;
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function logUsage(params: {
  userId: string | null;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: "success" | "error";
}): Promise<void> {
  const cost =
    (params.inputTokens / 1_000_000) * COST_PER_1M.input +
    (params.outputTokens / 1_000_000) * COST_PER_1M.output;
  try {
    await createAdminClient()
      .from("llm_logs")
      .insert({
        user_id: params.userId,
        operation: params.operation,
        model: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        latency_ms: params.latencyMs,
        cost_estimate: cost,
        status: params.status,
      });
  } catch {
    // Audit logging must never break the pipeline.
  }
}

/**
 * Calls Mistral in JSON mode, validates the response against `schema`, and
 * records an `llm_logs` audit row. `operation` and `userId` are for auditing.
 */
export async function chatJSON<T>(params: {
  operation: string;
  userId: string | null;
  messages: ChatMessage[];
  schema: z.ZodType<T>;
}): Promise<T> {
  const started = Date.now();
  try {
    const result = await getClient().chat.complete({
      model: CHAT_MODEL,
      messages: params.messages,
      responseFormat: { type: "json_object" },
    });

    const content = result.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : "";

    await logUsage({
      userId: params.userId,
      operation: params.operation,
      model: CHAT_MODEL,
      inputTokens: result.usage?.promptTokens ?? 0,
      outputTokens: result.usage?.completionTokens ?? 0,
      latencyMs: Date.now() - started,
      status: "success",
    });

    return params.schema.parse(JSON.parse(text || "{}"));
  } catch (error) {
    await logUsage({
      userId: params.userId,
      operation: params.operation,
      model: CHAT_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - started,
      status: "error",
    });
    throw error;
  }
}

/** Embeds a single text into a `mistral-embed` vector. */
export async function embed(params: {
  operation: string;
  userId: string | null;
  text: string;
}): Promise<number[]> {
  const started = Date.now();
  const result = await getClient().embeddings.create({
    model: EMBED_MODEL,
    inputs: [params.text.slice(0, 8000)],
  });

  await logUsage({
    userId: params.userId,
    operation: params.operation,
    model: EMBED_MODEL,
    inputTokens: result.usage?.promptTokens ?? 0,
    outputTokens: 0,
    latencyMs: Date.now() - started,
    status: "success",
  });

  const vector = result.data?.[0]?.embedding ?? [];
  if (vector.length !== EMBEDDING_DIM) {
    // Non-fatal: callers still store whatever dimension came back, but a
    // mismatch means the column type and the model drifted apart.
    return vector;
  }
  return vector;
}
