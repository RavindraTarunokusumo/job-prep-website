import {
  emptyParsedResume,
  type ParsedResume,
} from "@/lib/validation/resume";

type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "contact";

const SECTION_HEADERS: Array<{ key: SectionKey; patterns: RegExp[] }> = [
  {
    key: "summary",
    patterns: [
      /^(?:(?:professional|executive|career)\s+)?(?:summary|profile|objective)$/i,
      /^about(?:\s+me)?$/i,
    ],
  },
  {
    key: "experience",
    patterns: [
      /^(?:(?:work|professional|relevant|industry|career)\s+)?experience$/i,
      /^employment(?:\s+history)?$/i,
      /^(?:work|career)\s+history$/i,
    ],
  },
  {
    key: "education",
    patterns: [
      /^education(?:\s*(?:&|and)\s*training)?$/i,
      /^academic(?:\s+(?:background|qualifications))?$/i,
      /^academics$/i,
      /^qualifications$/i,
    ],
  },
  {
    key: "skills",
    patterns: [
      /^(?:(?:technical|core|key|tooling\s*(?:&|and))\s+)?(?:skills|competencies|technologies|proficiencies|areas\s+of\s+expertise)(?:\s*(?:&|and)\s*(?:technologies|skills|tools))?$/i,
      /^skills\s*(?:&|and)\s*(?:technologies|tools)$/i,
    ],
  },
  {
    key: "projects",
    patterns: [
      /^(?:(?:personal|selected|key|academic|notable)\s+)?projects?$/i,
    ],
  },
  {
    key: "certifications",
    patterns: [
      /^(?:(?:licenses?|honors?|awards?)\s*(?:&|and)\s*)?certifications?$/i,
      /^certificates?$/i,
      /^credentials?$/i,
    ],
  },
  {
    key: "languages",
    patterns: [
      /^(?:spoken\s+)?languages?(?:\s+proficiency)?$/i,
      /^language\s+proficiency$/i,
    ],
  },
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i;
const URL_RE =
  /(?:https?:\/\/[^\s|,;)]+|(?:www\.)?(?:github\.com|gitlab\.com)\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)?)/gi;
const URL_TEST_RE =
  /(?:https?:\/\/[^\s|,;)]+|(?:www\.)?(?:github\.com|gitlab\.com)\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)?)/i;

const MONTH_PATTERN =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?";
const DATE_TOKEN_PATTERN = `(?:${MONTH_PATTERN}\\s+(?:19|20)\\d{2}|(?:0?[1-9]|1[0-2])\\/(?:19|20)\\d{2}|(?:19|20)\\d{2})`;
const END_TOKEN_PATTERN = `(?:Present|Current|Now|Ongoing|${DATE_TOKEN_PATTERN})`;

const DATE_RANGE_RE = new RegExp(
  `\\(?\\b(${DATE_TOKEN_PATTERN})\\s*(?:[–—-]+|\\bto\\b|\\buntil\\b|\\bthrough\\b)\\s*(${END_TOKEN_PATTERN})\\b\\)?`,
  "i"
);
const SINGLE_GRAD_DATE_RE = new RegExp(
  `\\(?\\b((?:Expected|Graduated|Class\\s+of)\\s+${DATE_TOKEN_PATTERN})\\b\\)?`,
  "i"
);
const STANDALONE_YEAR_RE = /^\(?\b((?:19|20)\d{2})\b\)?$/;

const BULLET_LINE_RE = /^(?:[-*•·▪‣]|\d+\.)\s+/;

const TITLE_KEYWORD_RE =
  /\b(?:engineer|developer|architect|manager|lead|leader|director|analyst|scientist|designer|intern|internship|consultant|specialist|coordinator|administrator|admin|researcher|officer|vp|vice\s+president|president|head|principal|staff|senior|sr\.?|junior|jr\.?|associate|fellow|professor|lecturer|instructor|teaching\s+assistant|research\s+assistant|assistant|programmer|technician|strategist|founder|co-founder|cto|ceo|coo|cfo|cpo|sre|devops|fullstack|full-stack|full\s+stack|frontend|front-end|backend|back-end)\b/i;

const TITLE_MODIFIER_RE =
  /\b(?:software|systems?|product|data|machine\s+learning|ml|ai|cloud|platform|infrastructure|security|qa|quality|test|mobile|ios|android|web|ui|ux|growth|marketing|sales|operations|business|financial|research)\b/i;

const COMPANY_SUFFIX_RE =
  /\b(?:inc\.?|llc|ltd\.?|corp\.?|corporation|gmbh|pt|tbk|plc|llp|co\.?|company|technologies|technology|systems|solutions|labs?|laboratory|group|studios?|bank|partners|agency|holdings|ventures|enterprises|global|digital|media|health|healthcare|finance|financial|capital|motors|airlines|telecom|network|networks|foundation|association)\b/i;

const INSTITUTION_KEYWORD_RE =
  /\b(?:university|universitas|universität|université|institute|institut|college|school|academy|polytechnic|hochschule|eth|mit|stanford|caltech|harvard|princeton|yale|cornell|columbia|ucla|nyu|ucl|imperial|nus|ntu|itb|ugm|ui|sman)\b/i;

const DEGREE_KEYWORD_RE =
  /(?:\b(?:b\.?s\.?c?\.?|b\.?a\.?|b\.?eng\.?|b\.?tech\.?|b\.?com\.?|m\.?s\.?c?\.?|m\.?a\.?|m\.?eng\.?|m\.?tech\.?|m\.?b\.?a\.?|ph\.?d\.?|d\.?phil\.?|m\.?d\.?|j\.?d\.?|bachelor(?:'?s)?|master(?:'?s)?|doctor(?:ate)?|associate(?:'?s)?|diploma|graduate\s+certificate|certificate|bootcamp|high\s+school|sarjana)\b)/i;

const EDUCATION_DESCRIPTION_RE =
  /^(?:gpa|cumulative\s+gpa|grade|honors?|awards?|relevant\s+coursework|coursework|activities|societies|thesis|dissertation|minor)\b|\bgpa\s*[:=]?\s*\d\.\d|\b(?:summa|magna)\s+cum\s+laude\b|\bdean'?s\s+list\b/i;

const PROSE_ACTION_VERB_RE =
  /^(?:built|led|designed|developed|implemented|managed|created|architected|engineered|delivered|spearheaded|maintained|optimized|automated|conducted|analyzed|researched|taught|assisted|coordinated|collaborated|reduced|improved|increased|migrated|deployed|authored|mentored|published)\b/i;

const PROGRAMMING_LANG_RE =
  /\b(?:typescript|javascript|python|java|golang|rust|c\+\+|c#|ruby|php|swift|kotlin|scala|sql|postgres|postgresql|mysql|bash|html|css|react|node\.?js)\b/i;

const KNOWN_PLACES_RE =
  /\b(?:remote|hybrid|jakarta|indonesia|london|united\s+kingdom|uk|singapore|berlin|germany|paris|france|amsterdam|netherlands|zurich|switzerland|toronto|vancouver|canada|sydney|melbourne|australia|tokyo|japan|bangalore|mumbai|india|seoul|korea|dublin|ireland|stockholm|sweden|new\s+york|san\s+francisco|seattle|austin|boston|chicago|los\s+angeles)\b/i;

function normalizeHeaderCandidate(line: string): string {
  const trimmed = line.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > 60 ||
    trimmed.includes("|") ||
    trimmed.includes(";") ||
    trimmed.endsWith(".")
  ) {
    return "";
  }
  return trimmed
    .replace(/^[\s•·▪‣*#\-–—\d.)]+/, "")
    .replace(/[—–\-:\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSectionHeader(line: string): SectionKey | null {
  const normalized = normalizeHeaderCandidate(line);
  if (!normalized) {
    return null;
  }

  for (const section of SECTION_HEADERS) {
    if (section.patterns.some((pattern) => pattern.test(normalized))) {
      return section.key;
    }
  }

  return null;
}

function matchInlineSection(
  line: string,
  currentSection: SectionKey | null
): { key: SectionKey; content: string } | null {
  const match = line.match(/^[\s•·▪‣*#\-–—]*([^:|]{2,35}):\s+(.+)$/);
  if (!match) {
    return null;
  }
  const key = isSectionHeader(match[1]);
  const content = match[2].trim();
  if (!key || !content) {
    return null;
  }
  if (
    key !== "skills" &&
    key !== "certifications" &&
    key !== "languages" &&
    key !== "summary"
  ) {
    return null;
  }
  if (
    key === "languages" &&
    currentSection === "skills" &&
    PROGRAMMING_LANG_RE.test(content)
  ) {
    return null;
  }
  return { key, content };
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function splitRespectingParens(text: string, delimiterRe: RegExp): string[] {
  const results: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(" || ch === "[") {
      depth += 1;
      current += ch;
      continue;
    }
    if ((ch === ")" || ch === "]") && depth > 0) {
      depth -= 1;
      current += ch;
      continue;
    }
    if (depth === 0 && delimiterRe.test(ch)) {
      if (current.trim().length > 0) {
        results.push(current.trim());
      }
      current = "";
      continue;
    }
    current += ch;
  }

  if (current.trim().length > 0) {
    results.push(current.trim());
  }

  return results;
}

function parseSkills(block: string): string[] {
  const rawLines = splitLines(block);
  const items: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of rawLines) {
    const cleanedLine = rawLine.replace(/^[-*•·▪‣]\s*/, "").trim();
    const withoutCategory = cleanedLine.replace(
      /^[A-Za-z][A-Za-z0-9 &/()-]{1,35}:\s*/,
      ""
    );
    const tokens = splitRespectingParens(withoutCategory, /[,;|•·▪‣]/);

    for (const token of tokens) {
      const normalized = token
        .replace(/^[-*•·▪‣–—\s]+/, "")
        .replace(/[\s.;]+$/, "")
        .trim();
      if (!normalized || normalized.length > 80) {
        continue;
      }
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push(normalized);
      }
    }
  }

  return items;
}

function parseCertificationsOrLanguages(block: string): string[] {
  const rawLines = splitLines(block);
  const items: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of rawLines) {
    const cleanedLine = rawLine
      .replace(/^[-*•·▪‣]\s*/, "")
      .replace(/^(?:certifications?|languages?|credentials?)\s*:\s*/i, "")
      .trim();
    const tokens = cleanedLine.includes(",")
      ? splitRespectingParens(cleanedLine, /[,;|•·▪‣]/)
      : splitRespectingParens(cleanedLine, /[;|•·▪‣]/);

    for (const token of tokens) {
      const normalized = token.replace(/^[-*•·▪‣\s]+/, "").trim();
      if (!normalized || /^gpa\b/i.test(normalized)) {
        continue;
      }
      const key = normalized.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push(normalized);
      }
    }
  }

  return items;
}

export function extractDateRangeFromLine(line: string): {
  startDate?: string;
  endDate?: string;
  remainingLine: string;
} {
  const rangeMatch = line.match(DATE_RANGE_RE);
  if (rangeMatch && rangeMatch.index != null) {
    const startDate = rangeMatch[1].trim();
    const endDate = rangeMatch[2].trim();
    const before = line.slice(0, rangeMatch.index);
    const after = line.slice(rangeMatch.index + rangeMatch[0].length);
    const remainingLine = `${before} ${after}`
      .replace(/\(\s*\)/g, "")
      .replace(/^\s*(?:\||—|–|-)\s*/, "")
      .replace(/\s*(?:\||—|–|-)\s*$/, "")
      .replace(/\s*(?:\||—|–)\s*(?:\||—|–)\s*/g, " | ")
      .replace(/\s{2,}/g, " ")
      .trim();
    return { startDate, endDate, remainingLine };
  }

  const gradMatch = line.match(SINGLE_GRAD_DATE_RE);
  if (gradMatch && gradMatch.index != null) {
    const endDate = gradMatch[1].trim();
    const before = line.slice(0, gradMatch.index);
    const after = line.slice(gradMatch.index + gradMatch[0].length);
    const remainingLine = `${before} ${after}`
      .replace(/\(\s*\)/g, "")
      .replace(/^\s*(?:\||—|–|-)\s*/, "")
      .replace(/\s*(?:\||—|–|-)\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return { endDate, remainingLine };
  }

  const yearOnly = line.trim().match(STANDALONE_YEAR_RE);
  if (yearOnly) {
    return { endDate: yearOnly[1], remainingLine: "" };
  }

  return { remainingLine: line.trim() };
}

function hasDateRange(line: string): boolean {
  const extracted = extractDateRangeFromLine(line);
  return Boolean(extracted.startDate || extracted.endDate);
}

function isBulletLine(line: string): boolean {
  return BULLET_LINE_RE.test(line.trim());
}

function isLikelyProseLine(line: string): boolean {
  const trimmed = line.trim();
  if (isBulletLine(trimmed)) {
    return true;
  }
  if (trimmed.includes("|")) {
    return false;
  }
  if (PROSE_ACTION_VERB_RE.test(trimmed)) {
    return true;
  }
  return trimmed.endsWith(".") && trimmed.split(/\s+/).length >= 6;
}

function splitHeaderSegments(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) {
    return [];
  }
  if (!trimmed.includes("|") && !trimmed.includes("—") && !/\s-\s/.test(trimmed)) {
    const atMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9 /&.,'-]{2,45})\s+at\s+([A-Z][A-Za-z0-9 &.,'-]{1,50})$/);
    if (atMatch && TITLE_KEYWORD_RE.test(atMatch[1])) {
      return [atMatch[1].trim(), atMatch[2].trim()];
    }
  }
  return trimmed
    .split(/\s*(?:\||—|–|\s-\s)\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function scoreLocationSegment(seg: string, segIdx = 0): number {
  const trimmed = seg.trim();
  if (!trimmed || trimmed.length > 45) {
    return -10;
  }
  if (EMAIL_RE.test(trimmed) || LINKEDIN_RE.test(trimmed) || /\d{4}/.test(trimmed)) {
    return -10;
  }
  if (/^(?:remote|hybrid|on-site)(?:\s*\([^)]+\))?$/i.test(trimmed)) {
    return 10;
  }
  if (
    TITLE_KEYWORD_RE.test(trimmed) ||
    DEGREE_KEYWORD_RE.test(trimmed) ||
    INSTITUTION_KEYWORD_RE.test(trimmed)
  ) {
    return -8;
  }
  if (/,\s*(?:inc\.?|llc|ltd\.?|corp\.?|gmbh|tbk)$/i.test(trimmed)) {
    return -8;
  }
  if (
    /^[A-Z][A-Za-z .'-]{1,28},\s*(?:[A-Z]{2,3}|[A-Z][A-Za-z .'-]{2,25})(?:\s*\((?:Remote|Hybrid|On-site)\))?$/.test(
      trimmed
    )
  ) {
    return 8 + (segIdx >= 2 ? 2 : 0);
  }
  if (KNOWN_PLACES_RE.test(trimmed) && trimmed.split(/\s+/).length <= 4) {
    return 6 + (segIdx >= 2 ? 2 : 0);
  }
  return -2;
}

function scoreJobTitleSegment(seg: string, lineIdx: number, segIdx: number): number {
  const trimmed = seg.trim();
  if (!trimmed) {
    return -10;
  }
  let score = 0;
  if (TITLE_KEYWORD_RE.test(trimmed)) {
    score += 6;
  }
  if (TITLE_MODIFIER_RE.test(trimmed) && TITLE_KEYWORD_RE.test(trimmed)) {
    score += 2;
  }
  if (COMPANY_SUFFIX_RE.test(trimmed) && !TITLE_KEYWORD_RE.test(trimmed)) {
    score -= 6;
  }
  if (scoreLocationSegment(trimmed, segIdx) >= 6) {
    score -= 8;
  }
  if (lineIdx === 0 && segIdx === 0) {
    score += 1;
  }
  return score;
}

function scoreCompanySegment(seg: string, lineIdx: number, segIdx: number): number {
  const trimmed = seg.trim();
  if (!trimmed) {
    return -10;
  }
  let score = 0;
  if (COMPANY_SUFFIX_RE.test(trimmed)) {
    score += 6;
  }
  if (TITLE_KEYWORD_RE.test(trimmed) && !COMPANY_SUFFIX_RE.test(trimmed)) {
    score -= 5;
  }
  if (scoreLocationSegment(trimmed, segIdx) >= 6) {
    score -= 8;
  }
  if (segIdx === 1) {
    score += 3;
  } else if (lineIdx === 1 && segIdx === 0) {
    score += 2;
  } else if (/^[A-Z]/.test(trimmed)) {
    score += 1;
  }
  return score;
}

function splitSectionBlocks(
  block: string,
  kind: "experience" | "education"
): string[] {
  const rawLines = block.split("\n").map((line) => line.trim());
  const chunks: string[][] = [];
  let current: string[] = [];

  const nextNonEmptyLine = (startIndex: number, offset: number): string => {
    let seen = 0;
    for (let j = startIndex; j < rawLines.length; j += 1) {
      if (rawLines[j].length > 0) {
        seen += 1;
        if (seen === offset) {
          return rawLines[j];
        }
      }
    }
    return "";
  };

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];

    if (line.length === 0) {
      if (current.length > 0) {
        const currentHasDate = current.some((l) => hasDateRange(l));
        const currentHasBody = current.some(
          (l) => isLikelyProseLine(l) || EDUCATION_DESCRIPTION_RE.test(l)
        );
        const nextLine = nextNonEmptyLine(i + 1, 1);
        const nextIsContinuation =
          isBulletLine(nextLine) || EDUCATION_DESCRIPTION_RE.test(nextLine);
        if (
          !nextIsContinuation &&
          (currentHasBody || (currentHasDate && current.length >= 1))
        ) {
          chunks.push(current);
          current = [];
        }
      }
      continue;
    }

    if (current.length > 0) {
      const currentHasDate = current.some((l) => hasDateRange(l));
      const currentHasBullets = current.some((l) => isBulletLine(l));
      const currentHasBody =
        currentHasBullets ||
        (currentHasDate &&
          current.some(
            (l) => isLikelyProseLine(l) || EDUCATION_DESCRIPTION_RE.test(l)
          ));

      const lineIsBullet = isBulletLine(line);
      const lineHasDate = hasDateRange(line);
      const next1 = nextNonEmptyLine(i + 1, 1);
      const next2 = nextNonEmptyLine(i + 1, 2);

      let shouldSplit = false;

      if (!lineIsBullet && !EDUCATION_DESCRIPTION_RE.test(line)) {
        if (currentHasDate && lineHasDate) {
          shouldSplit = true;
        } else if (
          currentHasBody &&
          /^[A-Z]/.test(line) &&
          (line.includes("|") ||
            line.includes("—") ||
            lineHasDate ||
            hasDateRange(next1) ||
            hasDateRange(next2) ||
            (kind === "education" &&
              (DEGREE_KEYWORD_RE.test(line) || INSTITUTION_KEYWORD_RE.test(line))))
        ) {
          shouldSplit = true;
        } else if (
          kind === "education" &&
          currentHasDate &&
          current.length >= 2 &&
          (DEGREE_KEYWORD_RE.test(line) || INSTITUTION_KEYWORD_RE.test(line))
        ) {
          shouldSplit = true;
        }
      }

      if (shouldSplit) {
        chunks.push(current);
        current = [line];
        continue;
      }
    }

    current.push(line);
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks
    .map((chunk) => chunk.join("\n"))
    .filter((chunk) => chunk.length > 0);
}

function parseExperienceEntry(
  block: string
): ParsedResume["experience"][number] {
  const lines = splitLines(block);
  const entry: ParsedResume["experience"][number] = {};
  const headerLines: string[] = [];
  const descriptionLines: string[] = [];
  let seenBullets = false;

  for (const line of lines) {
    if (isBulletLine(line)) {
      seenBullets = true;
      descriptionLines.push(line);
      continue;
    }

    if (seenBullets) {
      descriptionLines.push(line);
      continue;
    }

    const { startDate, endDate, remainingLine } = extractDateRangeFromLine(line);
    if (startDate || endDate) {
      if (startDate && !entry.startDate) {
        entry.startDate = startDate;
      }
      if (endDate && !entry.endDate) {
        entry.endDate = endDate;
      }
      if (remainingLine.length > 0) {
        headerLines.push(remainingLine);
      }
      continue;
    }

    if (
      (entry.startDate || entry.endDate || headerLines.length >= 2) &&
      isLikelyProseLine(line)
    ) {
      descriptionLines.push(line);
      continue;
    }

    headerLines.push(line);
  }

  type HeaderSegment = {
    text: string;
    lineIdx: number;
    segIdx: number;
    used: boolean;
  };

  const segments: HeaderSegment[] = [];
  headerLines.forEach((hLine, lineIdx) => {
    const parts = splitHeaderSegments(hLine);
    parts.forEach((part, segIdx) => {
      const { startDate, endDate, remainingLine } =
        extractDateRangeFromLine(part);
      if (startDate && !entry.startDate) {
        entry.startDate = startDate;
      }
      if (endDate && !entry.endDate) {
        entry.endDate = endDate;
      }
      if (remainingLine) {
        segments.push({
          text: remainingLine,
          lineIdx,
          segIdx,
          used: false,
        });
      }
    });
  });

  if (segments.length > 0) {
    let bestTitleIdx = -1;
    let bestTitleScore = -Infinity;

    segments.forEach((seg, idx) => {
      const score = scoreJobTitleSegment(seg.text, seg.lineIdx, seg.segIdx);
      if (score > bestTitleScore) {
        bestTitleScore = score;
        bestTitleIdx = idx;
      }
    });

    if (bestTitleIdx >= 0) {
      entry.title = segments[bestTitleIdx].text;
      segments[bestTitleIdx].used = true;
    }

    let bestLocationIdx = -1;
    let bestLocationScore = 5;
    segments.forEach((seg, idx) => {
      if (seg.used) {
        return;
      }
      const score = scoreLocationSegment(seg.text, seg.segIdx);
      if (score > bestLocationScore) {
        bestLocationScore = score;
        bestLocationIdx = idx;
      }
    });

    if (bestLocationIdx >= 0) {
      entry.location = segments[bestLocationIdx].text;
      segments[bestLocationIdx].used = true;
    }

    let bestCompanyIdx = -1;
    let bestCompanyScore = -Infinity;
    segments.forEach((seg, idx) => {
      if (seg.used) {
        return;
      }
      const score = scoreCompanySegment(seg.text, seg.lineIdx, seg.segIdx);
      if (score > bestCompanyScore) {
        bestCompanyScore = score;
        bestCompanyIdx = idx;
      }
    });

    if (bestCompanyIdx >= 0) {
      entry.company = segments[bestCompanyIdx].text;
      segments[bestCompanyIdx].used = true;
    }

    for (const seg of segments) {
      if (!seg.used) {
        if (!entry.location && scoreLocationSegment(seg.text, seg.segIdx) > 0) {
          entry.location = seg.text;
          seg.used = true;
        } else {
          descriptionLines.unshift(seg.text);
        }
      }
    }
  }

  if (descriptionLines.length > 0) {
    entry.description = descriptionLines.join("\n");
  }

  return entry;
}

function extractFieldFromDegree(degreeText: string): string | undefined {
  const inMatch = degreeText.match(
    /\bin\s+([A-Za-z][A-Za-z0-9 &/.-]{2,60})$/i
  );
  if (inMatch) {
    return inMatch[1].replace(/\s*\([^)]*\)\s*$/, "").trim();
  }

  const abbrevAfterMatch = degreeText.match(
    /^(?:b\.?s\.?c?\.?|b\.?a\.?|b\.?eng\.?|b\.?tech\.?|m\.?s\.?c?\.?|m\.?a\.?|m\.?eng\.?|m\.?tech\.?|ph\.?d\.?|bachelor\s+of\s+(?:science|arts|engineering|technology|business\s+administration)|master\s+of\s+(?:science|arts|engineering|technology|business\s+administration)|associate\s+of\s+(?:science|arts))[,:\s]+([A-Za-z][A-Za-z0-9 &/.-]{2,60})$/i
  );
  if (abbrevAfterMatch) {
    return abbrevAfterMatch[1].replace(/\s*\([^)]*\)\s*$/, "").trim();
  }

  return undefined;
}

function parseEducationEntry(
  block: string
): ParsedResume["education"][number] {
  const lines = splitLines(block);
  const entry: ParsedResume["education"][number] = {};
  const headerLines: string[] = [];
  const descriptionLines: string[] = [];

  for (const line of lines) {
    if (isBulletLine(line) || EDUCATION_DESCRIPTION_RE.test(line)) {
      descriptionLines.push(line);
      continue;
    }

    const { startDate, endDate, remainingLine } = extractDateRangeFromLine(line);
    if (startDate || endDate) {
      if (startDate && !entry.startDate) {
        entry.startDate = startDate;
      }
      if (endDate && !entry.endDate) {
        entry.endDate = endDate;
      }
      if (remainingLine.length > 0) {
        headerLines.push(remainingLine);
      }
      continue;
    }

    headerLines.push(line);
  }

  type EduSegment = {
    text: string;
    lineIdx: number;
    segIdx: number;
    used: boolean;
  };

  const segments: EduSegment[] = [];
  headerLines.forEach((hLine, lineIdx) => {
    const parts = splitHeaderSegments(hLine);
    parts.forEach((part, segIdx) => {
      const { startDate, endDate, remainingLine } =
        extractDateRangeFromLine(part);
      if (startDate && !entry.startDate) {
        entry.startDate = startDate;
      }
      if (endDate && !entry.endDate) {
        entry.endDate = endDate;
      }
      if (remainingLine) {
        if (EDUCATION_DESCRIPTION_RE.test(remainingLine)) {
          descriptionLines.push(remainingLine);
        } else {
          segments.push({
            text: remainingLine,
            lineIdx,
            segIdx,
            used: false,
          });
        }
      }
    });
  });

  let bestDegreeIdx = -1;
  let bestDegreeScore = 0;
  segments.forEach((seg, idx) => {
    let score = 0;
    if (DEGREE_KEYWORD_RE.test(seg.text)) {
      score += 6;
    }
    if (INSTITUTION_KEYWORD_RE.test(seg.text) && !DEGREE_KEYWORD_RE.test(seg.text)) {
      score -= 5;
    }
    if (score > bestDegreeScore) {
      bestDegreeScore = score;
      bestDegreeIdx = idx;
    }
  });

  if (bestDegreeIdx >= 0) {
    entry.degree = segments[bestDegreeIdx].text;
    segments[bestDegreeIdx].used = true;
    const extractedField = extractFieldFromDegree(entry.degree);
    if (extractedField) {
      entry.field = extractedField;
    }
  }

  let bestInstIdx = -1;
  let bestInstScore = -Infinity;
  segments.forEach((seg, idx) => {
    if (seg.used) {
      return;
    }
    let score = 0;
    if (INSTITUTION_KEYWORD_RE.test(seg.text)) {
      score += 6;
    }
    if (scoreLocationSegment(seg.text, seg.segIdx) >= 6 && !INSTITUTION_KEYWORD_RE.test(seg.text)) {
      score -= 6;
    }
    if (seg.segIdx === 0 && seg.lineIdx === 0) {
      score += 1;
    }
    if (score > bestInstScore) {
      bestInstScore = score;
      bestInstIdx = idx;
    }
  });

  if (bestInstIdx >= 0 && bestInstScore >= 0) {
    entry.institution = segments[bestInstIdx].text;
    segments[bestInstIdx].used = true;
  }

  for (const seg of segments) {
    if (seg.used) {
      continue;
    }
    if (!entry.degree && scoreLocationSegment(seg.text, seg.segIdx) < 6) {
      entry.degree = seg.text;
      seg.used = true;
      const extractedField = extractFieldFromDegree(entry.degree);
      if (extractedField && !entry.field) {
        entry.field = extractedField;
      }
    } else if (!entry.field && scoreLocationSegment(seg.text, seg.segIdx) < 6) {
      entry.field = seg.text;
      seg.used = true;
    }
  }

  if (descriptionLines.length > 0) {
    entry.description = descriptionLines.join("\n");
  }

  return entry;
}

function parseProjects(block: string): ParsedResume["projects"] {
  const rawLines = block.split("\n").map((l) => l.trim());
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of rawLines) {
    if (line.length === 0) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
      }
      continue;
    }

    const lineIsBullet = isBulletLine(line);
    const currentHasBullets = current.some((l) => isBulletLine(l));
    const currentHasBody =
      currentHasBullets || current.some((l) => isLikelyProseLine(l));

    if (
      current.length > 0 &&
      !lineIsBullet &&
      (line.includes("|") ||
        (currentHasBody && /^[A-Z]/.test(line) && !line.endsWith(".")))
    ) {
      chunks.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  const projects: ParsedResume["projects"] = [];

  for (const chunk of chunks) {
    if (chunk.length === 0) {
      continue;
    }
    const firstLine = chunk[0].replace(/^[-*•·▪‣]\s*/, "").trim();
    const restLines = chunk.slice(1);
    const project: ParsedResume["projects"][number] = {};

    if (firstLine.includes("|")) {
      const parts = firstLine
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      project.name = parts[0];
      if (parts[1] && !URL_TEST_RE.test(parts[1]) && !hasDateRange(parts[1])) {
        const techs = parts[1]
          .split(/[,;]/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        if (techs.length > 0) {
          project.technologies = techs;
        }
      }
    } else if (
      (firstLine.includes(" — ") || firstLine.includes(" - ")) &&
      restLines.length === 0
    ) {
      const sep = firstLine.includes(" — ") ? " — " : " - ";
      const [namePart, ...descParts] = firstLine.split(sep);
      project.name = namePart.trim();
      const desc = descParts.join(sep).trim();
      if (desc) {
        project.description = desc;
      }
    } else {
      project.name = firstLine;
    }

    if (restLines.length > 0) {
      project.description = restLines.join("\n");
    }

    if (project.name) {
      projects.push(project);
    }
  }

  return projects;
}

function toTitleCaseName(name: string): string {
  const particles = new Set(["de", "del", "da", "dos", "van", "von", "bin", "binti", "al", "el"]);
  return name
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && particles.has(lower)) {
        return lower;
      }
      return lower.replace(/(^|['.-])([a-zà-öø-ÿ])/g, (_m, sep: string, ch: string) => `${sep}${ch.toUpperCase()}`);
    })
    .join(" ");
}

function scoreNameCandidate(
  candidate: string,
  lineIdx: number,
  segIdx: number,
  isWholeLine: boolean
): number {
  const trimmed = candidate.trim();
  if (trimmed.length < 2 || trimmed.length > 55) {
    return -100;
  }
  if (
    EMAIL_RE.test(trimmed) ||
    LINKEDIN_RE.test(trimmed) ||
    /https?:\/\/|www\.|github\.com|gitlab\.com/i.test(trimmed) ||
    trimmed.includes("@") ||
    /\d/.test(trimmed)
  ) {
    return -100;
  }
  if (
    isSectionHeader(trimmed) != null ||
    /^(?:curriculum\s+vitae|resume|cv)$/i.test(trimmed)
  ) {
    return -100;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2 || tokens.length > 5) {
    return -20;
  }

  const validTokens = tokens.every((tok) =>
    /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'.-]*$/.test(tok)
  );
  if (!validTokens) {
    return -100;
  }

  let score = 4;

  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const isTitleCase = tokens.every(
    (tok) =>
      /^[A-ZÀ-ÖØ-Þ][a-zß-öø-ÿ'.-]+$/.test(tok) ||
      /^[A-Z]\.?$/.test(tok) ||
      /^(?:de|del|da|dos|van|von|bin|binti|al|el)$/i.test(tok)
  );

  if (isAllCaps || isTitleCase) {
    score += 3;
  }
  if (lineIdx === 0 && segIdx === 0) {
    score += 2;
  }
  if (isWholeLine) {
    score += 1;
  }
  if (TITLE_KEYWORD_RE.test(trimmed) || TITLE_MODIFIER_RE.test(trimmed)) {
    score -= 8;
  }
  if (trimmed.includes(",") || KNOWN_PLACES_RE.test(trimmed)) {
    score -= 6;
  }

  return score;
}

function extractContactFromHeader(
  headerLines: string[]
): ParsedResume["contact"] {
  const contact: ParsedResume["contact"] = {};
  const headerText = headerLines.join("\n");

  const email = headerText.match(EMAIL_RE)?.[0];
  if (email) {
    contact.email = email;
  }

  const phoneMatches = headerText.match(PHONE_RE) ?? [];
  for (const candidatePhone of phoneMatches) {
    const trimmedPhone = candidatePhone.replace(/\s+/g, " ").trim();
    const digitCount = trimmedPhone.replace(/\D/g, "").length;
    const isYearPair = /^(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}$/.test(
      trimmedPhone
    );
    if (digitCount >= 8 && !isYearPair) {
      contact.phone = trimmedPhone;
      break;
    }
  }

  const linkedin = headerText.match(LINKEDIN_RE)?.[0];
  if (linkedin) {
    contact.linkedin = linkedin;
  }

  const urlMatches = headerText.match(URL_RE) ?? [];
  for (const url of urlMatches) {
    if (!/linkedin\.com/i.test(url)) {
      contact.website = url;
      break;
    }
  }

  let bestLocation = "";
  let bestLocationScore = 5;

  headerLines.forEach((line) => {
    const parts = line
      .split(/\s*(?:\||•|·|▪|‣|\s+—\s+|\s+–\s+|\s+-\s+)\s*/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    parts.forEach((part, idx) => {
      const score = scoreLocationSegment(part, idx);
      if (score > bestLocationScore) {
        bestLocationScore = score;
        bestLocation = part;
      }
    });
  });

  if (bestLocation) {
    contact.location = bestLocation;
  }

  let bestName = "";
  let bestNameScore = 2;

  headerLines.forEach((line, lineIdx) => {
    const wholeScore = scoreNameCandidate(line, lineIdx, 0, true);
    if (wholeScore > bestNameScore) {
      bestNameScore = wholeScore;
      bestName = line.trim();
    }

    const parts = line
      .split(/\s*(?:\||•|·|▪|‣|\s+—\s+|\s+–\s+|\s+-\s+)\s*/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length > 1) {
      parts.forEach((part, segIdx) => {
        const segScore = scoreNameCandidate(part, lineIdx, segIdx, false);
        if (segScore > bestNameScore) {
          bestNameScore = segScore;
          bestName = part;
        }
      });
    }
  });

  if (bestName) {
    const isAllCaps =
      bestName === bestName.toUpperCase() && /[A-Z]/.test(bestName);
    contact.name = isAllCaps ? toTitleCaseName(bestName) : bestName;
  }

  return contact;
}

export function parseResumeStructure(rawText: string): ParsedResume {
  const result = emptyParsedResume();
  const rawLines = rawText.replace(/\r\n/g, "\n").split("\n");
  const lines = rawLines.map((line) => line.trim());

  const firstSectionIndex = lines.findIndex(
    (line) =>
      isSectionHeader(line) != null || matchInlineSection(line, null) != null
  );
  const headerEnd =
    firstSectionIndex === -1 ? Math.min(lines.length, 8) : firstSectionIndex;
  const headerLines = lines
    .slice(0, headerEnd)
    .filter((line) => line.length > 0);
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

    const inlineSection = matchInlineSection(line, currentSection);
    if (inlineSection) {
      if (!sections.has(inlineSection.key)) {
        sections.set(inlineSection.key, []);
      }
      sections.get(inlineSection.key)?.push(inlineSection.content);
      currentSection = inlineSection.key;
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
    const expChunks = splitSectionBlocks(experienceBlock, "experience");
    result.experience = expChunks.map((chunk) => parseExperienceEntry(chunk));
  }

  const educationBlock = sections.get("education")?.join("\n").trim();
  if (educationBlock) {
    const eduChunks = splitSectionBlocks(educationBlock, "education");
    result.education = eduChunks.map((chunk) => parseEducationEntry(chunk));
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
    result.certifications = parseCertificationsOrLanguages(certificationsBlock);
  }

  const languagesBlock = sections.get("languages")?.join("\n").trim();
  if (languagesBlock) {
    result.languages = parseCertificationsOrLanguages(languagesBlock);
  }

  if (result.skills.length === 0) {
    const inlineSkills = rawText.match(/skills?\s*:\s*(.+)/i)?.[1];
    if (inlineSkills) {
      result.skills = parseSkills(inlineSkills);
    }
  }

  return result;
}
