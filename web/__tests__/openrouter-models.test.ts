import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_OPENROUTER_FALLBACK_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  getOpenRouterFallbackModelId,
  getOpenRouterModelId,
} from "@/lib/ai/openrouter";

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
});

describe("OpenRouter model defaults", () => {
  it("defaults primary to tencent/hy3:free", () => {
    delete process.env.OPENROUTER_MODEL;
    expect(getOpenRouterModelId()).toBe(DEFAULT_OPENROUTER_MODEL);
    expect(DEFAULT_OPENROUTER_MODEL).toBe("tencent/hy3:free");
  });

  it("defaults fallback to nvidia/nemotron-3-ultra-550b-a55b:free", () => {
    delete process.env.OPENROUTER_FALLBACK_MODEL;
    expect(getOpenRouterFallbackModelId()).toBe(
      DEFAULT_OPENROUTER_FALLBACK_MODEL
    );
    expect(DEFAULT_OPENROUTER_FALLBACK_MODEL).toBe(
      "nvidia/nemotron-3-ultra-550b-a55b:free"
    );
  });

  it("respects env overrides", () => {
    process.env.OPENROUTER_MODEL = "custom/primary";
    process.env.OPENROUTER_FALLBACK_MODEL = "custom/fallback";
    expect(getOpenRouterModelId()).toBe("custom/primary");
    expect(getOpenRouterFallbackModelId()).toBe("custom/fallback");
  });
});
