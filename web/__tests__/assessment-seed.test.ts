import { describe, expect, it } from "vitest";

import {
  MIN_COUNTS,
  SEED_CATEGORIES,
  SEED_QUESTIONS,
  type SeedQuestion,
} from "@/lib/assessment/seed-data";
import { categorySlugSchema } from "@/lib/validation/assessment";

const REFLECTION_SLUG = "work_style";

function isReflection(q: SeedQuestion): boolean {
  return q.categorySlug === REFLECTION_SLUG || q.correctAnswer === null;
}

describe("assessment seed data", () => {
  it("includes every category slug with stable ids", () => {
    const slugs = SEED_CATEGORIES.map((c) => c.slug).sort();
    expect(slugs).toEqual(
      [
        "consulting_case",
        "logical",
        "numerical",
        "situational_judgment",
        "verbal",
        "work_style",
      ].sort()
    );
    for (const category of SEED_CATEGORIES) {
      expect(categorySlugSchema.safeParse(category.slug).success).toBe(true);
      expect(category.id.length).toBeGreaterThan(0);
      expect(category.name.length).toBeGreaterThan(0);
    }
  });

  it("meets minimum question counts per category", () => {
    for (const [slug, min] of Object.entries(MIN_COUNTS)) {
      const count = SEED_QUESTIONS.filter((q) => q.categorySlug === slug).length;
      expect(count, `${slug} count`).toBeGreaterThanOrEqual(min);
    }
  });

  it("gives every MCQ a correctAnswer key present in choices", () => {
    const mcqs = SEED_QUESTIONS.filter((q) => !isReflection(q));
    expect(mcqs.length).toBeGreaterThan(0);

    for (const q of mcqs) {
      expect(q.choices, q.id).toBeTruthy();
      expect(q.choices!.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.correctAnswer, q.id).toBeTruthy();
      const keys = q.choices!.map((c) => c.key);
      expect(keys, q.id).toContain(q.correctAnswer);
      expect(q.explanation, q.id).toBeTruthy();
      expect(String(q.explanation).length, q.id).toBeGreaterThan(0);
    }
  });

  it("gives reflection items null correctAnswer and no choices", () => {
    const reflections = SEED_QUESTIONS.filter(
      (q) => q.categorySlug === REFLECTION_SLUG
    );
    expect(reflections.length).toBeGreaterThanOrEqual(MIN_COUNTS.work_style);

    for (const q of reflections) {
      expect(q.correctAnswer, q.id).toBeNull();
      const emptyChoices =
        q.choices === null ||
        q.choices === undefined ||
        q.choices.length === 0;
      expect(emptyChoices, q.id).toBe(true);
    }
  });

  it("uses unique fixed question ids", () => {
    const ids = SEED_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
