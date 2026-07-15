import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { isAllowedResumeMimeType } from "@/lib/validation/resume";

export type ExtractTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
  return normalizeExtractedText(joined);
}

async function extractDocxText(bytes: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: bytes });
  return normalizeExtractedText(result.value);
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