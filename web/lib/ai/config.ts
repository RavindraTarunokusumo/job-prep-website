/**
 * Single source of truth for AI / OpenRouter configuration.
 * Override via env; do not hardcode model ids elsewhere.
 */
export const aiConfig = {
  openrouter: {
    /** Required for live AI features (server-only). */
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    baseURL:
      process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    /** Primary model for all Phase 4 LLM calls. */
    model: process.env.OPENROUTER_MODEL ?? "tencent/hy3:free",
    /** Used only when the primary model call fails. */
    fallbackModel:
      process.env.OPENROUTER_FALLBACK_MODEL ??
      "nvidia/nemotron-3-ultra-550b-a55b:free",
  },
} as const;
