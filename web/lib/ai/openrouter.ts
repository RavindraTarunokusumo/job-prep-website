import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { z } from "zod";
import { aiConfig } from "@/lib/ai/config";
import {
  buildUsageEventPayload,
  estimateCostUsd,
  resolveModelRoute,
  type TaskClass,
} from "@/lib/ai/routing";
import { prisma } from "@/lib/prisma";

/** Configured primary model id (for persistence / display). */
export function getOpenRouterModelId(): string {
  return aiConfig.openrouter.model;
}

function requireApiKey(): string {
  const apiKey = aiConfig.openrouter.apiKey;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Add it to web/.env.local to enable AI features.",
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
 * Resolve primary + fallback model ids for a workflow/task class (JOB-90).
 * Pure helper so tests can drive the real routing path without network I/O.
 */
export function selectModelCandidates(
  workflow: string,
  taskClass: TaskClass,
): { candidates: string[]; promptVersion: string; route: ReturnType<typeof resolveModelRoute> } {
  const route = resolveModelRoute(workflow, taskClass);
  const candidates =
    route.primaryModel === route.fallbackModel
      ? [route.primaryModel]
      : [route.primaryModel, route.fallbackModel];
  return { candidates, promptVersion: route.promptVersion, route };
}

/** Persist a sanitized AI usage row (never stores raw CV/JD bodies). */
export async function recordAiUsageEvent(input: {
  userId?: string | null;
  workflow: string;
  taskClass: TaskClass;
  model: string;
  promptVersion?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  retries?: number;
  success: boolean;
  validationOk?: boolean | null;
  meta?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const payload = buildUsageEventPayload({
    userId: input.userId,
    workflow: input.workflow,
    taskClass: input.taskClass,
    model: input.model,
    promptVersion: input.promptVersion,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCost:
      input.inputTokens != null && input.outputTokens != null
        ? estimateCostUsd(input.model, input.inputTokens, input.outputTokens)
        : null,
    latencyMs: input.latencyMs,
    retries: input.retries ?? 0,
    success: input.success,
    validationOk: input.validationOk,
    meta: input.meta,
  });

  try {
    await prisma.aiUsageEvent.create({
      data: {
        userId: payload.userId ?? null,
        workflow: payload.workflow,
        taskClass: payload.taskClass,
        model: payload.model,
        promptVersion: payload.promptVersion ?? null,
        inputTokens: payload.inputTokens ?? null,
        outputTokens: payload.outputTokens ?? null,
        estimatedCost: payload.estimatedCost ?? null,
        latencyMs: payload.latencyMs ?? null,
        retries: payload.retries ?? 0,
        success: payload.success,
        validationOk: payload.validationOk ?? null,
        meta: payload.meta ?? undefined,
      },
    });
  } catch (error) {
    // Telemetry must not break product flows
    console.warn("[ai-usage] failed to record event", error);
  }
}

/**
 * Drop-in for AI SDK generateObject: tries routed primary, then fallback.
 * Tags each attempt to workflow + taskClass and records AiUsageEvent rows.
 */
export async function generateObjectWithFallback<T>(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<T, any, any>;
  system: string;
  prompt: string;
  /** JOB-90 workflow tag (e.g. job_match, mock_interview). */
  workflow?: string;
  /** JOB-90 task class for model routing. */
  taskClass?: TaskClass;
  userId?: string | null;
}): Promise<{ object: T; model: string; promptVersion: string }> {
  const workflow = params.workflow ?? "generic";
  const taskClass = params.taskClass ?? "synthesis";
  const { candidates, promptVersion } = selectModelCandidates(workflow, taskClass);

  let lastError: unknown;
  for (let i = 0; i < candidates.length; i++) {
    const modelId = candidates[i];
    const started = Date.now();
    try {
      const { object } = await generateObject({
        model: getOpenRouterModel(modelId),
        schema: params.schema,
        system: params.system,
        prompt: params.prompt,
      });
      void recordAiUsageEvent({
        userId: params.userId,
        workflow,
        taskClass,
        model: modelId,
        promptVersion,
        latencyMs: Date.now() - started,
        retries: i,
        success: true,
        validationOk: true,
        meta: { attempt: i + 1 },
      });
      return { object: object as T, model: modelId, promptVersion };
    } catch (error) {
      lastError = error;
      void recordAiUsageEvent({
        userId: params.userId,
        workflow,
        taskClass,
        model: modelId,
        promptVersion,
        latencyMs: Date.now() - started,
        retries: i,
        success: false,
        validationOk: false,
        meta: { attempt: i + 1 },
      });
      if (i < candidates.length - 1) {
        console.warn(
          `[openrouter] ${modelId} failed; trying fallback ${candidates[i + 1]}`,
          error,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenRouter generation failed for all configured models.");
}
