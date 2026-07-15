import { describe, expect, it } from "vitest";
import { parseResumeStructure } from "@/lib/resume/parse-structure";

const SAMPLE_RESUME = `Jane Doe
jane.doe@example.com | +1 555-010-2000 | London, UK

SUMMARY
Product-minded engineer with 5 years building B2B SaaS platforms.

EXPERIENCE
Senior Software Engineer | Acme Corp | Remote
2021 – Present
- Led API redesign improving latency by 40%
- Mentored three junior engineers

Software Engineer | Beta Ltd
2019 – 2021
Built billing integrations and observability dashboards.

EDUCATION
B.S. Computer Science — State University
2015 – 2019

SKILLS
TypeScript, React, PostgreSQL, system design

PROJECTS
Open Prep Tracker
Side project helping job seekers track applications.

CERTIFICATIONS
AWS Solutions Architect Associate

LANGUAGES
English, Spanish
`;

describe("parseResumeStructure", () => {
  it("extracts contact info from header", () => {
    const parsed = parseResumeStructure(SAMPLE_RESUME);
    expect(parsed.contact.name).toBe("Jane Doe");
    expect(parsed.contact.email).toBe("jane.doe@example.com");
    expect(parsed.contact.phone).toContain("555");
    expect(parsed.contact.location).toBe("London, UK");
  });

  it("parses summary and skills sections", () => {
    const parsed = parseResumeStructure(SAMPLE_RESUME);
    expect(parsed.summary).toContain("Product-minded engineer");
    expect(parsed.skills).toEqual(
      expect.arrayContaining(["TypeScript", "React", "PostgreSQL", "system design"])
    );
  });

  it("parses experience entries with titles and companies", () => {
    const parsed = parseResumeStructure(SAMPLE_RESUME);
    expect(parsed.experience.length).toBeGreaterThanOrEqual(2);
    expect(parsed.experience[0]?.title).toContain("Senior Software Engineer");
    expect(parsed.experience[0]?.company).toBe("Acme Corp");
  });

  it("parses education, certifications, and languages", () => {
    const parsed = parseResumeStructure(SAMPLE_RESUME);
    expect(parsed.education[0]?.degree).toContain("B.S. Computer Science");
    expect(parsed.certifications).toContain("AWS Solutions Architect Associate");
    expect(parsed.languages).toEqual(
      expect.arrayContaining(["English", "Spanish"])
    );
  });

  it("returns empty structure for blank text", () => {
    const parsed = parseResumeStructure("   \n\n  ");
    expect(parsed.skills).toEqual([]);
    expect(parsed.experience).toEqual([]);
    expect(parsed.education).toEqual([]);
  });
});