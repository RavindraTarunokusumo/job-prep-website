"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { seedAssessments } from "@/lib/assessment/seed";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  choiceSchema,
  parseCategorySlug,
  type Choice,
  type QuestionPayload,
} from "@/lib/validation/assessment";

export type CategoryListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  disclaimerKind: string;
  questionCount: number;
};

export type AttemptQuestionView = QuestionPayload & {
  explanation: string | null;
  correctAnswer: string | null;
  existingAnswer: {
    selectedKey: string | null;
    freeText: string | null;
    isCorrect: boolean | null;
  } | null;
};

export type AttemptDetail = {
  id: string;
  status: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  score: number | null;
  maxScore: number | null;
  completedAt: string | null;
  questions: AttemptQuestionView[];
};

function parseChoices(raw: unknown): Choice[] | undefined {
  if (raw == null) {
    return undefined;
  }
  const parsed = z.array(choiceSchema).safeParse(raw);
  if (!parsed.success || parsed.data.length === 0) {
    return undefined;
  }
  return parsed.data;
}

function isReflectionQuestion(
  correctAnswer: string | null,
  choices: Choice[] | undefined
): boolean {
  return correctAnswer == null || choices == null || choices.length === 0;
}

async function loadCategories(): Promise<CategoryListItem[]> {
  const rows = await prisma.assessmentCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { questions: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    disclaimerKind: row.disclaimerKind,
    questionCount: row._count.questions,
  }));
}

/**
 * Read categories with question counts. If none exist, seed once so the UI
 * works without a separate CLI step. On seed failure, returns empty list.
 */
export async function listCategories(): Promise<{
  categories: CategoryListItem[];
  seeded: boolean;
  seedHint: string | null;
}> {
  await requireUser();

  let categories = await loadCategories();
  if (categories.length > 0) {
    return { categories, seeded: false, seedHint: null };
  }

  try {
    await seedAssessments(prisma);
    categories = await loadCategories();
    if (categories.length === 0) {
      return {
        categories: [],
        seeded: false,
        seedHint:
          "No assessment categories found. Run `npm run seed:assessments` from web/.",
      };
    }
    return { categories, seeded: true, seedHint: null };
  } catch {
    return {
      categories: [],
      seeded: false,
      seedHint:
        "No assessment categories found. Run `npm run seed:assessments` from web/.",
    };
  }
}

export async function startAttemptAction(
  categorySlug: string
): Promise<{ ok: true; attemptId: string } | { ok: false; error: string }> {
  const user = await requireUser();

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding before starting practice assessments.",
    };
  }

  let slug: string;
  try {
    slug = parseCategorySlug(categorySlug);
  } catch {
    return { ok: false, error: "Unknown assessment category." };
  }

  const category = await prisma.assessmentCategory.findUnique({
    where: { slug },
    include: { _count: { select: { questions: true } } },
  });

  if (!category) {
    return {
      ok: false,
      error: "Category not found. Seed assessments or pick another category.",
    };
  }

  if (category._count.questions === 0) {
    return {
      ok: false,
      error: "This category has no questions yet.",
    };
  }

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      userId: user.id,
      categoryId: category.id,
      status: "in_progress",
    },
  });

  revalidatePath("/assessments");
  return { ok: true, attemptId: attempt.id };
}

export async function submitAnswerAction(
  attemptId: string,
  questionId: string,
  selectedKey?: string,
  freeText?: string
): Promise<
  | {
      ok: true;
      isCorrect: boolean | null;
      explanation: string | null;
    }
  | { ok: false; error: string }
> {
  const user = await requireUser();

  if (!attemptId?.trim() || !questionId?.trim()) {
    return { ok: false, error: "Attempt and question are required." };
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId: user.id },
  });

  if (!attempt) {
    return { ok: false, error: "Attempt not found." };
  }

  if (attempt.status !== "in_progress") {
    return { ok: false, error: "This attempt is already completed." };
  }

  const question = await prisma.assessmentQuestion.findFirst({
    where: { id: questionId, categoryId: attempt.categoryId },
  });

  if (!question) {
    return { ok: false, error: "Question not found for this attempt." };
  }

  const existing = await prisma.assessmentAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId: question.id,
      },
    },
  });
  if (existing) {
    return {
      ok: false,
      error: "This question was already answered. Answers cannot be changed.",
    };
  }

  const choices = parseChoices(question.choices);
  const reflection = isReflectionQuestion(question.correctAnswer, choices);

  let isCorrect: boolean | null = null;
  let selected: string | null = null;
  let free: string | null = null;

  if (reflection) {
    free = freeText?.trim() || null;
    if (!free) {
      return { ok: false, error: "Write a short reflection before submitting." };
    }
    isCorrect = null;
  } else {
    selected = selectedKey?.trim() || null;
    if (!selected) {
      return { ok: false, error: "Select an answer before submitting." };
    }
    const keys = choices?.map((c) => c.key) ?? [];
    if (!keys.includes(selected)) {
      return { ok: false, error: "Invalid answer choice." };
    }
    isCorrect = selected === question.correctAnswer;
  }

  try {
    await prisma.assessmentAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        selectedKey: selected,
        freeText: free,
        isCorrect,
      },
    });
  } catch {
    return {
      ok: false,
      error: "This question was already answered. Answers cannot be changed.",
    };
  }

  revalidatePath("/assessments");
  return {
    ok: true,
    isCorrect,
    explanation: question.explanation,
  };
}

/**
 * Mark attempt completed. Simple MCQ scoring loop (T4 may expand summary).
 */
export async function completeAttemptAction(
  attemptId: string
): Promise<
  | {
      ok: true;
      score: number;
      maxScore: number;
      percent: number | null;
    }
  | { ok: false; error: string }
> {
  const user = await requireUser();

  if (!attemptId?.trim()) {
    return { ok: false, error: "Attempt is required." };
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId: user.id },
    include: {
      answers: true,
    },
  });

  if (!attempt) {
    return { ok: false, error: "Attempt not found." };
  }

  if (attempt.status === "completed") {
    const score = attempt.score ?? 0;
    const maxScore = attempt.maxScore ?? 0;
    return {
      ok: true,
      score,
      maxScore,
      percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
    };
  }

  const questions = await prisma.assessmentQuestion.findMany({
    where: { categoryId: attempt.categoryId },
    select: { id: true, correctAnswer: true, choices: true },
  });
  const answerByQuestion = new Map(
    attempt.answers.map((a) => [a.questionId, a])
  );

  let score = 0;
  let maxScore = 0;

  for (const question of questions) {
    const choices = parseChoices(question.choices);
    if (isReflectionQuestion(question.correctAnswer, choices)) {
      continue;
    }
    maxScore += 1;
    const answer = answerByQuestion.get(question.id);
    if (answer?.isCorrect === true) {
      score += 1;
    }
  }

  await prisma.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "completed",
      score,
      maxScore,
      completedAt: new Date(),
    },
  });

  revalidatePath("/assessments");

  return {
    ok: true,
    score,
    maxScore,
    percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
  };
}

/** Load an owned attempt with questions and existing answers for the UI. */
export async function getAttemptAction(
  attemptId: string
): Promise<{ ok: true; attempt: AttemptDetail } | { ok: false; error: string }> {
  const user = await requireUser();

  if (!attemptId?.trim()) {
    return { ok: false, error: "Attempt is required." };
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId: user.id },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      answers: true,
    },
  });

  if (!attempt) {
    return { ok: false, error: "Attempt not found." };
  }

  const questions = await prisma.assessmentQuestion.findMany({
    where: { categoryId: attempt.categoryId },
    orderBy: { sortOrder: "asc" },
  });

  const answerByQuestion = new Map(
    attempt.answers.map((a) => [a.questionId, a])
  );

  const questionViews: AttemptQuestionView[] = questions.map((q) => {
    const choices = parseChoices(q.choices);
    const reflection = isReflectionQuestion(q.correctAnswer, choices);
    const existing = answerByQuestion.get(q.id);
    const answered = existing != null;

    return {
      id: q.id,
      prompt: q.prompt,
      choices,
      difficulty:
        q.difficulty === "easy" ||
        q.difficulty === "medium" ||
        q.difficulty === "hard"
          ? q.difficulty
          : undefined,
      isReflection: reflection,
      // Hide explanation + correct key until answered (prevents cheating via payload)
      explanation: answered ? q.explanation : null,
      correctAnswer: answered ? q.correctAnswer : null,
      existingAnswer: existing
        ? {
            selectedKey: existing.selectedKey,
            freeText: existing.freeText,
            isCorrect: existing.isCorrect,
          }
        : null,
    };
  });

  return {
    ok: true,
    attempt: {
      id: attempt.id,
      status: attempt.status,
      categoryId: attempt.categoryId,
      categorySlug: attempt.category.slug,
      categoryName: attempt.category.name,
      score: attempt.score,
      maxScore: attempt.maxScore,
      completedAt: attempt.completedAt?.toISOString() ?? null,
      questions: questionViews,
    },
  };
}
