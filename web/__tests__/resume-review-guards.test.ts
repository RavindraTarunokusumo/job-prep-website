import { describe, expect, it } from "vitest";
import { assertResumeHasContent } from "@/lib/resume/content";

describe("assertResumeHasContent", () => {
  it("rejects empty raw text and empty parsed data", () => {
    expect(() => assertResumeHasContent("", null)).toThrow(
      /no extractable text/i
    );
    expect(() => assertResumeHasContent("   ", undefined)).toThrow(
      /no extractable text/i
    );
    expect(() => assertResumeHasContent(null, null)).toThrow(
      /no extractable text/i
    );
  });

  it("rejects very short resume text", () => {
    expect(() => assertResumeHasContent("Too short", null)).toThrow(
      /too short/i
    );
  });

  it("accepts sufficient raw text", () => {
    const text =
      "Senior software engineer with eight years building distributed systems and leading cross-functional teams.";
    expect(assertResumeHasContent(text, null)).toBe(text);
  });

  it("falls back to parsed JSON when raw text is missing", () => {
    const parsed = {
      contact: { name: "Alex" },
      experience: [{ title: "Engineer", company: "Acme", bullets: ["Built APIs"] }],
    };
    const content = assertResumeHasContent(null, parsed);
    expect(content).toContain("Alex");
    expect(content).toContain("Engineer");
  });
});