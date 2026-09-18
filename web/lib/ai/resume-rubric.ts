import {
  callJev,
  type JevFetch,
  type JevQuestion,
  type JevScoreAnswer,
  type JevUsage,
} from "@/lib/ai/jev";
import type { ResumeReviewSectionScore } from "@/lib/validation/resume-review";

/**
 * Calibrated rubric scoring for the numeric half of a resume review.
 *
 * Five independent ordinal judgments are asked against one shared state so the
 * vendor answers them in parallel. Weights and the ordinal -> 0-100 mapping are
 * product decisions and live here in code, never in the model output.
 */

export const RESUME_RUBRIC_LEVEL_COUNT = 5;

/**
 * Vendor cap is 32k tokens for `state`. CV text is prose-like, so ~3.5 chars per
 * token is a safe floor; 90k characters stays well under the cap even in the
 * worst case and leaves headroom for the five questions. Truncation is
 * head-biased: contact details, summary and the most recent roles carry the most
 * signal for every dimension, so the tail is the right thing to lose.
 */
const MAX_STATE_CHARS = 90_000;

export type ResumeRubricDimension = {
  id: string;
  /** Section label written into sectionScores[]. */
  section: string;
  weight: number;
  instructions: string;
  criteria: string[];
};

export const RESUME_RUBRIC_DIMENSIONS: ResumeRubricDimension[] = [
  {
    id: "impact_evidence",
    section: "Impact evidence & quantification",
    weight: 0.3,
    instructions:
      "Rate how well this CV evidences the candidate's impact through concrete, measured outcomes rather than listing responsibilities.",
    criteria: [
      "Bullets name only duties, tools and responsibilities; no outcome of any work is stated anywhere.",
      "A few bullets gesture at outcomes in vague terms such as 'improved performance' or 'helped increase sales', with no figures and no before-and-after.",
      "Some roles state a concrete outcome and carry an occasional figure, but most bullets remain duty statements and the figures lack a baseline or a timeframe.",
      "Most roles state outcomes and several carry specific figures with units (percentage, currency, volume, time saved), though the candidate's own contribution or the starting baseline is sometimes unclear.",
      "Nearly every bullet ties a specific action to a measured result with a figure, a unit and a timeframe, and makes clear what the candidate personally changed.",
    ],
  },
  {
    id: "ats_structure",
    section: "ATS structure & parseability",
    weight: 0.2,
    instructions:
      "Rate how cleanly an automated applicant tracking system could parse this CV text into sections, individual roles, date ranges and contact details.",
    criteria: [
      "The text is one run-on block with no recognisable headings, no date patterns and no separable contact details; role boundaries cannot be determined at all.",
      "Fragments of structure survive, but headings are missing or merged into body text, dates are absent or inconsistent, and collapsed multi-column layout has interleaved unrelated lines.",
      "Standard sections are mostly identifiable, but the text carries parser hazards such as table pipes, decorative glyphs, header/footer remnants, or dates written in more than one format.",
      "Conventional section headings, one role per block and consistent date ranges are present; minor hazards remain, such as an unusual heading name or stray symbols.",
      "Plain single-column text with conventional headings (Summary, Experience, Education, Skills), one clearly delimited role per block, consistent date ranges, and contact details on their own lines.",
    ],
  },
  {
    id: "role_relevance",
    section: "Role relevance",
    weight: 0.2,
    instructions:
      "Rate how coherently the experience, skills and vocabulary in this CV support one identifiable target role, judged from the CV alone.",
    criteria: [
      "No target role can be inferred, and the listed experience points in unrelated directions.",
      "A target role is stated or implied, but most of the experience and vocabulary belongs to a different field and little of it transfers to that role.",
      "The target role is identifiable and roughly half the content supports it; the remainder is unrelated filler that dilutes the pitch.",
      "Most roles, skills and vocabulary support the target role; one or two sections are off-target or too generic to help.",
      "Every section reinforces one clear target role: titles, responsibilities, tools and vocabulary all belong to that role's domain and match the seniority the CV claims.",
    ],
  },
  {
    id: "clarity_concision",
    section: "Clarity & concision",
    weight: 0.15,
    instructions:
      "Rate how readable and economical the writing is: whether a reviewer can grasp each role quickly without wading through filler.",
    criteria: [
      "Dense unbroken paragraphs, or text so fragmented that individual sentences cannot be followed.",
      "Long meandering bullets, heavy buzzword padding such as 'results-driven team player', and the same claims repeated across several roles.",
      "Understandable but wordy: many bullets run well past two lines, passive constructions are common, and some content is repeated.",
      "Mostly tight, active bullets of one or two lines with little repetition; a few sections remain padded or generic.",
      "Every bullet is a short, active, specific statement with no filler adjectives and no repetition; the whole document can be skimmed in under a minute.",
    ],
  },
  {
    id: "completeness",
    section: "Completeness",
    weight: 0.15,
    instructions:
      "Rate whether this CV contains the information a recruiter needs in order to assess the candidate and contact them.",
    criteria: [
      "Little more than a name: no contact route, no employment history, and no education or skills.",
      "One or two elements are present (for example an email address and a skills list), but employment history is missing or reduced to job titles with no employers and no dates.",
      "Employment history is present but has unexplained gaps, missing employers or missing dates, and either education or skills is absent entirely.",
      "Contact details, dated employment history with employers, education and skills are all present; one element is thin, such as a missing summary or an undated qualification.",
      "Contact details, a role-focused summary, complete dated employment history with employers, education and a relevant skills list are all present, with no unexplained gaps.",
    ],
  },
];

export type ResumeRubricDimensionResult = {
  id: string;
  section: string;
  weight: number;
  /** Raw probability-weighted ordinal from Jev, in [0, levelCount - 1]. */
  level: number;
  /** Deterministic 0-100 projection of `level`. */
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
  legend: Record<string, string>;
};

export type ResumeRubricResult = {
  overallScore: number;
  sectionScores: ResumeReviewSectionScore[];
  /**
   * Confidence has no home in resumeReviewSectionScoreSchema and open question 2
   * (whether to surface it to users) is undecided, so it is returned here rather
   * than folded into the user-facing `note`. Nothing is dropped and the existing
   * LLM path's schema is untouched.
   */
  dimensions: ResumeRubricDimensionResult[];
  usage: JevUsage;
  latencyMs: number;
};

/**
 * Ordinal -> 0-100. A Jev score for an N-level rubric ranges over [0, N-1] and
 * can land between levels, so the projection is a straight linear stretch of
 * that interval onto 0-100. Linear is deliberate: any curve would bake in a
 * calibration assumption before the corpus evaluation has produced evidence for
 * one. This is the single tuning point if the evaluation says the shape is wrong.
 */
export function mapOrdinalToPercent(
  level: number,
  levelCount: number = RESUME_RUBRIC_LEVEL_COUNT,
): number {
  if (levelCount < 2) {
    throw new Error("An ordinal rubric needs at least two levels.");
  }
  const clamped = Math.min(Math.max(level, 0), levelCount - 1);
  return Math.round((clamped / (levelCount - 1)) * 100);
}

/** Weighted sum of per-dimension 0-100 scores; weights are normalized. */
export function composeOverallScore(
  parts: Array<{ weight: number; score: number }>,
): number {
  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Rubric weights must sum to a positive number.");
  }
  const weighted = parts.reduce((sum, p) => sum + p.weight * p.score, 0);
  return Math.round(weighted / totalWeight);
}

export function buildResumeRubricQuestions(): Record<string, JevQuestion> {
  const questions: Record<string, JevQuestion> = {};
  for (const dimension of RESUME_RUBRIC_DIMENSIONS) {
    questions[dimension.id] = {
      type: "score",
      instructions: dimension.instructions,
      criteria: dimension.criteria,
    };
  }
  return questions;
}

export function buildRubricState(cvText: string): string {
  const trimmed = cvText.trim();
  if (trimmed.length <= MAX_STATE_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_STATE_CHARS)}\n[truncated: CV exceeds the scoring input budget]`;
}

function nearestLevelNote(answer: JevScoreAnswer): string | undefined {
  const index = Math.round(answer.score);
  return answer.legend[String(index)];
}

export async function scoreResumeRubric(
  cvText: string,
  opts: { userId?: string | null; fetchImpl?: JevFetch } = {},
): Promise<ResumeRubricResult> {
  const response = await callJev({
    state: buildRubricState(cvText),
    questions: buildResumeRubricQuestions(),
    userId: opts.userId,
    workflow: "resume_rubric",
    taskClass: "feedback",
    fetchImpl: opts.fetchImpl,
  });

  const dimensions: ResumeRubricDimensionResult[] = RESUME_RUBRIC_DIMENSIONS.map(
    (dimension) => {
      const answer = response.answers[dimension.id];
      if (!answer || answer.type !== "score") {
        throw new Error(
          `Jev returned no score answer for rubric dimension "${dimension.id}".`,
        );
      }
      return {
        id: dimension.id,
        section: dimension.section,
        weight: dimension.weight,
        level: answer.score,
        score: mapOrdinalToPercent(answer.score),
        confidence: answer.confidence,
        probabilities: answer.probabilities,
        legend: answer.legend,
      };
    },
  );

  const sectionScores: ResumeReviewSectionScore[] = dimensions.map(
    (dimension) => {
      const answer = response.answers[dimension.id] as JevScoreAnswer;
      const note = nearestLevelNote(answer);
      return note
        ? { section: dimension.section, score: dimension.score, note }
        : { section: dimension.section, score: dimension.score };
    },
  );

  return {
    overallScore: composeOverallScore(dimensions),
    sectionScores,
    dimensions,
    usage: response.usage,
    latencyMs: response.latencyMs,
  };
}
