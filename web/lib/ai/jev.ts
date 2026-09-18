import { z } from "zod";
import { aiConfig } from "@/lib/ai/config";
import { recordAiUsageEvent } from "@/lib/ai/openrouter";
import type { TaskClass } from "@/lib/ai/routing";

/**
 * TypeSafe "System One" (Jev) client.
 *
 * Jev returns typed judgments and probability distributions, never text.
 * Independent questions over the same state are answered in parallel by the
 * vendor, so callers should send them in a single request.
 *
 * Server-only: the API key must never be bundled into client code.
 */

/** Input-token price; output tokens are free (vendor pricing). */
const JEV_INPUT_USD_PER_MTOK = 0.042;

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 250;
const RETRYABLE_STATUS = new Set([429, 529]);

export type JevQuestion =
  | { type: "noul"; instructions: string; criteria?: { true: string; false: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string | null> }
  | { type: "score"; instructions: string; criteria: string[] };

export type JevNoulAnswer = { type: "noul"; noul: number };
export type JevChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};
export type JevScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};
export type JevAnswer = JevNoulAnswer | JevChoiceAnswer | JevScoreAnswer;

const jevAnswerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("noul"), noul: z.number() }),
  z.object({
    type: z.literal("choice"),
    choice: z.string(),
    probabilities: z.record(z.string(), z.number()),
    confidence: z.number(),
  }),
  z.object({
    type: z.literal("score"),
    score: z.number(),
    legend: z.record(z.string(), z.string()),
    probabilities: z.record(z.string(), z.number()),
    confidence: z.number(),
  }),
]);

const jevResponseSchema = z.object({
  model: z.string(),
  answers: z.record(z.string(), jevAnswerSchema),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
});

export type JevUsage = { inputTokens: number; outputTokens: number };

export type JevResponse = {
  model: string;
  answers: Record<string, JevAnswer>;
  usage: JevUsage;
  latencyMs: number;
  retries: number;
};

/** Injectable transport so tests never touch the network. */
export type JevFetch = typeof fetch;

export type JevRequest = {
  state: string;
  questions: Record<string, JevQuestion>;
  userId?: string | null;
  /** Telemetry tag; defaults to a generic Jev workflow. */
  workflow?: string;
  taskClass?: TaskClass;
  fetchImpl?: JevFetch;
  maxRetries?: number;
  retryDelayMs?: number;
};

export class JevApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "JevApiError";
    this.status = status;
  }
}

function requireApiKey(): string {
  const apiKey = aiConfig.typesafe.apiKey;
  if (!apiKey) {
    throw new Error(
      "TYPESAFE_API_KEY is not configured. Add it to web/.env.local to enable Jev scoring.",
    );
  }
  return apiKey;
}

export function getJevModelId(): string {
  return aiConfig.typesafe.model;
}

export function estimateJevCostUsd(inputTokens: number): number {
  return (inputTokens / 1_000_000) * JEV_INPUT_USD_PER_MTOK;
}

export function buildJevRequestBody(input: {
  state: string;
  questions: Record<string, JevQuestion>;
  model?: string;
}): { state: string; model: string; questions: Record<string, JevQuestion> } {
  if (Object.keys(input.questions).length === 0) {
    throw new Error("askJev requires at least one question.");
  }
  return {
    state: input.state,
    model: input.model ?? getJevModelId(),
    questions: input.questions,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Full System One call: answers plus usage/latency for the eval harness. */
export async function callJev(input: JevRequest): Promise<JevResponse> {
  const apiKey = requireApiKey();
  const model = getJevModelId();
  const body = buildJevRequestBody({
    state: input.state,
    questions: input.questions,
    model,
  });
  const doFetch = input.fetchImpl ?? fetch;
  const maxRetries = input.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = input.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const workflow = input.workflow ?? "jev_system_one";
  const taskClass = input.taskClass ?? "classification";

  const started = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await doFetch(`${aiConfig.typesafe.baseURL}/systemone`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new JevApiError(
          res.status,
          `TypeSafe request failed with ${res.status}: ${detail.slice(0, 500)}`,
        );
      }

      const parsed = jevResponseSchema.parse(await res.json());
      const usage = {
        inputTokens: parsed.usage.input_tokens,
        outputTokens: parsed.usage.output_tokens,
      };
      const latencyMs = Date.now() - started;

      void recordAiUsageEvent({
        userId: input.userId,
        workflow,
        taskClass,
        model: parsed.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        // Vendor rates, not OpenRouter's: Jev output tokens are free.
        estimatedCostUsd: estimateJevCostUsd(usage.inputTokens),
        latencyMs,
        retries: attempt,
        success: true,
        validationOk: true,
        // Never include CV text here.
        meta: {
          questions: Object.keys(body.questions).length,
        },
      });

      return {
        model: parsed.model,
        answers: parsed.answers,
        usage,
        latencyMs,
        retries: attempt,
      };
    } catch (error) {
      const retryable =
        error instanceof JevApiError && RETRYABLE_STATUS.has(error.status);
      if (retryable && attempt < maxRetries) {
        await sleep(retryDelayMs * 2 ** attempt);
        continue;
      }
      void recordAiUsageEvent({
        userId: input.userId,
        workflow,
        taskClass,
        model,
        latencyMs: Date.now() - started,
        retries: attempt,
        success: false,
        validationOk: false,
        meta: {
          questions: Object.keys(body.questions).length,
          status: error instanceof JevApiError ? error.status : null,
        },
      });
      throw error;
    }
  }

  // Unreachable: every loop iteration either returns or throws.
  throw new Error("TypeSafe request failed.");
}

/** Spec-level interface: state + questions in, answers out. */
export async function askJev(
  input: JevRequest,
): Promise<Record<string, JevAnswer>> {
  const response = await callJev(input);
  return response.answers;
}
