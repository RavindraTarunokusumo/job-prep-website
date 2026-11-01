import { readFileSync } from "node:fs";
import path from "node:path";
import { extractResumeText } from "../lib/resume/extract-text";
import { parseResumeStructure } from "../lib/resume/parse-structure";
import {
  buildSampleDocxBuffer,
  buildSamplePdfBuffer,
} from "../__tests__/helpers/cv-binary-builders";

type BenchmarkCase = {
  id: string;
  format: "TXT" | "PDF" | "DOCX";
  expectedName: string;
  expectedLocation: string;
  expectedExpCount: number;
  expectedEduCount: number;
  minSkills: number;
  getRawText: () => Promise<string>;
};

const FIXTURE_DIR = path.join(__dirname, "..", "__tests__", "fixtures", "cvs");

function readFixture(name: string): string {
  return readFileSync(path.join(FIXTURE_DIR, name), "utf8");
}

const CASES: BenchmarkCase[] = [
  {
    id: "01-chronological-swe.txt",
    format: "TXT",
    expectedName: "Jane Doe",
    expectedLocation: "London, UK",
    expectedExpCount: 2,
    expectedEduCount: 1,
    minSkills: 10,
    getRawText: async () => readFixture("01-chronological-swe.txt"),
  },
  {
    id: "02-tab-aligned-intl.txt",
    format: "TXT",
    expectedName: "Ravindra Aribowo Tarunokusumo",
    expectedLocation: "Jakarta, Indonesia",
    expectedExpCount: 3,
    expectedEduCount: 2,
    minSkills: 8,
    getRawText: async () => readFixture("02-tab-aligned-intl.txt"),
  },
  {
    id: "03-collapsed-dense.txt",
    format: "TXT",
    expectedName: "Marcus Vance",
    expectedLocation: "San Francisco, CA",
    expectedExpCount: 3,
    expectedEduCount: 1,
    minSkills: 8,
    getRawText: async () => readFixture("03-collapsed-dense.txt"),
  },
  {
    id: "04-academic-switcher.txt",
    format: "TXT",
    expectedName: "Dr. Elena Rostova",
    expectedLocation: "Cambridge, United Kingdom",
    expectedExpCount: 2,
    expectedEduCount: 2,
    minSkills: 8,
    getRawText: async () => readFixture("04-academic-switcher.txt"),
  },
  {
    id: "05-minimal-edge.txt",
    format: "TXT",
    expectedName: "Alex Rivera",
    expectedLocation: "Austin, TX",
    expectedExpCount: 1,
    expectedEduCount: 1,
    minSkills: 6,
    getRawText: async () => readFixture("05-minimal-edge.txt"),
  },
  {
    id: "binary-tab-aligned.pdf",
    format: "PDF",
    expectedName: "Ravindra Aribowo Tarunokusumo",
    expectedLocation: "Jakarta, Indonesia",
    expectedExpCount: 2,
    expectedEduCount: 2,
    minSkills: 5,
    getRawText: async () => {
      const pdfBuffer = buildSamplePdfBuffer([
        "RAVINDRA ARIBOWO TARUNOKUSUMO",
        "ravindra.aribowo@example.id | +62 812-3456-7890 | Jakarta, Indonesia",
        "",
        "PROFESSIONAL EXPERIENCE",
        { left: "Senior Backend Engineer", right: "Jan 2022 - Present" },
        { left: "PT GoTo Gojek Tokopedia", right: "Jakarta, Indonesia" },
        "- Architected merchant settlement service in Go and Kafka",
        { left: "Software Engineer", right: "Jul 2019 - Dec 2021" },
        { left: "Traveloka", right: "Jakarta, Indonesia" },
        "- Built flight inventory caching microservices in TypeScript",
        "",
        "ACADEMIC BACKGROUND",
        {
          left: "Master of Science in Artificial Intelligence | Institut Teknologi Bandung",
          right: "2019 - 2021",
        },
        {
          left: "B.Sc. in Computer Science | Universitas Indonesia",
          right: "2015 - 2019",
        },
        "",
        "CORE COMPETENCIES",
        "Languages: Go, TypeScript, Python, SQL (PostgreSQL, MySQL), Docker",
      ]);
      const res = await extractResumeText(pdfBuffer, "application/pdf");
      if (!res.ok) {
        throw new Error(res.error);
      }
      return res.text;
    },
  },
  {
    id: "binary-chronological.docx",
    format: "DOCX",
    expectedName: "Jane Doe",
    expectedLocation: "London, UK",
    expectedExpCount: 2,
    expectedEduCount: 1,
    minSkills: 8,
    getRawText: async () => {
      const lines = readFixture("01-chronological-swe.txt").split("\n");
      const docxBuffer = buildSampleDocxBuffer(lines);
      const res = await extractResumeText(
        docxBuffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      if (!res.ok) {
        throw new Error(res.error);
      }
      return res.text;
    },
  },
];

async function main() {
  let failures = 0;
  const rows: Array<Record<string, string | number>> = [];

  for (const testCase of CASES) {
    const rawText = await testCase.getRawText();
    const parsed = parseResumeStructure(rawText);

    const nameOk = parsed.contact.name === testCase.expectedName;
    const locOk = parsed.contact.location === testCase.expectedLocation;
    const expOk = parsed.experience.length === testCase.expectedExpCount &&
      parsed.experience.every((e) => Boolean(e.title && e.company));
    const eduOk = parsed.education.length === testCase.expectedEduCount &&
      parsed.education.every((e) => Boolean(e.degree && e.institution));
    const skillsOk = parsed.skills.length >= testCase.minSkills;

    const passed = nameOk && locOk && expOk && eduOk && skillsOk;
    if (!passed) {
      failures += 1;
    }

    rows.push({
      Sample: testCase.id,
      Format: testCase.format,
      Name: parsed.contact.name ?? "MISSING",
      Location: parsed.contact.location ?? "MISSING",
      Exp: `${parsed.experience.length}/${testCase.expectedExpCount}`,
      Edu: `${parsed.education.length}/${testCase.expectedEduCount}`,
      Skills: parsed.skills.length,
      Status: passed ? "PASS" : "FAIL",
    });
  }

  console.table(rows);

  if (failures > 0) {
    console.error(`CV extraction verification failed on ${failures} case(s).`);
    process.exit(1);
  }

  console.log(
    `All ${CASES.length} CV extraction cases (TXT, PDF, DOCX) passed!`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
