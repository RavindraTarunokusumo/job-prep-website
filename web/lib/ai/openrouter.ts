import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { z } from "zod";
import { aiConfig } from "@/lib/ai/config";

/** Configured primary model id (for persistence / display). */
export function getOpenRouterModelId(): string {
  return aiConfig.openrouter.model;
}

function requireApiKey(): string {
  const apiKey = aiConfig.openrouter.apiKey;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to web/.env.local to enable AI features."
    );
  }
  return apiKey;
}

export function getOpenRouterModel(modelId?: string): LanguageModel {
  const openrouter = createOpenAI({
    apiKey: requireApiKey(),
    baseURL: aiConfig.openrouter.baseURL,
  });
  return openrouter(modelId ?? aiConfig.openrouter.model);
}

/**
 * Drop-in for AI SDK generateObject: tries primary model, then fallback from aiConfig.
 */
export async function generateObjectWithFallback<T>(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<T, any, any>;
  system: string;
  prompt: string;
}): Promise<{ object: T }> {
  const { model, fallbackModel } = aiConfig.openrouter;
  const candidates = model === fallbackModel ? [model] : [model, fallbackModel];

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
      return { object: object as T };
    } catch (error) {
      lastError = error;
      if (i < candidates.length - 1) {
        console.warn(
          `[openrouter] ${modelId} failed; trying fallback ${candidates[i + 1]}`,
          error
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenRouter generation failed for all configured models.");
}
