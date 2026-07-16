import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_MODEL = process.env.OPENROUTER_MODEL;
const ORIGINAL_FALLBACK = process.env.OPENROUTER_FALLBACK_MODEL;

afterEach(() => {
  if (ORIGINAL_MODEL === undefined) {
    delete process.env.OPENROUTER_MODEL;
  } else {
    process.env.OPENROUTER_MODEL = ORIGINAL_MODEL;
  }
  if (ORIGINAL_FALLBACK === undefined) {
    delete process.env.OPENROUTER_FALLBACK_MODEL;
  } else {
    process.env.OPENROUTER_FALLBACK_MODEL = ORIGINAL_FALLBACK;
  }
  vi.resetModules();
});

describe("aiConfig OpenRouter models", () => {
  it("defaults primary and fallback from config module", async () => {
    delete process.env.OPENROUTER_MODEL;
    delete process.env.OPENROUTER_FALLBACK_MODEL;
    vi.resetModules();
    const { aiConfig } = await import("@/lib/ai/config");
    expect(aiConfig.openrouter.model).toBe("tencent/hy3:free");
    expect(aiConfig.openrouter.fallbackModel).toBe(
      "nvidia/nemotron-3-ultra-550b-a55b:free"
    );
  });

  it("respects env overrides via config", async () => {
    process.env.OPENROUTER_MODEL = "custom/primary";
    process.env.OPENROUTER_FALLBACK_MODEL = "custom/fallback";
    vi.resetModules();
    const { aiConfig } = await import("@/lib/ai/config");
    expect(aiConfig.openrouter.model).toBe("custom/primary");
    expect(aiConfig.openrouter.fallbackModel).toBe("custom/fallback");
  });
});
