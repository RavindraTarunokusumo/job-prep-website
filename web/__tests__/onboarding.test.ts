import { describe, expect, it } from "vitest";
import {
  formInputToOnboarding,
  onboardingSchema,
  parseCommaSeparatedList,
} from "@/lib/validation/onboarding";

describe("parseCommaSeparatedList", () => {
  it("splits and trims comma-separated values", () => {
    expect(parseCommaSeparatedList(" Python, SQL , ,React ")).toEqual([
      "Python",
      "SQL",
      "React",
    ]);
  });

  it("returns empty array for blank input", () => {
    expect(parseCommaSeparatedList("  ,  , ")).toEqual([]);
  });
});

describe("onboardingSchema", () => {
  const valid = {
    educationBackground: "B.S. Computer Science",
    experienceLevel: "entry" as const,
    targetRole: "Software Engineer",
    targetIndustry: "SaaS",
    preferredLocation: "Remote",
    jobSearchStatus: "actively_applying" as const,
    careerSwitchIntent: false,
    skills: ["TypeScript"],
    certifications: [],
  };

  it("accepts valid onboarding data", () => {
    expect(onboardingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = onboardingSchema.safeParse({
      ...valid,
      targetRole: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    const result = onboardingSchema.safeParse({
      ...valid,
      experienceLevel: "intern",
    });
    expect(result.success).toBe(false);
  });
});

describe("formInputToOnboarding", () => {
  it("parses comma-separated skills and certifications from form input", () => {
    const parsed = formInputToOnboarding({
      educationBackground: "Bootcamp",
      experienceLevel: "career_switch",
      targetRole: "Product Manager",
      targetIndustry: "Healthcare",
      preferredLocation: "Berlin",
      jobSearchStatus: "exploring",
      careerSwitchIntent: true,
      skillsInput: "Roadmapping, SQL",
      certificationsInput: "PMP",
    });

    expect(parsed.skills).toEqual(["Roadmapping", "SQL"]);
    expect(parsed.certifications).toEqual(["PMP"]);
    expect(parsed.careerSwitchIntent).toBe(true);
  });
});