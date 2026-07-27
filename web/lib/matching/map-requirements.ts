import { normalizeSkillName } from "@/lib/ontology/normalize";
import type { OntologySnapshot } from "@/lib/validation/ontology";
import type { JobRequirements } from "@/lib/validation/job-match";
import {
  assertSafeActionText,
  type MatchType,
  type RequirementImportance,
  type RequirementMatchDraft,
  requirementMatchDraftSchema,
} from "@/lib/validation/requirement-match";

type ExpandedRequirement = {
  key: string;
  text: string;
  importance: RequirementImportance;
};

function expandRequirements(requirements: JobRequirements): ExpandedRequirement[] {
  const rows: ExpandedRequirement[] = [];
  const push = (
    prefix: string,
    items: string[],
    importance: RequirementImportance,
  ) => {
    for (const raw of items) {
      const text = raw.trim();
      if (!text) continue;
      const key = `${prefix}:${normalizeSkillName(text)}`;
      if (rows.some((r) => r.key === key)) continue;
      rows.push({ key, text, importance });
    }
  };
  push("requiredSkills", requirements.requiredSkills, "required");
  push("preferredSkills", requirements.preferredSkills, "preferred");
  push("tools", requirements.tools, "preferred");
  push("keywords", requirements.keywords, "other");
  // Cap responsibilities to keep mapping material
  push(
    "responsibilities",
    requirements.responsibilities.slice(0, 8),
    "required",
  );
  return rows;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#.]/i)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hit = 0;
  for (const t of a) {
    if (b.has(t)) hit += 1;
  }
  return hit / Math.max(a.size, 1);
}

function evidenceCorpus(snapshot: OntologySnapshot): {
  trustedSkills: OntologySnapshot["skills"];
  allSkills: OntologySnapshot["skills"];
  trustedEvidence: OntologySnapshot["evidence"];
  allEvidence: OntologySnapshot["evidence"];
  readyStories: OntologySnapshot["stories"];
} {
  return {
    trustedSkills: snapshot.skills.filter((s) => s.verification === "confirmed"),
    allSkills: snapshot.skills.filter((s) => s.verification !== "archived"),
    trustedEvidence: snapshot.evidence.filter((e) => e.verification === "confirmed"),
    allEvidence: snapshot.evidence.filter((e) => e.verification !== "archived"),
    readyStories: snapshot.stories.filter(
      (s) => s.readiness === "ready" && s.verification === "confirmed",
    ),
  };
}

function classifyRequirement(
  req: ExpandedRequirement,
  corpus: ReturnType<typeof evidenceCorpus>,
): Omit<
  RequirementMatchDraft,
  "userId" | "jobDescriptionId" | "userReview" | "version"
> {
  const reqNorm = normalizeSkillName(req.text);
  const reqTokens = tokenize(req.text);

  const exactTrusted = corpus.trustedSkills.find(
    (s) => s.normalizedName === reqNorm || s.name.toLowerCase() === req.text.toLowerCase(),
  );
  if (exactTrusted) {
    return {
      requirementKey: req.key,
      requirementText: req.text,
      importance: req.importance,
      matchType: "strong",
      evidenceStrength: 90,
      confidence: Math.min(1, exactTrusted.confidence),
      explanation: `Confirmed skill “${exactTrusted.name}” matches this requirement.`,
      skillId: exactTrusted.id,
      evidenceId: null,
      starStoryId: null,
      safeAction: null,
    };
  }

  // Partial: token overlap against trusted evidence bodies
  let bestPartial: {
    score: number;
    evidenceId: string;
    title: string;
  } | null = null;
  for (const ev of corpus.trustedEvidence) {
    const body = [
      ev.title,
      ev.roleTitle,
      ev.responsibilities,
      ev.achievements,
      ev.metrics,
    ]
      .filter(Boolean)
      .join(" ");
    const score = overlapScore(reqTokens, tokenize(body));
    if (!bestPartial || score > bestPartial.score) {
      bestPartial = { score, evidenceId: ev.id, title: ev.title };
    }
  }

  if (bestPartial && bestPartial.score >= 0.35) {
    const strength = Math.round(40 + bestPartial.score * 50);
    return {
      requirementKey: req.key,
      requirementText: req.text,
      importance: req.importance,
      matchType: bestPartial.score >= 0.6 ? "partial" : "transferable",
      evidenceStrength: Math.min(85, strength),
      confidence: Math.min(0.85, bestPartial.score),
      explanation: `Partial overlap with confirmed evidence “${bestPartial.title}” (score ${bestPartial.score.toFixed(2)}).`,
      evidenceId: bestPartial.evidenceId,
      skillId: null,
      starStoryId: null,
      safeAction:
        "Review this evidence and confirm the mapping, or attach a stronger STAR story.",
    };
  }

  // Ready STAR story grounding
  for (const story of corpus.readyStories) {
    const body = [story.title, story.situation, story.task, story.action, story.result].join(
      " ",
    );
    const score = overlapScore(reqTokens, tokenize(body));
    if (score >= 0.3) {
      return {
        requirementKey: req.key,
        requirementText: req.text,
        importance: req.importance,
        matchType: "partial",
        evidenceStrength: Math.round(35 + score * 40),
        confidence: Math.min(0.8, score),
        explanation: `Ready STAR story “${story.title}” relates to this requirement.`,
        evidenceId: story.evidenceId ?? null,
        skillId: null,
        starStoryId: story.id,
        safeAction: "Confirm the STAR story mapping or refine the story with metrics.",
      };
    }
  }

  // Keyword-only: untrusted skill/evidence only (never elevates verification)
  const keywordSkill = corpus.allSkills.find(
    (s) =>
      s.verification !== "confirmed" &&
      (s.normalizedName === reqNorm || s.normalizedName.includes(reqNorm) || reqNorm.includes(s.normalizedName)),
  );
  if (keywordSkill) {
    return {
      requirementKey: req.key,
      requirementText: req.text,
      importance: req.importance,
      matchType: "keyword_only",
      evidenceStrength: 20,
      confidence: 0.35,
      explanation: `Only an unconfirmed/inferred skill “${keywordSkill.name}” mentions this — not trusted evidence.`,
      skillId: keywordSkill.id,
      evidenceId: null,
      starStoryId: null,
      safeAction:
        "Confirm this skill with real evidence or practice answering questions about it — do not invent experience.",
    };
  }

  const action =
    req.importance === "required"
      ? "Add confirmed career evidence or a STAR story for this required skill — do not invent experience."
      : "Optional: capture real evidence if you have it; otherwise deprioritize this preferred item.";

  return {
    requirementKey: req.key,
    requirementText: req.text,
    importance: req.importance,
    matchType: "gap",
    evidenceStrength: 0,
    confidence: 0.2,
    explanation: "No matching confirmed skill, evidence, or ready STAR story found.",
    evidenceId: null,
    skillId: null,
    starStoryId: null,
    safeAction: assertSafeActionText(action),
  };
}

/**
 * Deterministic requirement→evidence mapping.
 * Always emits userReview=suggested; never promotes inferred facts to confirmed.
 */
export function mapRequirementsToEvidence(
  jobDescriptionId: string,
  userId: string,
  requirements: JobRequirements,
  snapshot: OntologySnapshot,
): RequirementMatchDraft[] {
  const expanded = expandRequirements(requirements);
  const corpus = evidenceCorpus(snapshot);
  const drafts: RequirementMatchDraft[] = [];

  for (const req of expanded) {
    const classified = classifyRequirement(req, corpus);
    if (classified.safeAction) {
      classified.safeAction = assertSafeActionText(classified.safeAction);
    }
    const draft = requirementMatchDraftSchema.parse({
      ...classified,
      userId,
      jobDescriptionId,
      userReview: "suggested",
      version: 1,
    });
    drafts.push(draft);
  }
  return drafts;
}

/** High-priority gaps for interview generation (JOB-88). */
export function selectGapDrivenTargets<
  T extends Pick<
    RequirementMatchDraft,
    "matchType" | "importance" | "requirementText" | "requirementKey"
  >,
>(matches: T[]): T[] {
  return matches.filter(
    (m) =>
      (m.matchType === "gap" || m.matchType === "keyword_only" || m.matchType === "partial") &&
      (m.importance === "required" || m.importance === "preferred"),
  );
}

export function summarizeMatchTypes(
  matches: Pick<RequirementMatchDraft, "matchType">[],
): Record<MatchType, number> {
  const counts: Record<MatchType, number> = {
    strong: 0,
    partial: 0,
    keyword_only: 0,
    transferable: 0,
    gap: 0,
  };
  for (const m of matches) {
    counts[m.matchType] += 1;
  }
  return counts;
}
