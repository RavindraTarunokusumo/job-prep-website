"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireUser, getProfileForUser } from "@/lib/auth/session";
import { buildPdfBytes, isPdfBytes } from "@/lib/cv/pdf";
import { applyRewriteSuggestion } from "@/lib/cv/rewrite-guards";
import {
  buildSourceFingerprint,
  compareCvVersions,
  createInitialVersionPayload,
  duplicateVersionContent,
  isVersionOutdated,
  selectCurrentVersionId,
} from "@/lib/cv/versioning";
import { prisma } from "@/lib/prisma";
import {
  defaultSectionConfig,
  emptyStructuredCv,
  parseStructuredCv,
  rewriteSuggestionSchema,
  safeParseStructuredCv,
  type CvSectionConfig,
  type StructuredCv,
  cvSectionConfigSchema,
} from "@/lib/validation/cv";

type ActionErr = { ok: false; error: string };

export type CvDocumentListItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  currentVersionId: string | null;
  currentVersionName: string | null;
  outdated: boolean;
};

export type CvVersionListItem = {
  id: string;
  documentId: string;
  name: string;
  isCurrent: boolean;
  sourceFingerprint: string | null;
  jobDescriptionId: string | null;
  jobApplicationId: string | null;
  outdated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CvVersionDetail = CvVersionListItem & {
  content: StructuredCv;
  sectionConfig: CvSectionConfig;
};

async function currentFingerprint(userId: string): Promise<string> {
  const [profile, evidence] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { updatedAt: true },
    }),
    prisma.careerEvidence.findMany({
      where: { userId, verification: "confirmed" },
      select: { updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1,
    }),
  ]);
  const count = await prisma.careerEvidence.count({
    where: { userId, verification: "confirmed" },
  });
  return buildSourceFingerprint({
    profileUpdatedAt: profile?.updatedAt ?? null,
    evidenceUpdatedAtMax: evidence[0]?.updatedAt ?? null,
    confirmedEvidenceCount: count,
  });
}

async function ownedDocument(userId: string, id: string) {
  const row = await prisma.cvDocument.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return row;
}

async function ownedVersion(userId: string, id: string) {
  const row = await prisma.cvVersion.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return row;
}

function parseSectionConfig(value: unknown): CvSectionConfig {
  const p = cvSectionConfigSchema.safeParse(value);
  return p.success ? p.data : defaultSectionConfig();
}

export async function listCvDocumentsAction(): Promise<
  { ok: true; documents: CvDocumentListItem[] } | ActionErr
> {
  try {
    const user = await requireUser();
    const fp = await currentFingerprint(user.id);
    const docs = await prisma.cvDocument.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });
    return {
      ok: true,
      documents: docs.map((d) => {
        const cur = d.versions[0] ?? null;
        return {
          id: d.id,
          title: d.title,
          status: d.status,
          updatedAt: d.updatedAt.toISOString(),
          currentVersionId: cur?.id ?? null,
          currentVersionName: cur?.name ?? null,
          outdated: cur
            ? isVersionOutdated(cur.sourceFingerprint, fp)
            : false,
        };
      }),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to list CV documents",
    };
  }
}

export async function createCvDocumentAction(input: {
  title?: string;
  fromProfile?: boolean;
}): Promise<{ ok: true; documentId: string; versionId: string } | ActionErr> {
  try {
    const user = await requireUser();
    const title = input.title?.trim() || "My CV";
    let content = emptyStructuredCv();

    if (input.fromProfile !== false) {
      const [profile, evidence, resume] = await Promise.all([
        getProfileForUser(user.id),
        prisma.careerEvidence.findMany({
          where: { userId: user.id, verification: "confirmed" },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        prisma.resumeDocument.findFirst({
          where: { userId: user.id, status: "parsed" },
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      if (resume?.parsedData) {
        const parsed = safeParseStructuredCv(resume.parsedData);
        if (parsed.success) {
          content = parsed.data;
        } else {
          // Best-effort map common parsed resume shape
          const raw = resume.parsedData as Record<string, unknown>;
          const mapped = safeParseStructuredCv({
            contact: raw.contact ?? {},
            summary: raw.summary,
            experience: raw.experience ?? [],
            education: raw.education ?? [],
            skills: raw.skills ?? [],
            projects: raw.projects ?? [],
            certifications: raw.certifications ?? [],
            languages: raw.languages ?? [],
          });
          if (mapped.success) content = mapped.data;
        }
      }

      if (profile) {
        content = {
          ...content,
          contact: {
            ...content.contact,
            // do not invent name/email if absent
          },
          skills:
            content.skills.length > 0
              ? content.skills
              : profile.skills ?? [],
          certifications:
            content.certifications.length > 0
              ? content.certifications
              : profile.certifications ?? [],
          summary:
            content.summary ||
            (profile.targetRole
              ? `Target role: ${profile.targetRole}${
                  profile.targetIndustry
                    ? ` in ${profile.targetIndustry}`
                    : ""
                }.`
              : content.summary),
        };
      }

      // Merge confirmed evidence into experience when empty
      if (content.experience.length === 0 && evidence.length > 0) {
        content = {
          ...content,
          experience: evidence
            .filter((e) => e.sourceType === "employment" || e.sourceType === "freelance")
            .map((e) => ({
              company: e.organization ?? undefined,
              title: e.roleTitle ?? e.title,
              startDate: e.startDate ?? undefined,
              endDate: e.endDate ?? undefined,
              description: [e.responsibilities, e.achievements, e.metrics]
                .filter(Boolean)
                .join("\n"),
              verified: true,
            })),
        };
      }
    }

    const fp = await currentFingerprint(user.id);
    const initial = createInitialVersionPayload({
      name: "v1",
      content,
      sourceFingerprint: fp,
    });

    const doc = await prisma.cvDocument.create({
      data: {
        userId: user.id,
        title,
        status: "active",
        versions: {
          create: {
            userId: user.id,
            name: initial.name,
            content: initial.content as unknown as Prisma.InputJsonValue,
            sectionConfig:
              initial.sectionConfig as unknown as Prisma.InputJsonValue,
            sourceFingerprint: initial.sourceFingerprint,
            isCurrent: true,
          },
        },
      },
      include: { versions: true },
    });

    revalidatePath("/cv");
    return {
      ok: true,
      documentId: doc.id,
      versionId: doc.versions[0].id,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create CV",
    };
  }
}

export async function listCvVersionsAction(
  documentId: string
): Promise<{ ok: true; versions: CvVersionListItem[] } | ActionErr> {
  try {
    const user = await requireUser();
    const doc = await ownedDocument(user.id, documentId);
    if (!doc) return { ok: false, error: "CV document not found." };
    const fp = await currentFingerprint(user.id);
    const versions = await prisma.cvVersion.findMany({
      where: { documentId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return {
      ok: true,
      versions: versions.map((v) => ({
        id: v.id,
        documentId: v.documentId,
        name: v.name,
        isCurrent: v.isCurrent,
        sourceFingerprint: v.sourceFingerprint,
        jobDescriptionId: v.jobDescriptionId,
        jobApplicationId: v.jobApplicationId,
        outdated: isVersionOutdated(v.sourceFingerprint, fp),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      })),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to list versions",
    };
  }
}

export async function getCvVersionAction(
  versionId: string
): Promise<{ ok: true; version: CvVersionDetail } | ActionErr> {
  try {
    const user = await requireUser();
    const v = await ownedVersion(user.id, versionId);
    if (!v) return { ok: false, error: "Version not found." };
    const fp = await currentFingerprint(user.id);
    const contentParsed = safeParseStructuredCv(v.content);
    if (!contentParsed.success) {
      return { ok: false, error: "Stored CV content is invalid." };
    }
    return {
      ok: true,
      version: {
        id: v.id,
        documentId: v.documentId,
        name: v.name,
        isCurrent: v.isCurrent,
        sourceFingerprint: v.sourceFingerprint,
        jobDescriptionId: v.jobDescriptionId,
        jobApplicationId: v.jobApplicationId,
        outdated: isVersionOutdated(v.sourceFingerprint, fp),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        content: contentParsed.data,
        sectionConfig: parseSectionConfig(v.sectionConfig),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load version",
    };
  }
}

export async function saveCvVersionAction(input: {
  documentId: string;
  name: string;
  content: unknown;
  sectionConfig?: unknown;
  jobDescriptionId?: string | null;
  jobApplicationId?: string | null;
  setCurrent?: boolean;
}): Promise<{ ok: true; versionId: string } | ActionErr> {
  try {
    const user = await requireUser();
    const doc = await ownedDocument(user.id, input.documentId);
    if (!doc) return { ok: false, error: "CV document not found." };
    const content = parseStructuredCv(input.content);
    const sectionConfig = input.sectionConfig
      ? parseSectionConfig(input.sectionConfig)
      : defaultSectionConfig();
    const fp = await currentFingerprint(user.id);
    const setCurrent = input.setCurrent !== false;

    const version = await prisma.$transaction(async (tx) => {
      if (setCurrent) {
        await tx.cvVersion.updateMany({
          where: { documentId: doc.id, userId: user.id },
          data: { isCurrent: false },
        });
      }
      const created = await tx.cvVersion.create({
        data: {
          documentId: doc.id,
          userId: user.id,
          name: input.name.trim() || "Version",
          content: content as unknown as Prisma.InputJsonValue,
          sectionConfig: sectionConfig as unknown as Prisma.InputJsonValue,
          jobDescriptionId: input.jobDescriptionId ?? null,
          jobApplicationId: input.jobApplicationId ?? null,
          sourceFingerprint: fp,
          isCurrent: setCurrent,
        },
      });
      await tx.cvDocument.update({
        where: { id: doc.id },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    revalidatePath("/cv");
    return { ok: true, versionId: version.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save version",
    };
  }
}

export async function duplicateCvVersionAction(
  versionId: string,
  newName?: string
): Promise<{ ok: true; versionId: string } | ActionErr> {
  try {
    const user = await requireUser();
    const v = await ownedVersion(user.id, versionId);
    if (!v) return { ok: false, error: "Version not found." };
    const content = parseStructuredCv(v.content);
    const cloned = duplicateVersionContent(content);
    const fp = await currentFingerprint(user.id);

    const created = await prisma.$transaction(async (tx) => {
      await tx.cvVersion.updateMany({
        where: { documentId: v.documentId, userId: user.id },
        data: { isCurrent: false },
      });
      return tx.cvVersion.create({
        data: {
          documentId: v.documentId,
          userId: user.id,
          name: newName?.trim() || `${v.name} (copy)`,
          content: cloned as unknown as Prisma.InputJsonValue,
          sectionConfig: v.sectionConfig as Prisma.InputJsonValue,
          jobDescriptionId: v.jobDescriptionId,
          jobApplicationId: v.jobApplicationId,
          sourceFingerprint: fp,
          isCurrent: true,
        },
      });
    });

    revalidatePath("/cv");
    return { ok: true, versionId: created.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to duplicate version",
    };
  }
}

export async function restoreCvVersionAction(
  versionId: string
): Promise<{ ok: true; versionId: string } | ActionErr> {
  try {
    const user = await requireUser();
    const v = await ownedVersion(user.id, versionId);
    if (!v) return { ok: false, error: "Version not found." };
    const siblings = await prisma.cvVersion.findMany({
      where: { documentId: v.documentId, userId: user.id },
      select: { id: true },
    });
    const pick = selectCurrentVersionId(
      siblings.map((s) => s.id),
      versionId
    );
    if (!pick.ok) return { ok: false, error: pick.error };

    await prisma.$transaction([
      prisma.cvVersion.updateMany({
        where: { documentId: v.documentId, userId: user.id },
        data: { isCurrent: false },
      }),
      prisma.cvVersion.update({
        where: { id: versionId },
        data: { isCurrent: true },
      }),
    ]);

    revalidatePath("/cv");
    return { ok: true, versionId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to restore version",
    };
  }
}

export async function applyCvRewriteAction(input: {
  versionId: string;
  suggestion: unknown;
  persist?: boolean;
}): Promise<
  | { ok: true; content: StructuredCv; versionId: string }
  | ActionErr
> {
  try {
    const user = await requireUser();
    const v = await ownedVersion(user.id, versionIdOrThrow(input.versionId));
    if (!v) return { ok: false, error: "Version not found." };
    const suggestion = rewriteSuggestionSchema.safeParse(input.suggestion);
    if (!suggestion.success) {
      return { ok: false, error: "Invalid rewrite suggestion." };
    }
    const content = parseStructuredCv(v.content);
    const result = applyRewriteSuggestion(content, suggestion.data, {
      protectVerified: true,
    });
    if (!result.ok) return { ok: false, error: result.error };

    if (input.persist !== false) {
      await prisma.cvVersion.update({
        where: { id: v.id },
        data: {
          content: result.content as unknown as Prisma.InputJsonValue,
        },
      });
    }

    revalidatePath("/cv");
    return { ok: true, content: result.content, versionId: v.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to apply rewrite",
    };
  }
}

function versionIdOrThrow(id: string): string {
  return id;
}

export async function compareCvVersionsAction(
  aId: string,
  bId: string
): Promise<
  | {
      ok: true;
      diffs: ReturnType<typeof compareCvVersions>;
    }
  | ActionErr
> {
  try {
    const user = await requireUser();
    const [a, b] = await Promise.all([
      ownedVersion(user.id, aId),
      ownedVersion(user.id, bId),
    ]);
    if (!a || !b) return { ok: false, error: "Version not found." };
    if (a.documentId !== b.documentId) {
      return { ok: false, error: "Versions belong to different documents." };
    }
    return {
      ok: true,
      diffs: compareCvVersions(
        parseStructuredCv(a.content),
        parseStructuredCv(b.content)
      ),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to compare versions",
    };
  }
}

export async function exportCvPdfAction(
  versionId: string
): Promise<
  | { ok: true; base64: string; filename: string; byteLength: number }
  | ActionErr
> {
  try {
    const user = await requireUser();
    const v = await ownedVersion(user.id, versionId);
    if (!v) return { ok: false, error: "Version not found." };
    const content = parseStructuredCv(v.content);
    const sectionConfig = parseSectionConfig(v.sectionConfig);
    const bytes = buildPdfBytes(content, sectionConfig);
    if (!isPdfBytes(bytes) || bytes.length === 0) {
      return { ok: false, error: "PDF export produced empty output." };
    }
    const base64 = Buffer.from(bytes).toString("base64");
    const safeName = v.name.replace(/[^\w.-]+/g, "_") || "cv";
    return {
      ok: true,
      base64,
      filename: `${safeName}.pdf`,
      byteLength: bytes.length,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "PDF export failed",
    };
  }
}
