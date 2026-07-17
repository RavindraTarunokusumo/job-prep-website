import { Prisma, type PrismaClient } from "@prisma/client";

import { SEED_CATEGORIES, SEED_QUESTIONS } from "./seed-data";

function choicesJson(
  choices: { key: string; label: string }[] | null
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (choices === null || choices.length === 0) {
    return Prisma.JsonNull;
  }
  return choices;
}

/**
 * Idempotent assessment content seed.
 * Upserts categories by unique slug (stable fixed ids on create)
 * and questions by fixed primary key id.
 */
export async function seedAssessments(prisma: PrismaClient): Promise<{
  categories: number;
  questions: number;
}> {
  for (const category of SEED_CATEGORIES) {
    await prisma.assessmentCategory.upsert({
      where: { slug: category.slug },
      create: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        disclaimerKind: category.disclaimerKind,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        disclaimerKind: category.disclaimerKind,
      },
    });
  }

  const categories = await prisma.assessmentCategory.findMany({
    where: { slug: { in: SEED_CATEGORIES.map((c) => c.slug) } },
    select: { id: true, slug: true },
  });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const question of SEED_QUESTIONS) {
    const categoryId = categoryIdBySlug.get(question.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Missing category for slug "${question.categorySlug}" while seeding question ${question.id}`
      );
    }

    const choices = choicesJson(question.choices);

    await prisma.assessmentQuestion.upsert({
      where: { id: question.id },
      create: {
        id: question.id,
        categoryId,
        prompt: question.prompt,
        choices,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        sortOrder: question.sortOrder,
      },
      update: {
        categoryId,
        prompt: question.prompt,
        choices,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        sortOrder: question.sortOrder,
      },
    });
  }

  return {
    categories: SEED_CATEGORIES.length,
    questions: SEED_QUESTIONS.length,
  };
}
