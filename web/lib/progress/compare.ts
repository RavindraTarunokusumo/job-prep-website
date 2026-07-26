export type AttemptKind =
  | "resume_review"
  | "job_match"
  | "interview"
  | "assessment"
  | "report";

export type ProgressAttempt = {
  id: string;
  kind: AttemptKind;
  label: string;
  /** Primary score when available (prefer 0–100; assessments may use raw + maxScore). */
  score: number | null;
  maxScore?: number | null;
  completedAt: string;
  targetRole?: string | null;
  meta?: Record<string, unknown>;
};

export type CompareResult =
  | {
      compatible: true;
      delta: number | null;
      normalizedA: number | null;
      normalizedB: number | null;
      explanation: string;
    }
  | {
      compatible: false;
      reason: string;
    };

/** Normalize to 0–100 when possible. */
export function normalizeScore(
  score: number | null | undefined,
  maxScore?: number | null
): number | null {
  if (score == null || Number.isNaN(score)) return null;
  if (maxScore != null && maxScore > 0) {
    return Math.round((score / maxScore) * 100);
  }
  // Already 0–100 style scores from reviews/matches/interviews
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

export function compareAttempts(
  a: ProgressAttempt,
  b: ProgressAttempt
): CompareResult {
  if (a.kind !== b.kind) {
    return {
      compatible: false,
      reason: `Cannot compare ${a.kind} with ${b.kind}; kinds must match.`,
    };
  }

  // Assessments: require both to have comparable maxScore when present
  if (a.kind === "assessment") {
    const maxA = a.maxScore ?? null;
    const maxB = b.maxScore ?? null;
    if (maxA != null && maxB != null && maxA !== maxB) {
      return {
        compatible: false,
        reason:
          "Assessment attempts use different max scores and are not directly comparable.",
      };
    }
  }

  const normalizedA = normalizeScore(a.score, a.maxScore);
  const normalizedB = normalizeScore(b.score, b.maxScore);

  if (normalizedA == null || normalizedB == null) {
    return {
      compatible: true,
      delta: null,
      normalizedA,
      normalizedB,
      explanation:
        "One or both attempts lack a numeric score, so a delta cannot be computed.",
    };
  }

  const delta = normalizedB - normalizedA;
  const whenA = a.completedAt.slice(0, 10);
  const whenB = b.completedAt.slice(0, 10);
  let explanation: string;
  if (delta === 0) {
    explanation = `No change in score (${normalizedA}) between ${whenA} and ${whenB}.`;
  } else if (delta > 0) {
    explanation = `Score improved by ${delta} points (${normalizedA} → ${normalizedB}) from ${whenA} to ${whenB}.`;
  } else {
    explanation = `Score decreased by ${Math.abs(delta)} points (${normalizedA} → ${normalizedB}) from ${whenA} to ${whenB}.`;
  }

  return {
    compatible: true,
    delta,
    normalizedA,
    normalizedB,
    explanation,
  };
}

export type TrendOptions = {
  role?: string | null;
  from?: string | null;
  to?: string | null;
};

export type TrendResult = {
  insights: string[];
  partial: boolean;
};

function inRange(iso: string, from?: string | null, to?: string | null): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  if (from) {
    const f = Date.parse(from);
    if (!Number.isNaN(f) && t < f) return false;
  }
  if (to) {
    const end = Date.parse(to);
    if (!Number.isNaN(end) && t > end) return false;
  }
  return true;
}

/**
 * Build conservative trend insights. Never invent conclusions when data is thin.
 */
export function buildTrendInsights(
  attempts: ProgressAttempt[],
  options: TrendOptions = {}
): TrendResult {
  let filtered = attempts.filter((a) =>
    inRange(a.completedAt, options.from, options.to)
  );
  if (options.role?.trim()) {
    const role = options.role.trim().toLowerCase();
    filtered = filtered.filter(
      (a) => (a.targetRole ?? "").toLowerCase().includes(role)
    );
  }

  if (filtered.length === 0) {
    return {
      insights: [],
      partial: true,
    };
  }

  const insights: string[] = [];
  const byKind = new Map<AttemptKind, ProgressAttempt[]>();
  for (const a of filtered) {
    const list = byKind.get(a.kind) ?? [];
    list.push(a);
    byKind.set(a.kind, list);
  }

  for (const [kind, list] of byKind) {
    const scored = list
      .map((a) => ({
        a,
        n: normalizeScore(a.score, a.maxScore),
      }))
      .filter((x) => x.n != null) as { a: ProgressAttempt; n: number }[];

    if (scored.length < 2) {
      continue;
    }

    scored.sort(
      (x, y) =>
        Date.parse(x.a.completedAt) - Date.parse(y.a.completedAt)
    );
    const first = scored[0];
    const last = scored[scored.length - 1];
    const delta = last.n - first.n;
    if (delta > 0) {
      insights.push(
        `${kind}: improved ${delta} points over ${scored.length} scored attempts.`
      );
    } else if (delta < 0) {
      insights.push(
        `${kind}: declined ${Math.abs(delta)} points over ${scored.length} scored attempts.`
      );
    } else {
      insights.push(
        `${kind}: score held steady across ${scored.length} scored attempts.`
      );
    }
  }

  // Repeated low-score signal only when ≥3 scored of same kind end below 50
  for (const [kind, list] of byKind) {
    const lows = list.filter((a) => {
      const n = normalizeScore(a.score, a.maxScore);
      return n != null && n < 50;
    });
    if (lows.length >= 3) {
      insights.push(
        `${kind}: ${lows.length} attempts scored below 50 — consider focused practice.`
      );
    }
  }

  const partial = insights.length === 0;
  if (partial) {
    return {
      insights: [
        "Not enough comparable scored attempts yet to surface trends. Complete more reviews, interviews, or assessments.",
      ],
      partial: true,
    };
  }

  return { insights, partial: false };
}

export function sortAttemptsNewestFirst(
  attempts: ProgressAttempt[]
): ProgressAttempt[] {
  return [...attempts].sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)
  );
}
