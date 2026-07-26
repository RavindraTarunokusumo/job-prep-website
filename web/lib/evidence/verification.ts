import type {
  EvidenceVerification,
  StarReadiness,
} from "@/lib/validation/evidence";
import {
  evidenceVerifications,
  starReadinessValues,
} from "@/lib/validation/evidence";

const ALLOWED: Record<EvidenceVerification, EvidenceVerification[]> = {
  imported: ["unconfirmed", "confirmed", "archived"],
  inferred: ["unconfirmed", "confirmed", "archived"],
  unconfirmed: ["confirmed", "archived", "imported", "inferred"],
  confirmed: ["unconfirmed", "archived"],
  archived: ["unconfirmed", "confirmed"],
};

export function isEvidenceVerification(
  value: string
): value is EvidenceVerification {
  return (evidenceVerifications as readonly string[]).includes(value);
}

export function isStarReadiness(value: string): value is StarReadiness {
  return (starReadinessValues as readonly string[]).includes(value);
}

export function canTransitionVerification(
  from: EvidenceVerification,
  to: EvidenceVerification
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function transitionVerification(
  from: string,
  to: string
):
  | { ok: true; from: EvidenceVerification; to: EvidenceVerification }
  | { ok: false; error: string } {
  if (!isEvidenceVerification(from)) {
    return { ok: false, error: `Unknown verification state: ${from}` };
  }
  if (!isEvidenceVerification(to)) {
    return { ok: false, error: `Unknown target verification: ${to}` };
  }
  if (!canTransitionVerification(from, to)) {
    return {
      ok: false,
      error: `Cannot change verification from ${from} to ${to}`,
    };
  }
  return { ok: true, from, to };
}

export function canConfirmEvidence(verification: string): boolean {
  return (
    isEvidenceVerification(verification) &&
    verification !== "confirmed" &&
    verification !== "archived" &&
    canTransitionVerification(verification, "confirmed")
  );
}

export type EvidenceLike = {
  id: string;
  verification: string;
  title: string;
  responsibilities?: string | null;
  achievements?: string | null;
  metrics?: string | null;
  organization?: string | null;
  roleTitle?: string | null;
};

/**
 * STAR construction from evidence is only allowed when the evidence is user-confirmed.
 * Does not invent metrics or achievements — only returns what is already present.
 */
export function assertStarFromConfirmedEvidence(evidence: EvidenceLike): {
  ok: true;
  seed: {
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  };
} | { ok: false; error: string } {
  if (evidence.verification !== "confirmed") {
    return {
      ok: false,
      error:
        "Only confirmed career evidence can seed a STAR story. Confirm the facts first.",
    };
  }

  const org = evidence.organization?.trim() || "this organization";
  const role = evidence.roleTitle?.trim() || "my role";
  const responsibilities = evidence.responsibilities?.trim() || "";
  const achievements = evidence.achievements?.trim() || "";
  const metrics = evidence.metrics?.trim() || "";

  // Seed only from existing user-provided text — empty strings stay empty
  // rather than inventing outcomes, metrics, or filler prompts.
  const hasOrg = Boolean(evidence.organization?.trim());
  const hasRole = Boolean(evidence.roleTitle?.trim());
  let situation = "";
  if (hasRole || hasOrg) {
    situation = `While working as ${role} at ${org}.`;
  } else if (evidence.title.trim()) {
    // Context from the user-provided title only — no fabricated employers/roles.
    situation = evidence.title.trim();
  }

  return {
    ok: true,
    seed: {
      title: evidence.title,
      situation,
      task: responsibilities,
      action: achievements,
      result: [achievements, metrics].filter(Boolean).join(" ").trim(),
    },
  };
}

/**
 * Map a confirmed-evidence seed into STAR persist fields.
 * Never invents filler task/action/result copy — empty stays empty.
 * Callers that need DB non-null strings may pass empty strings through as-is.
 */
export function starPersistFieldsFromSeed(seed: {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}): {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  readiness: "draft";
} {
  return {
    title: seed.title,
    situation: seed.situation,
    task: seed.task,
    action: seed.action,
    result: seed.result,
    readiness: "draft",
  };
}

export function listConfirmedEvidence<T extends EvidenceLike>(items: T[]): T[] {
  return items.filter((i) => i.verification === "confirmed");
}

export function listReadyStars<T extends { readiness: string }>(items: T[]): T[] {
  return items.filter((i) => i.readiness === "ready");
}

export function isReadyForPrep(readiness: string): boolean {
  return readiness === "ready";
}
