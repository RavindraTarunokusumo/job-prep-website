import { aiConfig } from "./config";

/** Task classes for model routing (JOB-90). */
export const taskClasses = [
  "extraction",
  "classification",
  "matching",
  "synthesis",
  "rewriting",
  "interview_generation",
  "feedback",
] as const;

export type TaskClass = (typeof taskClasses)[number];

export type ModelRoute = {
  workflow: string;
  taskClass: TaskClass;
  primaryModel: string;
  fallbackModel: string;
  promptVersion: string;
};

/**
 * Configurable routing table. Change models here without rewriting product workflows.
 * Env overrides still apply as defaults from aiConfig.
 */
const ROUTE_TABLE: Record<
  TaskClass,
  { primary?: string; fallback?: string; promptVersion: string }
> = {
  extraction: { promptVersion: "extract-v1" },
  classification: { promptVersion: "classify-v1" },
  matching: { promptVersion: "match-v1" },
  synthesis: {
    primary: aiConfig.openrouter.model,
    promptVersion: "synth-v1",
  },
  rewriting: { promptVersion: "rewrite-v1" },
  interview_generation: { promptVersion: "interview-v1" },
  feedback: { promptVersion: "feedback-v1" },
};

export function resolveModelRoute(
  workflow: string,
  taskClass: TaskClass,
): ModelRoute {
  const entry = ROUTE_TABLE[taskClass];
  return {
    workflow,
    taskClass,
    primaryModel: entry.primary ?? aiConfig.openrouter.model,
    fallbackModel: entry.fallback ?? aiConfig.openrouter.fallbackModel,
    promptVersion: entry.promptVersion,
  };
}

export type AiUsageTelemetry = {
  userId?: string | null;
  workflow: string;
  taskClass: TaskClass;
  model: string;
  promptVersion?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCost?: number | null;
  latencyMs?: number | null;
  retries?: number;
  success: boolean;
  validationOk?: boolean | null;
  /** Must never include raw CV/JD/interview body text */
  meta?: Record<string, string | number | boolean | null>;
};

const FORBIDDEN_META_KEYS = /raw|content|resume|cv|jd|transcript|answer_text/i;

export function sanitizeTelemetryMeta(
  meta: AiUsageTelemetry["meta"],
): Record<string, string | number | boolean | null> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (FORBIDDEN_META_KEYS.test(k)) continue;
    if (typeof v === "string" && v.length > 200) continue;
    out[k] = v;
  }
  return out;
}

/** Rough USD estimate from token counts (configurable rates). */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  rates: { inputPerMTok: number; outputPerMTok: number } = {
    inputPerMTok: 0.15,
    outputPerMTok: 0.6,
  },
): number {
  void model;
  return (
    (inputTokens / 1_000_000) * rates.inputPerMTok +
    (outputTokens / 1_000_000) * rates.outputPerMTok
  );
}

export function buildUsageEventPayload(event: AiUsageTelemetry): AiUsageTelemetry {
  return {
    ...event,
    meta: sanitizeTelemetryMeta(event.meta),
  };
}
