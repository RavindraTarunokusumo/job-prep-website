import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractDateRangeFromLine,
  parseResumeStructure,
} from "@/lib/resume/parse-structure";

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

function loadFixture(filename: string): string {
  return readFileSync(
    path.join(__dirname, "fixtures", "cvs", filename),
    "utf8"
  );
}

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
      expect.arrayContaining([
        "TypeScript",
        "React",
        "PostgreSQL",
        "system design",
      ])
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
    expect(parsed.certifications).toContain(
      "AWS Solutions Architect Associate"
    );
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

  it("extracts inline and standalone date ranges accurately", () => {
    expect(
      extractDateRangeFromLine(
        "Senior Backend Engineer | PT GoTo | Jan 2022 – Present"
      )
    ).toEqual({
      startDate: "Jan 2022",
      endDate: "Present",
      remainingLine: "Senior Backend Engineer | PT GoTo",
    });

    expect(extractDateRangeFromLine("Expected May 2026")).toEqual({
      endDate: "Expected May 2026",
      remainingLine: "",
    });
  });

  it("parses 01-chronological-swe.txt (categorized skills, parenthesized SQL, projects)", () => {
    const parsed = parseResumeStructure(loadFixture("01-chronological-swe.txt"));
    expect(parsed.contact.name).toBe("Jane Doe");
    expect(parsed.contact.email).toBe("jane.doe@example.com");
    expect(parsed.contact.location).toBe("London, UK");
    expect(parsed.contact.linkedin).toContain("linkedin.com/in/janedoe");
    expect(parsed.contact.website).toContain("github.com/janedoe");
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0]).toMatchObject({
      title: "Senior Software Engineer",
      company: "Acme Corp",
      location: "Remote",
      startDate: "Jan 2021",
      endDate: "Present",
    });
    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0]).toMatchObject({
      degree: "B.S. Computer Science",
      field: "Computer Science",
      institution: "State University",
      startDate: "2014",
      endDate: "2018",
    });
    expect(parsed.skills).toEqual(
      expect.arrayContaining([
        "TypeScript",
        "Python",
        "Go",
        "SQL (PostgreSQL, MySQL)",
        "Kubernetes",
      ])
    );
    expect(parsed.projects).toHaveLength(2);
    expect(parsed.projects[0]?.name).toBe("Open Prep Tracker");
    expect(parsed.projects[0]?.technologies).toEqual([
      "TypeScript",
      "Next.js",
      "Prisma",
    ]);
  });

  it("parses 02-tab-aligned-intl.txt (ALL-CAPS multi-token name, international phone/location, 3 roles, 2 degrees)", () => {
    const parsed = parseResumeStructure(loadFixture("02-tab-aligned-intl.txt"));
    expect(parsed.contact.name).toBe("Ravindra Aribowo Tarunokusumo");
    expect(parsed.contact.email).toBe("ravindra.aribowo@example.id");
    expect(parsed.contact.phone).toBe("+62 812-3456-7890");
    expect(parsed.contact.location).toBe("Jakarta, Indonesia");
    expect(parsed.experience).toHaveLength(3);
    expect(parsed.experience[0]).toMatchObject({
      title: "Senior Backend Engineer",
      company: "PT GoTo Gojek Tokopedia",
      location: "Jakarta, Indonesia",
      startDate: "Jan 2022",
      endDate: "Present",
    });
    expect(parsed.experience[1]).toMatchObject({
      title: "Software Engineer",
      company: "Traveloka",
      location: "Jakarta, Indonesia",
      startDate: "Jul 2019",
      endDate: "Dec 2021",
    });
    expect(parsed.education).toHaveLength(2);
    expect(parsed.education[0]).toMatchObject({
      degree: "Master of Science in Artificial Intelligence",
      field: "Artificial Intelligence",
      institution: "Institut Teknologi Bandung",
      startDate: "2019",
      endDate: "2021",
    });
    expect(parsed.education[1]).toMatchObject({
      degree: "B.Sc. in Computer Science",
      field: "Computer Science",
      institution: "Universitas Indonesia",
      startDate: "2015",
      endDate: "2019",
    });
  });

  it("parses 03-collapsed-dense.txt (no blank lines, company-first order disambiguated via feature scoring)", () => {
    const parsed = parseResumeStructure(loadFixture("03-collapsed-dense.txt"));
    expect(parsed.contact.name).toBe("Marcus Vance");
    expect(parsed.contact.location).toBe("San Francisco, CA");
    expect(parsed.experience).toHaveLength(3);
    expect(parsed.experience[0]).toMatchObject({
      company: "Stripe",
      title: "Staff Software Engineer",
      startDate: "Jan 2022",
      endDate: "Present",
    });
    expect(parsed.experience[1]).toMatchObject({
      company: "Datadog",
      title: "Senior Software Engineer",
      startDate: "Jun 2019",
      endDate: "Dec 2021",
    });
    expect(parsed.experience[2]).toMatchObject({
      company: "Cloudflare Systems Inc",
      title: "Software Engineer",
      startDate: "Jul 2017",
      endDate: "May 2019",
    });
    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0]?.institution).toBe(
      "University of California, Berkeley"
    );
    expect(parsed.education[0]?.field).toBe(
      "Electrical Engineering and Computer Sciences"
    );
  });

  it("parses 04-academic-switcher.txt (alternative headers, 'Role at Company', Ph.D. and B.A.)", () => {
    const parsed = parseResumeStructure(loadFixture("04-academic-switcher.txt"));
    expect(parsed.contact.name).toBe("Dr. Elena Rostova");
    expect(parsed.contact.location).toBe("Cambridge, United Kingdom");
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0]).toMatchObject({
      title: "Lead Data Scientist",
      company: "FinTech Solutions LLC",
      startDate: "Mar 2022",
      endDate: "Present",
    });
    expect(parsed.experience[1]).toMatchObject({
      title: "Graduate Research Assistant",
      company: "MIT Media Lab",
      startDate: "Sep 2018",
      endDate: "Feb 2022",
    });
    expect(parsed.education).toHaveLength(2);
    expect(parsed.education[0]).toMatchObject({
      degree: "Ph.D. in Computational Biology",
      field: "Computational Biology",
      institution: "University of Cambridge",
    });
    expect(parsed.skills).toContain("SQL (Snowflake, BigQuery)");
    expect(parsed.certifications).toContain(
      "AWS Certified Machine Learning – Specialty"
    );
  });

  it("parses 05-minimal-edge.txt (inline Skills/Certifications/Languages and Expected graduation date)", () => {
    const parsed = parseResumeStructure(loadFixture("05-minimal-edge.txt"));
    expect(parsed.contact.name).toBe("Alex Rivera");
    expect(parsed.contact.location).toBe("Austin, TX");
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0]).toMatchObject({
      title: "Software Engineering Intern",
      company: "BrightPath Labs",
      location: "Austin, TX",
      startDate: "05/2025",
      endDate: "08/2025",
    });
    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0]).toMatchObject({
      degree: "Bachelor of Science in Software Engineering",
      field: "Software Engineering",
      institution: "University of Texas at Austin",
      endDate: "Expected May 2026",
    });
    expect(parsed.skills).toEqual(
      expect.arrayContaining(["JavaScript", "TypeScript", "React", "Node.js"])
    );
    expect(parsed.certifications).toContain(
      "Meta Front-End Developer Certificate"
    );
    expect(parsed.languages).toEqual(["English", "Spanish"]);
  });
});
