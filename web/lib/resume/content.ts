const MIN_RESUME_CONTENT_LENGTH = 80;

export function getResumeTextContent(
  rawText: string | null | undefined,
  parsedData: unknown
): string | null {
  const trimmed = rawText?.trim();
  if (trimmed) {
    return trimmed;
  }

  if (parsedData != null) {
    const json = JSON.stringify(parsedData);
    if (json && json !== "{}" && json !== "null") {
      return json;
    }
  }

  return null;
}

export function assertResumeHasContent(
  rawText: string | null | undefined,
  parsedData: unknown
): string {
  const content = getResumeTextContent(rawText, parsedData);
  if (!content) {
    throw new Error(
      "Resume has no extractable text. Re-upload your CV or complete the parsed fields on the review page."
    );
  }

  if (content.length < MIN_RESUME_CONTENT_LENGTH) {
    throw new Error(
      "Resume text is too short for a meaningful review. Re-upload a fuller CV or add more detail in the review form."
    );
  }

  return content;
}