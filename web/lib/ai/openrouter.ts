import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export function getOpenRouterModelId(): string {
  return process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
}

export function getOpenRouterModel(): LanguageModel {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to web/.env.local to enable AI features."
    );
  }

  const baseURL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  const openrouter = createOpenAI({
    apiKey,
    baseURL,
  });

  return openrouter(getOpenRouterModelId());
}