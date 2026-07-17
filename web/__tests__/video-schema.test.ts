import { describe, expect, it } from "vitest";

import {
  interviewVideoCreateSchema,
  parseInterviewVideoCreate,
  parseTagList,
  parseVideoFilters,
  videoCategoryTagSchema,
  videoFiltersSchema,
} from "@/lib/validation/video";

describe("videoCategoryTagSchema", () => {
  it("accepts known tags", () => {
    expect(videoCategoryTagSchema.safeParse("behavioral").success).toBe(true);
    expect(videoCategoryTagSchema.safeParse("technical").success).toBe(true);
    expect(videoCategoryTagSchema.safeParse("case").success).toBe(true);
  });

  it("rejects unknown tags", () => {
    expect(videoCategoryTagSchema.safeParse("ai-generated").success).toBe(
      false
    );
  });
});

describe("interviewVideoCreateSchema", () => {
  const valid = {
    title: "Behavioral STAR method",
    url: "https://www.youtube.com/watch?v=abc123",
    categoryTags: ["behavioral", "general"],
    targetRoles: ["Software Engineer"],
    targetIndustries: [],
    experienceLevels: ["entry"],
    summary: "Human-made overview",
    transcript: null,
    published: true,
    sortOrder: 0,
  };

  it("accepts a full create payload", () => {
    expect(interviewVideoCreateSchema.safeParse(valid).success).toBe(true);
    expect(parseInterviewVideoCreate(valid).title).toBe(valid.title);
  });

  it("requires at least one category tag and a valid url", () => {
    expect(
      interviewVideoCreateSchema.safeParse({
        ...valid,
        categoryTags: [],
      }).success
    ).toBe(false);
    expect(
      interviewVideoCreateSchema.safeParse({
        ...valid,
        url: "not-a-url",
      }).success
    ).toBe(false);
    expect(
      interviewVideoCreateSchema.safeParse({
        ...valid,
        title: "",
      }).success
    ).toBe(false);
  });

  it("defaults empty filter arrays and published", () => {
    const parsed = interviewVideoCreateSchema.parse({
      title: "General tips",
      url: "https://vimeo.com/123",
      categoryTags: ["general"],
    });
    expect(parsed.targetRoles).toEqual([]);
    expect(parsed.published).toBe(true);
    expect(parsed.sortOrder).toBe(0);
  });
});

describe("videoFiltersSchema", () => {
  it("accepts optional filter fields", () => {
    expect(
      videoFiltersSchema.safeParse({ category: "behavioral", q: "star" })
        .success
    ).toBe(true);
    expect(parseVideoFilters({}).category).toBeUndefined();
  });
});

describe("parseTagList", () => {
  it("splits, trims, and dedupes case-insensitively", () => {
    expect(parseTagList(" behavioral, Technical, behavioral ")).toEqual([
      "behavioral",
      "Technical",
    ]);
    expect(parseTagList("")).toEqual([]);
  });
});
