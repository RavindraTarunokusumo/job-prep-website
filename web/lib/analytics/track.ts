import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  FORBIDDEN_PROP_KEYS,
  type AnalyticsEventName,
} from "@/lib/analytics/events";

const forbiddenSet = new Set<string>(FORBIDDEN_PROP_KEYS);

/** Scalar-only props safe for AnalyticsEvent JSON. */
export type AnalyticsProps = Record<
  string,
  string | number | boolean | null
>;

/**
 * Strip nested objects/arrays and drop forbidden keys so we never persist
 * resume body, JD text, answers, or other high-risk PII blobs.
 */
export function sanitizeAnalyticsProps(
  props: Record<string, unknown> | null | undefined
): AnalyticsProps | undefined {
  if (props == null) {
    return undefined;
  }

  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (forbiddenSet.has(key)) {
      continue;
    }
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      out[key] = null;
      continue;
    }
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") {
      out[key] = value as string | number | boolean;
      continue;
    }
    // Drop nested objects/arrays/buffers — ids and scalars only for MVP.
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export type TrackEventInput = {
  userId?: string | null;
  name: AnalyticsEventName | string;
  props?: Record<string, unknown> | null;
};

/**
 * Server-safe event logger. Persists AnalyticsEvent rows.
 * Never throws — analytics must not break product flows.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    const name = String(input.name ?? "").trim();
    if (!name) {
      return;
    }

    const props = sanitizeAnalyticsProps(input.props ?? undefined);
    const userId =
      typeof input.userId === "string" && input.userId.length > 0
        ? input.userId
        : null;

    await prisma.analyticsEvent.create({
      data: {
        userId,
        name,
        ...(props
          ? { props: props as Prisma.InputJsonValue }
          : {}),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] trackEvent failed", error);
    }
  }
}
