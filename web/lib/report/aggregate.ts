import type { InterviewFeedback } from "@/lib/validation/interview";
import type { JobMatchResult } from "@/lib/validation/job-match";
import {
  performanceReportSectionsSchema,
  type PerformanceReportSections,
  type ReportSection,
} from "@/lib/validation/performance-report";
import type { ResumeReviewResult } from "@/lib/validation/resume-review";

export type GatheredProfile = {
  targetRole: string;
  targetIndustry: string;
  experienceLevel: string;
  jobSearchStatus: string;
  skills: string[];
  certifications: string[];
  preferredLocation?: string | null;
  educationBackground?: string | null;
};

export type GatheredResumeReview = {
  id: string;
  overallScore: number | null;
  result: ResumeReviewResult | null;
};

export type GatheredJobMatch = {
  id: string;
  matchScore: number | null;
  result: JobMatchResult | null;
};

export type GatheredInterviewTurnFeedback = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
};

export type GatheredInterview = {
  id: string;
  title: string | null;
  targetRole: string;
  turnFeedbacks: GatheredInterviewTurnFeedback[];
};

export type GatheredAssessment = {
  id: string;
  categoryName: string;
  score: number | null;
  maxScore: number | null;
};

export type GatheredPrepPlanItem = {
  title: string;
  status: string;
  category: string;
  priority: number;
};

export type GatheredPrepPlan = {
  id: string;
  title: string;
  summary: string | null;
  items: GatheredPrepPlanItem[];
};

/** Pure input for deterministic report aggregation. */
export type GatheredSources = {
  profile: GatheredProfile | null;
  resumeReview: GatheredResumeReview | null;
  jobMatch: GatheredJobMatch | null;
  interview: GatheredInterview | null;
  assessments: GatheredAssessment[];
  prepPlan: GatheredPrepPlan | null;
};

const EXPERIENCE_LABELS: Record<string, string> = {
  student: "Student",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  career_switch: "Career switcher",
};

const SEARCH_LABELS: Record<string, string> = {
  exploring: "Exploring options",
  actively_applying: "Actively applying",
  interviewing: "Interviewing",
  not_looking: "Not looking right now",
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function takeStrings(items: string[], max = 6): string[] {
  return items
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, max);
}

function profileSection(profile: GatheredProfile | null): ReportSection {
  if (!profile) {
    return {
      key: "profile",
      title: "Profile",
      available: false,
      score: null,
      bullets: [],
      evidence: [],
      emptyHint: "Complete onboarding to set your target role and background.",
      href: "/onboarding",
    };
  }

  const exp =
    EXPERIENCE_LABELS[profile.experienceLevel] ?? profile.experienceLevel;
  const search =
    SEARCH_LABELS[profile.jobSearchStatus] ?? profile.jobSearchStatus;
  const bullets = takeStrings([
    `Target role: ${profile.targetRole}`,
    `Industry: ${profile.targetIndustry}`,
    `Experience: ${exp}`,
    `Search status: ${search}`,
    profile.preferredLocation
      ? `Preferred location: ${profile.preferredLocation}`
      : "",
    profile.skills.length > 0
      ? `Skills highlighted: ${profile.skills.slice(0, 8).join(", ")}`
      : "",
    profile.certifications.length > 0
      ? `Certifications: ${profile.certifications.slice(0, 6).join(", ")}`
      : "",
  ]);

  return {
    key: "profile",
    title: "Profile",
    available: true,
    score: null,
    summary: `Preparing for ${profile.targetRole} in ${profile.targetIndustry}.`,
    bullets,
    evidence: takeStrings([
      "Source: career onboarding profile",
      profile.educationBackground
        ? `Education: ${profile.educationBackground}`
        : "",
    ]),
    href: "/dashboard",
  };
}

function applicationReadinessSection(
  review: GatheredResumeReview | null
): ReportSection {
  if (!review) {
    return {
      key: "application_readiness",
      title: "Application readiness",
      available: false,
      score: null,
      bullets: [],
      evidence: [],
      emptyHint: "No resume review yet — run the CV checker to get a readiness score.",
      href: "/resume/check",
    };
  }

  const result = review.result;
  const score =
    review.overallScore ?? result?.overallScore ?? null;
  const bullets = takeStrings([
    ...(result?.strengths ?? []).map((s) => `Strength: ${s}`),
    ...(result?.weaknesses ?? []).map((w) => `Gap: ${w}`),
    ...(result?.priorityActions ?? [])
      .slice(0, 4)
      .map((a) => `Priority: ${a.title}`),
  ]);
  const evidence = takeStrings([
    score != null ? `Resume review overall score: ${score}/100` : "",
    ...(result?.atsRisks ?? []).slice(0, 3).map((r) => `ATS risk: ${r}`),
    ...(result?.missingMetrics ?? [])
      .slice(0, 3)
      .map((m) => `Missing metric: ${m}`),
  ]);

  return {
    key: "application_readiness",
    title: "Application readiness",
    available: true,
    score: score != null ? clampScore(score) : null,
    summary:
      result?.summary ??
      (score != null
        ? `Latest CV review scored ${score}/100 (coaching signal only).`
        : "Latest CV review is available."),
    bullets,
    evidence,
    href: "/resume/check",
  };
}

function jobFitSection(match: GatheredJobMatch | null): ReportSection {
  if (!match) {
    return {
      key: "job_fit",
      title: "Job fit",
      available: false,
      score: null,
      bullets: [],
      evidence: [],
      emptyHint: "No job match yet — paste a job description to analyze fit.",
      href: "/jobs/match",
    };
  }

  const result = match.result;
  const score = match.matchScore ?? result?.matchScore ?? null;
  const bullets = takeStrings([
    ...(result?.matched ?? [])
      .slice(0, 4)
      .map((m) => `Matched: ${m.item}`),
    ...(result?.missing ?? [])
      .slice(0, 4)
      .map((m) => `Missing (${m.importance}): ${m.item}`),
    ...(result?.nextActions ?? [])
      .slice(0, 3)
      .map((a) => `Next: ${a.title}`),
  ]);
  const evidence = takeStrings([
    score != null
      ? `Job match score: ${score}/100 (fit signal only — coaching guidance)`
      : "",
    ...(result?.keywordGaps ?? []).slice(0, 4).map((k) => `Keyword gap: ${k}`),
    ...(result?.gaps ?? []).slice(0, 3).map((g) => `Gap: ${g}`),
  ]);

  return {
    key: "job_fit",
    title: "Job fit",
    available: true,
    score: score != null ? clampScore(score) : null,
    summary:
      result?.summary ??
      (score != null
        ? `Latest job-description match scored ${score}/100 as a rough fit signal.`
        : "Latest job match analysis is available."),
    bullets,
    evidence,
    href: "/jobs/match",
  };
}

function interviewSection(interview: GatheredInterview | null): ReportSection {
  if (!interview || interview.turnFeedbacks.length === 0) {
    return {
      key: "interview",
      title: "Interview practice",
      available: false,
      score: null,
      bullets: [],
      evidence: [],
      emptyHint:
        "No completed mock interview with feedback yet — practice at the interview page.",
      href: "/interview",
    };
  }

  const scores = interview.turnFeedbacks.map((f) => f.overallScore);
  const avg = clampScore(
    scores.reduce((sum, s) => sum + s, 0) / scores.length
  );
  const strengths = takeStrings(
    interview.turnFeedbacks.flatMap((f) => f.strengths),
    6
  );
  const improvements = takeStrings(
    interview.turnFeedbacks.flatMap((f) => f.improvements),
    6
  );

  return {
    key: "interview",
    title: "Interview practice",
    available: true,
    score: avg,
    summary: `Mock interview for ${interview.targetRole}${
      interview.title ? ` (“${interview.title}”)` : ""
    }: average coaching score ${avg}/100 across ${scores.length} scored answer${
      scores.length === 1 ? "" : "s"
    }.`,
    bullets: takeStrings([
      ...strengths.map((s) => `Strength: ${s}`),
      ...improvements.map((i) => `Improve: ${i}`),
    ]),
    evidence: takeStrings([
      `Session id: ${interview.id}`,
      `Scored turns: ${scores.length}`,
      `Turn scores: ${scores.join(", ")}`,
    ]),
    href: "/interview",
  };
}

function assessmentsSection(
  assessments: GatheredAssessment[]
): ReportSection {
  if (assessments.length === 0) {
    return {
      key: "assessments",
      title: "Assessments",
      available: false,
      score: null,
      bullets: [],
      evidence: [],
      emptyHint:
        "No completed practice assessments yet — try a category on the assessments page.",
      href: "/assessments",
    };
  }

  const withScores = assessments.filter(
    (a) => a.score != null && a.maxScore != null && a.maxScore > 0
  );
  const pctScores = withScores.map((a) =>
    clampScore(((a.score as number) / (a.maxScore as number)) * 100)
  );
  const avg =
    pctScores.length > 0
      ? clampScore(pctScores.reduce((s, n) => s + n, 0) / pctScores.length)
      : null;

  const bullets = takeStrings(
    assessments.map((a) => {
      if (a.score != null && a.maxScore != null) {
        return `${a.categoryName}: ${a.score}/${a.maxScore}`;
      }
      return `${a.categoryName}: completed (practice only)`;
    }),
    8
  );

  return {
    key: "assessments",
    title: "Assessments",
    available: true,
    score: avg,
    summary:
      avg != null
        ? `Practice assessment average ${avg}/100 across ${assessments.length} completed run${
            assessments.length === 1 ? "" : "s"
          } (learning only, not employment screening).`
        : `${assessments.length} completed practice assessment${
            assessments.length === 1 ? "" : "s"
          } (learning only).`,
    bullets,
    evidence: takeStrings(
      assessments.map((a) => `Attempt ${a.id} · ${a.categoryName}`),
      8
    ),
    href: "/assessments",
  };
}

function prepPlanSection(plan: GatheredPrepPlan | null): ReportSection {
  if (!plan) {
    return {
      key: "prep_plan",
      title: "Prep plan",
      available: false,
      score: null,
      bullets: [],
      evidence: [],
      emptyHint: "No active prep plan yet — generate one on the plan page.",
      href: "/plan",
    };
  }

  const total = plan.items.length;
  const done = plan.items.filter((i) => i.status === "done").length;
  const score = total > 0 ? clampScore((done / total) * 100) : null;
  const openItems = plan.items
    .filter((i) => i.status === "todo")
    .sort((a, b) => a.priority - b.priority);

  return {
    key: "prep_plan",
    title: "Prep plan",
    available: true,
    score,
    summary:
      plan.summary ??
      (total > 0
        ? `Active plan “${plan.title}”: ${done}/${total} items done.`
        : `Active plan “${plan.title}” has no checklist items yet.`),
    bullets: takeStrings(
      openItems.map(
        (i) => `[${i.category}] ${i.title}${i.status !== "todo" ? ` (${i.status})` : ""}`
      ),
      8
    ),
    evidence: takeStrings([
      `Plan id: ${plan.id}`,
      total > 0 ? `Progress: ${done}/${total} done` : "No items",
      ...plan.items
        .filter((i) => i.status === "done")
        .slice(0, 3)
        .map((i) => `Done: ${i.title}`),
    ]),
    href: "/plan",
  };
}

function nextActionsSection(sources: GatheredSources): ReportSection {
  const actions: string[] = [];

  if (!sources.profile) {
    actions.push("Complete onboarding to set target role and profile.");
  }
  if (!sources.resumeReview) {
    actions.push("Upload a CV and run a resume review at /resume/check.");
  } else if (
    sources.resumeReview.result?.priorityActions?.length
  ) {
    for (const a of sources.resumeReview.result.priorityActions.slice(0, 2)) {
      actions.push(`CV: ${a.title}`);
    }
  }
  if (!sources.jobMatch) {
    actions.push("Paste a target job description at /jobs/match.");
  } else if (sources.jobMatch.result?.nextActions?.length) {
    for (const a of sources.jobMatch.result.nextActions.slice(0, 2)) {
      actions.push(`Job fit: ${a.title}`);
    }
  }
  if (!sources.interview || sources.interview.turnFeedbacks.length === 0) {
    actions.push("Complete a mock interview for coaching feedback at /interview.");
  } else {
    const improvements = sources.interview.turnFeedbacks.flatMap(
      (f) => f.improvements
    );
    for (const imp of takeStrings(improvements, 2)) {
      actions.push(`Interview: ${imp}`);
    }
  }
  if (sources.assessments.length === 0) {
    actions.push("Try a practice assessment at /assessments.");
  }
  if (!sources.prepPlan) {
    actions.push("Generate a personalized prep plan at /plan.");
  } else {
    const todos = sources.prepPlan.items
      .filter((i) => i.status === "todo")
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
    for (const item of todos) {
      actions.push(`Plan: ${item.title}`);
    }
  }

  const unique = takeStrings(actions, 10);
  if (unique.length === 0) {
    unique.push(
      "Keep practicing: refresh reviews after CV updates and re-run a mock interview."
    );
  }

  return {
    key: "next_actions",
    title: "Next actions",
    available: true,
    score: null,
    summary:
      "Suggested next steps from your available evidence — coaching guidance only, not a hiring decision.",
    bullets: unique,
    evidence: takeStrings([
      sources.profile ? "Profile present" : "Profile missing",
      sources.resumeReview ? "Resume review present" : "Resume review missing",
      sources.jobMatch ? "Job match present" : "Job match missing",
      sources.interview?.turnFeedbacks.length
        ? "Interview feedback present"
        : "Interview feedback missing",
      sources.assessments.length > 0
        ? `${sources.assessments.length} assessment(s)`
        : "Assessments missing",
      sources.prepPlan ? "Prep plan present" : "Prep plan missing",
    ]),
    href: "/plan",
  };
}

/**
 * Build deterministic report sections from gathered product sources.
 * Pure function — no I/O. Always returns all section keys with graceful empties.
 */
export function aggregatePerformanceReportInput(
  input: GatheredSources
): PerformanceReportSections {
  const sections: ReportSection[] = [
    profileSection(input.profile),
    applicationReadinessSection(input.resumeReview),
    jobFitSection(input.jobMatch),
    interviewSection(input.interview),
    assessmentsSection(input.assessments),
    prepPlanSection(input.prepPlan),
    nextActionsSection(input),
  ];

  return performanceReportSectionsSchema.parse({ sections });
}

/**
 * Template overall summary when AI narrative is skipped or fails.
 */
export function buildDeterministicReportSummary(
  sections: PerformanceReportSections,
  profile: GatheredProfile | null
): { title: string; summary: string } {
  const available = sections.sections.filter((s) => s.available && s.key !== "next_actions");
  const scored = available.filter((s) => s.score != null);
  const role = profile?.targetRole ?? "your target role";

  const title =
    available.length === 0
      ? "Readiness report (getting started)"
      : `Readiness report — ${role}`;

  if (available.length === 0) {
    return {
      title,
      summary:
        "No workflow results yet. Complete onboarding, run a resume review, paste a job description, practice an interview, and generate a prep plan — then regenerate this report for a fuller coaching snapshot.",
    };
  }

  const scoreBits = scored
    .map((s) => `${s.title}: ${s.score}/100`)
    .slice(0, 5);
  const missing = sections.sections
    .filter((s) => !s.available && s.key !== "next_actions")
    .map((s) => s.title);

  const parts = [
    `Coaching snapshot for ${role} based on ${available.length} available source${
      available.length === 1 ? "" : "s"
    }.`,
  ];
  if (scoreBits.length > 0) {
    parts.push(`Signals — ${scoreBits.join("; ")}.`);
  }
  if (missing.length > 0) {
    parts.push(`Still missing: ${missing.join(", ")}.`);
  }
  parts.push(
    "These are preparation signals only, not a hire or no-hire prediction."
  );

  return { title, summary: parts.join(" ") };
}

/** Map stored interview feedback JSON into aggregator turn shape. */
export function interviewFeedbackToGathered(
  feedback: InterviewFeedback
): GatheredInterviewTurnFeedback {
  return {
    overallScore: feedback.overallScore,
    strengths: feedback.strengths,
    improvements: feedback.improvements,
  };
}
