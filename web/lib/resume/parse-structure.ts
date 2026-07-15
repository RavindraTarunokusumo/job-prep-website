import {
  emptyParsedResume,
  type ParsedResume,
} from "@/lib/validation/resume";

const SECTION_HEADERS = [
  { key: "summary" as const, patterns: [/^(professional\s+)?summary$/i, /^profile$/i, /^about(\s+me)?$/i, /^objective$/i] },
  { key: "experience" as const, patterns: [/^(work\s+)?experience$/i, /^employment(\s+history)?$/i, /^professional\s+experience$/i, /^work\s+history$/i] },
  { key: "education" as const, patterns: [/^education$/i, /^academic(\s+background)?$/i, /^qualifications$/i] },
  { key: "skills" as const, patterns: [/^(technical\s+)?skills$/i, /^core\s+competencies$/i, /^technologies$/i] },
  { key: "projects" as const, patterns: [/^projects?$/i, /^personal\s+projects?$/i, /^selected\s+projects?$/i] },
  { key: "certifications" as const, patterns: [/^certifications?$/i, /^licenses?(\s+(&|and)\s+certifications?)?$/i, /^credentials?$/i] },
  { key: "languages" as const, patterns: [/^languages?$/i] },
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i;
const URL_RE = /https?:\/\/[^\s)]+/i;

type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "contact";

function isSectionHeader(line: string): SectionKey | null {
  const trimmed = line.trim().replace(/:$/, "");
  if (trimmed.length === 0 || trimmed.length > 60) {
    return null;
  }

  for (const section of SECTION_HEADERS) {
    if (section.patterns.some((pattern) => pattern.test(trimmed))) {
      return section.key;
    }
  }

  return null;
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseListItems(block: string): string[] {
  return block
    .split(/\n|•|·|▪|‣|–|—/)
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter((item) => item.length > 0);
}

function parseSkills(block: string): string[] {
  const items = parseListItems(block);
  if (items.length <= 1 && block.includes(",")) {
    return block
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return items;
}

function looksLikeDateRange(line: string): boolean {
  return /\b(19|20)\d{2}\b/.test(line) || /\b(present|current)\b/i.test(line);
}

function splitSectionBlocks(block: string): string[] {
  const lines = block.split("\n").map((line) => line.trim());
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.length === 0) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
      }
      continue;
    }

    const isNewEntryHeader =
      line.includes("|") ||
      (looksLikeDateRange(line) && current.length > 0) ||
      (/^[A-Z]/.test(line) &&
        current.length > 0 &&
        current.some((existing) => looksLikeDateRange(existing)));

    if (isNewEntryHeader && current.length > 0) {
      chunks.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks.map((chunk) => chunk.join("\n")).filter((chunk) => chunk.length > 0);
}

function parseEntryBlock(
  block: string,
  kind: "experience" | "education"
): Record<string, string> {
  const lines = splitLines(block);
  const entry: Record<string, string> = {};
  const descriptionLines: string[] = [];
  let header = lines[0] ?? "";

  if (header.includes("|")) {
    const pipeParts = header.split("|").map((part) => part.trim());
    if (kind === "experience") {
      entry.title = pipeParts[0];
      entry.company = pipeParts[1];
      if (pipeParts[2]) {
        entry.location = pipeParts[2];
      }
    } else {
      entry.degree = pipeParts[0];
      entry.institution = pipeParts[1];
    }
    header = "";
  } else if (header.includes("—") || header.includes(" - ")) {
    const separator = header.includes("—") ? "—" : " - ";
    const headerParts = header.split(separator).map((part) => part.trim());
    if (kind === "education") {
      entry.degree = headerParts[0];
      entry.institution = headerParts[1];
    } else {
      entry.title = headerParts[0];
      entry.company = headerParts[1];
    }
    header = "";
  } else if (kind === "experience") {
    entry.title = header;
    header = "";
  } else {
    entry.institution = header;
    header = "";
  }

  for (const line of lines.slice(header ? 0 : 1)) {
    if (looksLikeDateRange(line)) {
      const dateMatch = line.match(/(.+?)\s*[–—-]\s*(.+)|(.+?)\s+to\s+(.+)/i);
      if (dateMatch) {
        entry.startDate = (dateMatch[1] ?? dateMatch[3] ?? "").trim();
        entry.endDate = (dateMatch[2] ?? dateMatch[4] ?? "").trim();
      } else {
        entry.endDate = line;
      }
      continue;
    }

    if (kind === "experience" && !entry.company && !entry.description) {
      entry.company = line;
      continue;
    }

    if (kind === "education" && !entry.degree && !entry.description) {
      entry.degree = line;
      continue;
    }

    descriptionLines.push(line);
  }

  if (descriptionLines.length > 0) {
    entry.description = descriptionLines.join("\n");
  }

  return entry;
}

function parseExperienceOrEducation(
  block: string,
  kind: "experience" | "education"
): ParsedResume["experience"] | ParsedResume["education"] {
  const chunks = splitSectionBlocks(block);
  return chunks.map((chunk) => parseEntryBlock(chunk, kind)) as
    | ParsedResume["experience"]
    | ParsedResume["education"];
}

function parseProjects(block: string): ParsedResume["projects"] {
  const chunks = block.split(/\n(?=[A-Z][\w\s/&-]{2,}(?:\n|$))/);
  if (chunks.length <= 1) {
    return parseListItems(block).map((item) => ({ name: item }));
  }

  return chunks
    .map((chunk) => {
      const lines = splitLines(chunk);
      if (lines.length === 0) {
        return null;
      }
      return {
        name: lines[0],
        description: lines.slice(1).join("\n") || undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
}

function extractContactFromHeader(headerLines: string[]): ParsedResume["contact"] {
  const contact: ParsedResume["contact"] = {};
  const headerText = headerLines.join("\n");

  const email = headerText.match(EMAIL_RE)?.[0];
  if (email) {
    contact.email = email;
  }

  const phone = headerText.match(PHONE_RE)?.[0];
  if (phone) {
    contact.phone = phone.replace(/\s+/g, " ").trim();
  }

  const linkedin = headerText.match(LINKEDIN_RE)?.[0];
  if (linkedin) {
    contact.linkedin = linkedin;
  }

  const website = headerText.match(URL_RE)?.[0];
  if (website && !contact.linkedin) {
    contact.website = website;
  }

  for (const line of headerLines) {
    const parts = line.split("|").map((part) => part.trim());
    for (const part of parts) {
      if (
        part.length > 0 &&
        !EMAIL_RE.test(part) &&
        !PHONE_RE.test(part) &&
        !LINKEDIN_RE.test(part) &&
        !URL_RE.test(part) &&
        /[A-Za-z]{2,}/.test(part) &&
        (part.includes(",") || /\bremote\b/i.test(part))
      ) {
        contact.location = part;
      }
    }
  }

  const locationLine = headerLines.find((line) =>
    /\b(remote|[A-Z][a-z]+,\s*[A-Z]{2,})\b/.test(line)
  );
  if (
    !contact.location &&
    locationLine &&
    !EMAIL_RE.test(locationLine) &&
    !PHONE_RE.test(locationLine)
  ) {
    const pipeParts = locationLine.split("|").map((part) => part.trim());
    const locationPart = pipeParts.find(
      (part) =>
        /\b(remote|[A-Z][a-z]+,\s*[A-Z]{2,})\b/.test(part) &&
        !EMAIL_RE.test(part) &&
        !PHONE_RE.test(part)
    );
    contact.location = locationPart ?? locationLine;
  }

  const nameCandidate = headerLines.find(
    (line) =>
      !EMAIL_RE.test(line) &&
      !PHONE_RE.test(line) &&
      !LINKEDIN_RE.test(line) &&
      !URL_RE.test(line) &&
      !line.includes("|") &&
      line.length < 60 &&
      /^[A-Z][a-z]+(\s+[A-Z][a-z'.-]+){0,3}$/.test(line)
  );
  if (nameCandidate) {
    contact.name = nameCandidate;
  }

  return contact;
}

export function parseResumeStructure(rawText: string): ParsedResume {
  const result = emptyParsedResume();
  const lines = rawText.split("\n").map((line) => line.trim());

  const firstSectionIndex = lines.findIndex((line) => isSectionHeader(line) != null);
  const headerEnd = firstSectionIndex === -1 ? Math.min(lines.length, 8) : firstSectionIndex;
  const headerLines = lines.slice(0, headerEnd).filter((line) => line.length > 0);
  result.contact = extractContactFromHeader(headerLines);

  const sections = new Map<SectionKey, string[]>();
  let currentSection: SectionKey | null = null;

  for (const line of lines) {
    const header = isSectionHeader(line);
    if (header) {
      currentSection = header;
      if (!sections.has(header)) {
        sections.set(header, []);
      }
      continue;
    }

    if (currentSection) {
      sections.get(currentSection)?.push(line);
    }
  }

  const summaryBlock = sections.get("summary")?.join("\n").trim();
  if (summaryBlock) {
    result.summary = summaryBlock;
  }

  const experienceBlock = sections.get("experience")?.join("\n").trim();
  if (experienceBlock) {
    result.experience = parseExperienceOrEducation(experienceBlock, "experience") as ParsedResume["experience"];
  }

  const educationBlock = sections.get("education")?.join("\n").trim();
  if (educationBlock) {
    result.education = parseExperienceOrEducation(educationBlock, "education") as ParsedResume["education"];
  }

  const skillsBlock = sections.get("skills")?.join("\n").trim();
  if (skillsBlock) {
    result.skills = parseSkills(skillsBlock);
  }

  const projectsBlock = sections.get("projects")?.join("\n").trim();
  if (projectsBlock) {
    result.projects = parseProjects(projectsBlock);
  }

  const certificationsBlock = sections.get("certifications")?.join("\n").trim();
  if (certificationsBlock) {
    result.certifications = parseSkills(certificationsBlock);
  }

  const languagesBlock = sections.get("languages")?.join("\n").trim();
  if (languagesBlock) {
    result.languages = parseSkills(languagesBlock);
  }

  if (result.skills.length === 0) {
    const inlineSkills = rawText.match(/skills?\s*:\s*(.+)/i)?.[1];
    if (inlineSkills) {
      result.skills = parseSkills(inlineSkills);
    }
  }

  return result;
}