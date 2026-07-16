import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { z } from "zod";

/** Default primary model on OpenRouter (free tier). */
export const DEFAULT_OPENROUTER_MODEL = "tencent/hy3:free";

/** Default fallback when the primary model fails. */
export const DEFAULT_OPENROUTER_FALLBACK_MODEL =
  "nvidia/nemotron-3-ultra-550b-a55b:free";

export function getOpenRouterModelId(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
}

export function getOpenRouterFallbackModelId(): string {
  return (
    process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_OPENROUTER_FALLBACK_MODEL
  );
}

function requireApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to web/.env.local to enable AI features."
    );
  }
  return apiKey;
}

export function getOpenRouterModel(modelId?: string): LanguageModel {
  const baseURL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  const openrouter = createOpenAI({
    apiKey: requireApiKey(),
    baseURL,
  });

  return openrouter(modelId ?? getOpenRouterModelId());
}

export type GenerateObjectWithFallbackParams<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<T, any, any>;
  system: string;
  prompt: string;
};

/**
 * Try the primary OpenRouter model, then the fallback on any failure.
 * Returns the object and the model id that actually succeeded (for persistence).
 */
export async function generateObjectWithFallback<T>(
  params: GenerateObjectWithFallbackParams<T>
): Promise<{ object: T; modelId: string }> {
  const primaryId = getOpenRouterModelId();
  const fallbackId = getOpenRouterFallbackModelId();
  const candidates =
    primaryId === fallbackId ? [primaryId] : [primaryId, fallbackId];

  let lastError: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const modelId = candidates[i];
    try {
      const { object } = await generateObject({
        model: getOpenRouterModel(modelId),
        schema: params.schema,
        system: params.system,
        prompt: params.prompt,
      });
      return { object: object as T, modelId };
    } catch (error) {
      lastError = error;
      const hasNext = i < candidates.length - 1;
      if (hasNext) {
        console.warn(
          `[openrouter] model ${modelId} failed; trying fallback ${candidates[i + 1]}`,
          error
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenRouter generation failed for all configured models.");
}
