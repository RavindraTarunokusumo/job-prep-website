import { describe, expect, it } from "vitest";
import {
  assertJobDescriptionHasContent,
  jobMatchResultSchema,
  jobRequirementsSchema,
  parseJobMatchResult,
  parseJobRequirements,
} from "@/lib/validation/job-match";

const validRequirements = {
  roleTitle: "Backend Engineer",
  company: "Acme Corp",
  requiredSkills: ["TypeScript", "PostgreSQL"],
  preferredSkills: ["Kubernetes"],
  responsibilities: ["Build APIs", "Own database schema"],
  experienceLevel: "mid",
  keywords: ["REST", "microservices"],
  tools: ["Docker", "Git"],
  certifications: [],
  interviewTopics: ["system design", "SQL"],
  inferredNotes: ["Remote-friendly implied but not explicit"],
};

const validMatchResult = {
  matchScore: 68,
  matched: [
    { item: "TypeScript", evidence: "Listed in skills section" },
    { item: "PostgreSQL", evidence: "Used in recent role" },
  ],
  missing: [
    {
      item: "Kubernetes",
      importance: "preferred" as const,
      suggestion: "Highlight any container orchestration experience",
    },
  ],
  keywordGaps: ["microservices"],
  strengths: ["Strong backend experience"],
  gaps: ["Limited cloud-native tooling"],
  nextActions: [
    {
      title: "Add Kubernetes exposure",
      detail: "Mention any Docker/K8s coursework or side projects.",
      priority: 1,
    },
  ],
  summary: "Good backend fit; strengthen cloud-native keywords.",
};

describe("jobRequirementsSchema", () => {
  it("accepts a valid fixture", () => {
    const result = jobRequirementsSchema.safeParse(validRequirements);
    expect(result.success).toBe(true);
    expect(parseJobRequirements(validRequirements)).toEqual(validRequirements);
  });

  it("rejects missing requiredSkills array", () => {
    const invalid = { ...validRequirements };
    delete (invalid as { requiredSkills?: string[] }).requiredSkills;
    expect(jobRequirementsSchema.safeParse(invalid).success).toBe(false);
    expect(() => parseJobRequirements(invalid)).toThrow();
  });
});

describe("jobMatchResultSchema", () => {
  it("accepts a valid fixture", () => {
    const result = jobMatchResultSchema.safeParse(validMatchResult);
    expect(result.success).toBe(true);
    expect(parseJobMatchResult(validMatchResult)).toEqual(validMatchResult);
  });

  it("rejects out-of-range matchScore", () => {
    const invalid = { ...validMatchResult, matchScore: 150 };
    expect(jobMatchResultSchema.safeParse(invalid).success).toBe(false);
    expect(() => parseJobMatchResult(invalid)).toThrow();
  });

  it("rejects invalid missing importance", () => {
    const invalid = {
      ...validMatchResult,
      missing: [{ item: "Go", importance: "critical" }],
    };
    expect(jobMatchResultSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("assertJobDescriptionHasContent", () => {
  it("accepts text at or above minimum length", () => {
    const text = "a".repeat(80);
    expect(assertJobDescriptionHasContent(text)).toBe(text);
  });

  it("rejects empty text", () => {
    expect(() => assertJobDescriptionHasContent("   ")).toThrow(
      /paste a job description/i
    );
  });

  it("rejects text below minimum length", () => {
    expect(() => assertJobDescriptionHasContent("short jd")).toThrow(
      /too short/i
    );
  });
});