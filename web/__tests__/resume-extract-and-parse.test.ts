import { describe, expect, it } from "vitest";
import {
  extractResumeText,
  reconstructPdfLinesFromItems,
} from "@/lib/resume/extract-text";
import { parseResumeStructure } from "@/lib/resume/parse-structure";
import {
  buildSampleDocxBuffer,
  buildSamplePdfBuffer,
} from "./helpers/cv-binary-builders";

describe("reconstructPdfLinesFromItems", () => {
  it("groups items by vertical baseline and joins wide horizontal column gaps with pipes", () => {
    const reconstructed = reconstructPdfLinesFromItems([
      { str: "RAVINDRA ARIBOWO TARUNOKUSUMO", x: 50, y: 740, width: 200, height: 12 },
      { str: "Senior Backend Engineer", x: 50, y: 700, width: 130, height: 10 },
      { str: "Jan 2022 - Present", x: 420, y: 701, width: 90, height: 10 },
      { str: "PT GoTo Gojek Tokopedia", x: 50, y: 686, width: 135, height: 10 },
      { str: "Jakarta, Indonesia", x: 420, y: 685.5, width: 95, height: 10 },
    ]);

    expect(reconstructed).toContain("RAVINDRA ARIBOWO TARUNOKUSUMO");
    expect(reconstructed).toContain(
      "Senior Backend Engineer | Jan 2022 - Present"
    );
    expect(reconstructed).toContain(
      "PT GoTo Gojek Tokopedia | Jakarta, Indonesia"
    );
  });

  it("handles intra-word kerning splits vs word spaces", () => {
    const reconstructed = reconstructPdfLinesFromItems([
      { str: "Soft", x: 50, y: 700, width: 20, height: 10 },
      { str: "ware", x: 70.5, y: 700, width: 22, height: 10 },
      { str: "Engineer", x: 97, y: 700, width: 45, height: 10 },
    ]);

    expect(reconstructed).toBe("Software Engineer");
  });
});

describe("extractResumeText + parseResumeStructure end-to-end binary extraction", () => {
  it("extracts and parses a real binary PDF with right-aligned tab columns", async () => {
    const pdfBuffer = buildSamplePdfBuffer([
      "RAVINDRA ARIBOWO TARUNOKUSUMO",
      "ravindra.aribowo@example.id | +62 812-3456-7890 | Jakarta, Indonesia",
      "",
      "EXPERIENCE",
      { left: "Senior Backend Engineer", right: "Jan 2022 - Present" },
      { left: "PT GoTo Gojek Tokopedia", right: "Jakarta, Indonesia" },
      "- Architected merchant settlement service in Go and Kafka",
      { left: "Software Engineer", right: "Jul 2019 - Dec 2021" },
      { left: "Traveloka", right: "Jakarta, Indonesia" },
      "- Built flight inventory caching microservices in TypeScript",
      "",
      "EDUCATION",
      {
        left: "B.Sc. in Computer Science | Universitas Indonesia",
        right: "2015 - 2019",
      },
      "",
      "SKILLS",
      "Languages: Go, TypeScript, Python, SQL (PostgreSQL, MySQL)",
    ]);

    const extracted = await extractResumeText(pdfBuffer, "application/pdf");
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) {
      return;
    }

    expect(extracted.text).toContain(
      "Senior Backend Engineer | Jan 2022 - Present"
    );

    const parsed = parseResumeStructure(extracted.text);
    expect(parsed.contact.name).toBe("Ravindra Aribowo Tarunokusumo");
    expect(parsed.contact.email).toBe("ravindra.aribowo@example.id");
    expect(parsed.contact.location).toBe("Jakarta, Indonesia");
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0]).toMatchObject({
      title: "Senior Backend Engineer",
      company: "PT GoTo Gojek Tokopedia",
      location: "Jakarta, Indonesia",
      startDate: "Jan 2022",
      endDate: "Present",
    });
    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0]).toMatchObject({
      degree: "B.Sc. in Computer Science",
      field: "Computer Science",
      institution: "Universitas Indonesia",
      startDate: "2015",
      endDate: "2019",
    });
    expect(parsed.skills).toEqual(
      expect.arrayContaining([
        "Go",
        "TypeScript",
        "Python",
        "SQL (PostgreSQL, MySQL)",
      ])
    );
  });

  it("extracts and parses a real binary DOCX document end-to-end", async () => {
    const docxBuffer = buildSampleDocxBuffer([
      "Jane Doe",
      "jane.doe@example.com | +1 555-010-2000 | London, UK",
      "SUMMARY",
      "Product-minded Senior Software Engineer with 6 years of experience.",
      "EXPERIENCE",
      "Senior Software Engineer | Acme Corp | Remote",
      "Jan 2021 - Present",
      "- Led API redesign reducing latency by 40%",
      "EDUCATION",
      "B.S. in Computer Science | State University",
      "2014 - 2018",
      "SKILLS",
      "TypeScript, React, Node.js, PostgreSQL",
    ]);

    const extracted = await extractResumeText(
      docxBuffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) {
      return;
    }

    const parsed = parseResumeStructure(extracted.text);
    expect(parsed.contact.name).toBe("Jane Doe");
    expect(parsed.contact.email).toBe("jane.doe@example.com");
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0]?.title).toBe("Senior Software Engineer");
    expect(parsed.experience[0]?.company).toBe("Acme Corp");
    expect(parsed.education).toHaveLength(1);
    expect(parsed.education[0]?.institution).toBe("State University");
    expect(parsed.education[0]?.field).toBe("Computer Science");
    expect(parsed.skills).toEqual([
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
    ]);
  });
});
