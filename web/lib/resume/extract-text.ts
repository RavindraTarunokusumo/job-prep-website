import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { isAllowedResumeMimeType } from "@/lib/validation/resume";

export type ExtractTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type PdfTextItemInput = {
  str: string;
  x?: number;
  y?: number;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
};

type PositionedPdfItem = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
};

type PdfLineGroup = {
  y: number;
  height: number;
  items: PositionedPdfItem[];
};

const BASELINE_TOLERANCE_PT = 3;
const WIDE_COLUMN_GAP_PT = 24;
const WORD_GAP_PT = 1.5;
const DEFAULT_LINE_HEIGHT_PT = 12;
const PARAGRAPH_GAP_MULTIPLIER = 1.8;
const BOUNDARY_DELIMITER_RE = /[|\-–—•:]$/;
const LEADING_DELIMITER_RE = /^[|\-–—•:]/;

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function computeMedian(values: number[]): number {
  if (values.length === 0) {
    return DEFAULT_LINE_HEIGHT_PT;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  return Math.max(median, 10);
}

function joinLineItems(items: PositionedPdfItem[]): string {
  if (items.length === 0) {
    return "";
  }

  const sorted = [...items].sort((a, b) => a.x - b.x);
  let line = sorted[0].str;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    const estimatedPrevWidth =
      prev.width > 0 ? prev.width : prev.str.length * 4.5;
    const gap = next.x - (prev.x + estimatedPrevWidth);

    const prevTrimmed = line.trimEnd();
    const nextTrimmed = next.str.trimStart();
    if (!nextTrimmed) {
      continue;
    }

    if (gap > WIDE_COLUMN_GAP_PT) {
      const hasBoundaryDelimiter =
        BOUNDARY_DELIMITER_RE.test(prevTrimmed) ||
        LEADING_DELIMITER_RE.test(nextTrimmed);
      line = hasBoundaryDelimiter
        ? `${prevTrimmed} ${nextTrimmed}`
        : `${prevTrimmed} | ${nextTrimmed}`;
    } else if (
      gap > WORD_GAP_PT ||
      line.endsWith(" ") ||
      next.str.startsWith(" ")
    ) {
      line = `${prevTrimmed} ${nextTrimmed}`;
    } else {
      line = `${line}${next.str}`;
    }
  }

  return line.replace(/[ \t]{2,}/g, " ").trim();
}

export function reconstructPdfLinesFromItems(
  items: PdfTextItemInput[]
): string {
  const positioned: PositionedPdfItem[] = [];

  for (const item of items) {
    if (!item || typeof item.str !== "string") {
      continue;
    }
    if (item.str.trim().length === 0) {
      if (item.hasEOL && positioned.length > 0) {
        positioned[positioned.length - 1].hasEOL = true;
      }
      continue;
    }

    const x =
      typeof item.x === "number"
        ? item.x
        : typeof item.transform?.[4] === "number"
          ? item.transform[4]
          : 0;
    const y =
      typeof item.y === "number"
        ? item.y
        : typeof item.transform?.[5] === "number"
          ? item.transform[5]
          : 0;
    const width =
      typeof item.width === "number" && item.width > 0 ? item.width : 0;
    const height =
      typeof item.height === "number" && item.height > 0
        ? item.height
        : typeof item.transform?.[3] === "number" &&
            Math.abs(item.transform[3]) > 0
          ? Math.abs(item.transform[3])
          : 0;

    positioned.push({
      str: item.str,
      x,
      y,
      width,
      height,
      hasEOL: Boolean(item.hasEOL),
    });
  }

  if (positioned.length === 0) {
    return "";
  }

  const sortedByY = [...positioned].sort((a, b) => {
    if (Math.abs(b.y - a.y) > BASELINE_TOLERANCE_PT) {
      return b.y - a.y;
    }
    return a.x - b.x;
  });

  const lineGroups: PdfLineGroup[] = [];
  for (const item of sortedByY) {
    const existing = lineGroups.find(
      (group) => Math.abs(group.y - item.y) <= BASELINE_TOLERANCE_PT
    );
    if (existing) {
      existing.items.push(item);
      if (item.height > existing.height) {
        existing.height = item.height;
      }
    } else {
      lineGroups.push({
        y: item.y,
        height: item.height,
        items: [item],
      });
    }
  }

  lineGroups.sort((a, b) => b.y - a.y);

  const nonZeroHeights = lineGroups
    .map((group) => group.height)
    .filter((h) => h > 0);
  const medianLineHeight = computeMedian(nonZeroHeights);

  const chunks: string[] = [];
  for (let i = 0; i < lineGroups.length; i += 1) {
    const group = lineGroups[i];
    const lineText = joinLineItems(group.items);
    if (!lineText) {
      continue;
    }

    if (chunks.length > 0 && i > 0) {
      const prevGroup = lineGroups[i - 1];
      const verticalGap = prevGroup.y - group.y;
      const separator =
        verticalGap > PARAGRAPH_GAP_MULTIPLIER * medianLineHeight
          ? "\n\n"
          : "\n";
      chunks.push(separator);
    }

    chunks.push(lineText);
  }

  return normalizeExtractedText(chunks.join(""));
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items: PdfTextItemInput[] = [];

    for (const rawItem of content.items) {
      if ("str" in rawItem && typeof rawItem.str === "string") {
        items.push({
          str: rawItem.str,
          transform: Array.isArray(rawItem.transform)
            ? (rawItem.transform as number[])
            : undefined,
          width: typeof rawItem.width === "number" ? rawItem.width : undefined,
          height:
            typeof rawItem.height === "number" ? rawItem.height : undefined,
          hasEOL:
            typeof rawItem.hasEOL === "boolean" ? rawItem.hasEOL : undefined,
        });
      }
    }

    const pageText = reconstructPdfLinesFromItems(items);
    if (pageText.length > 0) {
      pageTexts.push(pageText);
    }
  }

  if (pageTexts.length > 0) {
    return normalizeExtractedText(pageTexts.join("\n\n"));
  }

  const { text } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
  return normalizeExtractedText(joined);
}

async function extractDocxText(bytes: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: bytes });
  const collapsedParagraphs = result.value
    .replace(/\r\n/g, "\n")
    .replace(/\n\n/g, "\n");
  return normalizeExtractedText(collapsedParagraphs);
}

export async function extractResumeText(
  bytes: Buffer,
  mimeType: string
): Promise<ExtractTextResult> {
  if (!isAllowedResumeMimeType(mimeType)) {
    return { ok: false, error: "Unsupported file type for text extraction." };
  }

  try {
    let text: string;

    if (mimeType === "application/pdf") {
      text = await extractPdfText(bytes);
    } else {
      text = await extractDocxText(bytes);
    }

    if (text.length === 0) {
      return {
        ok: false,
        error: "No readable text could be extracted from this file.",
      };
    }

    return { ok: true, text };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown extraction error";
    return { ok: false, error: `Text extraction failed: ${message}` };
  }
}
