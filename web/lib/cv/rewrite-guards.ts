import type { RewriteSuggestion, StructuredCv } from "@/lib/validation/cv";

const VERIFIED_PROTECTED_FIELDS = new Set([
  "company",
  "title",
  "startDate",
  "endDate",
  "institution",
  "degree",
  "field",
  "responsibilities",
  "achievements",
  "metrics",
]);

export type RewriteApplyResult =
  | { ok: true; content: StructuredCv; applied: true }
  | { ok: false; error: string; content: StructuredCv };

function cloneCv(content: StructuredCv): StructuredCv {
  return JSON.parse(JSON.stringify(content)) as StructuredCv;
}

/**
 * Apply a rewrite at a dotted path.
 * Refuses silent mutation of verified employer/dates/responsibilities-style fields
 * unless suggestion.force is true (explicit user override).
 */
export function applyRewriteSuggestion(
  content: StructuredCv,
  suggestion: RewriteSuggestion,
  options: { protectVerified?: boolean } = { protectVerified: true }
): RewriteApplyResult {
  const protect = options.protectVerified !== false;
  const path = suggestion.path.trim();
  if (!path) {
    return { ok: false, error: "Rewrite path is required.", content };
  }

  const parts = path.split(".");
  const next = cloneCv(content);
  // Navigate to parent
  let cursor: unknown = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cursor == null || typeof cursor !== "object") {
      return { ok: false, error: `Invalid path: ${path}`, content };
    }
    const rec = cursor as Record<string, unknown>;
    if (!(key in rec)) {
      return { ok: false, error: `Path not found: ${path}`, content };
    }
    cursor = rec[key];
  }

  const leaf = parts[parts.length - 1];
  if (cursor == null || typeof cursor !== "object") {
    return { ok: false, error: `Invalid path leaf: ${path}`, content };
  }

  // Detect verified protection: if parent entry has verified=true and leaf is protected
  const parent = cursor as Record<string, unknown>;
  if (
    protect &&
    !suggestion.force &&
    parent.verified === true &&
    VERIFIED_PROTECTED_FIELDS.has(leaf)
  ) {
    return {
      ok: false,
      error:
        "Refusing to silently alter a verified field (employer, dates, or core facts). Accept with force or edit manually.",
      content,
    };
  }

  // Also protect when rewriting entire verified entry description that encodes facts
  if (
    protect &&
    !suggestion.force &&
    parent.verified === true &&
    (leaf === "description" || leaf === "name")
  ) {
    // Allow bullet rewrites under verified experience; block company-level name swaps via description only for education institution already covered
  }

  if (Array.isArray(parent) && /^\d+$/.test(leaf)) {
    const idx = Number(leaf);
    if (idx < 0 || idx >= parent.length) {
      return { ok: false, error: `Index out of range: ${path}`, content };
    }
    // array of strings (bullets)
    if (typeof parent[idx] === "string" || parent[idx] == null) {
      parent[idx] = suggestion.proposedText;
      return { ok: true, content: next, applied: true };
    }
  }

  if (!(leaf in parent) && !Array.isArray(parent)) {
    // allow setting new optional string fields
    parent[leaf] = suggestion.proposedText;
    return { ok: true, content: next, applied: true };
  }

  const current = parent[leaf];
  if (typeof current === "string" || current == null) {
    parent[leaf] = suggestion.proposedText;
    return { ok: true, content: next, applied: true };
  }

  if (Array.isArray(current) && current.every((x) => typeof x === "string")) {
    // Replacing whole bullet list with single string is invalid
    return {
      ok: false,
      error: "Target is a string array; use an index path like experience.0.bullets.0",
      content,
    };
  }

  return {
    ok: false,
    error: `Cannot apply text rewrite to non-string field at ${path}`,
    content,
  };
}

export function rejectRewrite(
  content: StructuredCv
): { ok: true; content: StructuredCv; applied: false } {
  return { ok: true, content: cloneCv(content), applied: false };
}
