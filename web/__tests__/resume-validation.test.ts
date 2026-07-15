import { describe, expect, it } from "vitest";
import {
  emptyParsedResume,
  parsedResumeSchema,
  sanitizeResumeFilename,
  validateResumeUpload,
} from "@/lib/validation/resume";

describe("validateResumeUpload", () => {
  it("accepts valid PDF uploads", () => {
    const result = validateResumeUpload({
      name: "cv.pdf",
      type: "application/pdf",
      size: 1024,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects unsupported mime types", () => {
    const result = validateResumeUpload({
      name: "cv.txt",
      type: "text/plain",
      size: 100,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("PDF and Word");
    }
  });

  it("rejects files over 5MB", () => {
    const result = validateResumeUpload({
      name: "cv.pdf",
      type: "application/pdf",
      size: 6 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("5MB");
    }
  });
});

describe("sanitizeResumeFilename", () => {
  it("strips unsafe characters and path segments", () => {
    expect(sanitizeResumeFilename("../../My Résumé (final).pdf")).toBe(
      "My_R_sum__(final).pdf"
    );
  });
});

describe("parsedResumeSchema", () => {
  it("accepts empty parsed resume defaults", () => {
    const parsed = emptyParsedResume();
    expect(parsedResumeSchema.safeParse(parsed).success).toBe(true);
    expect(parsed.skills).toEqual([]);
  });

  it("accepts populated structured data", () => {
    const result = parsedResumeSchema.safeParse({
      contact: { name: "Alex", email: "alex@example.com" },
      summary: "Builder",
      education: [{ institution: "Uni", degree: "BSc" }],
      experience: [{ company: "Co", title: "Eng" }],
      skills: ["Go"],
      projects: [{ name: "App" }],
      certifications: ["PMP"],
      languages: ["English"],
    });
    expect(result.success).toBe(true);
  });
});