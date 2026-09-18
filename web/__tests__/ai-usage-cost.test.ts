import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { aiUsageEvent: { create: vi.fn(async () => ({})) } },
}));

import { recordAiUsageEvent } from "@/lib/ai/openrouter";
import { prisma } from "@/lib/prisma";
import { estimateCostUsd } from "@/lib/ai/routing";

const create = vi.mocked(prisma.aiUsageEvent.create);

const BASE = {
  workflow: "test_workflow",
  taskClass: "classification" as const,
  model: "some/model",
  success: true,
};

function lastCost(): number | null | undefined {
  return create.mock.calls.at(-1)?.[0].data.estimatedCost;
}

beforeEach(() => {
  create.mockClear();
});

describe("recordAiUsageEvent cost", () => {
  it("falls back to the generic token-rate estimate when no override is given", async () => {
    await recordAiUsageEvent({ ...BASE, inputTokens: 1000, outputTokens: 500 });
    expect(lastCost()).toBeCloseTo(estimateCostUsd("some/model", 1000, 500), 12);
  });

  it("uses an explicit vendor cost in preference to the estimate", async () => {
    await recordAiUsageEvent({
      ...BASE,
      inputTokens: 1000,
      outputTokens: 500,
      estimatedCostUsd: 0.000042,
    });
    expect(lastCost()).toBe(0.000042);
  });

  it("preserves a legitimate zero-cost override rather than falling back", async () => {
    await recordAiUsageEvent({
      ...BASE,
      inputTokens: 1000,
      outputTokens: 500,
      estimatedCostUsd: 0,
    });
    // `??` keeps 0; `||` would have silently substituted the generic estimate.
    expect(lastCost()).toBe(0);
  });

  it("records null when neither an override nor both token counts are present", async () => {
    await recordAiUsageEvent({ ...BASE, inputTokens: 1000 });
    expect(lastCost()).toBeNull();
  });
});
