import {
  defaultSectionConfig,
  emptyStructuredCv,
  parseStructuredCv,
  type CvSectionConfig,
  type StructuredCv,
} from "@/lib/validation/cv";

export type CvVersionSnapshot = {
  id: string;
  name: string;
  content: StructuredCv;
  sectionConfig: CvSectionConfig;
  sourceFingerprint: string | null;
  isCurrent: boolean;
  jobDescriptionId?: string | null;
  jobApplicationId?: string | null;
  createdAt?: string;
};

export function duplicateVersionContent(content: StructuredCv): StructuredCv {
  return parseStructuredCv(JSON.parse(JSON.stringify(content)));
}

export function isVersionOutdated(
  versionFingerprint: string | null | undefined,
  currentFingerprint: string | null | undefined
): boolean {
  if (!versionFingerprint || !currentFingerprint) return false;
  return versionFingerprint !== currentFingerprint;
}

/** Stable fingerprint from profile + confirmed evidence markers. */
export function buildSourceFingerprint(input: {
  profileUpdatedAt?: string | Date | null;
  evidenceUpdatedAtMax?: string | Date | null;
  confirmedEvidenceCount?: number;
}): string {
  const p =
    input.profileUpdatedAt == null
      ? ""
      : new Date(input.profileUpdatedAt).toISOString();
  const e =
    input.evidenceUpdatedAtMax == null
      ? ""
      : new Date(input.evidenceUpdatedAtMax).toISOString();
  const n = input.confirmedEvidenceCount ?? 0;
  return `p:${p}|e:${e}|n:${n}`;
}

export type CvFieldDiff = {
  path: string;
  before: string;
  after: string;
};

export function compareCvVersions(
  a: StructuredCv,
  b: StructuredCv
): CvFieldDiff[] {
  const diffs: CvFieldDiff[] = [];
  const sa = JSON.stringify(a, null, 0);
  const sb = JSON.stringify(b, null, 0);
  if (sa === sb) return diffs;

  // Contact fields
  const contactKeys = [
    "name",
    "email",
    "phone",
    "location",
    "linkedin",
    "website",
  ] as const;
  for (const k of contactKeys) {
    const before = a.contact?.[k] ?? "";
    const after = b.contact?.[k] ?? "";
    if (before !== after) {
      diffs.push({ path: `contact.${k}`, before, after });
    }
  }

  if ((a.summary ?? "") !== (b.summary ?? "")) {
    diffs.push({
      path: "summary",
      before: a.summary ?? "",
      after: b.summary ?? "",
    });
  }

  const maxExp = Math.max(a.experience.length, b.experience.length);
  for (let i = 0; i < maxExp; i++) {
    const ea = a.experience[i];
    const eb = b.experience[i];
    if (JSON.stringify(ea ?? null) !== JSON.stringify(eb ?? null)) {
      diffs.push({
        path: `experience.${i}`,
        before: ea ? `${ea.title ?? ""} @ ${ea.company ?? ""}` : "(missing)",
        after: eb ? `${eb.title ?? ""} @ ${eb.company ?? ""}` : "(missing)",
      });
    }
  }

  if (JSON.stringify(a.skills) !== JSON.stringify(b.skills)) {
    diffs.push({
      path: "skills",
      before: a.skills.join(", "),
      after: b.skills.join(", "),
    });
  }

  if (diffs.length === 0 && sa !== sb) {
    diffs.push({
      path: "content",
      before: "(structured differs)",
      after: "(structured differs)",
    });
  }

  return diffs;
}

export function createInitialVersionPayload(input: {
  name: string;
  content?: StructuredCv;
  sectionConfig?: CvSectionConfig;
  sourceFingerprint?: string | null;
}): Omit<CvVersionSnapshot, "id" | "isCurrent"> {
  return {
    name: input.name,
    content: input.content
      ? duplicateVersionContent(input.content)
      : emptyStructuredCv(),
    sectionConfig: input.sectionConfig ?? defaultSectionConfig(),
    sourceFingerprint: input.sourceFingerprint ?? null,
  };
}

/**
 * Restore semantics: mark target as current among a list of version ids.
 * Pure helper for tests / action logic.
 */
export function selectCurrentVersionId(
  versionIds: string[],
  restoreId: string
): { ok: true; currentId: string } | { ok: false; error: string } {
  if (!versionIds.includes(restoreId)) {
    return { ok: false, error: "Version not found on document." };
  }
  return { ok: true, currentId: restoreId };
}
