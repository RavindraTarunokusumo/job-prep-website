"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  generateShortMessage,
  getApplicationMessageModelId,
  type ShortMessageType,
} from "@/lib/ai/application-message";
import {
  generateCoverLetter,
  getCoverLetterModelId,
  regenerateCoverLetterSection,
} from "@/lib/ai/cover-letter";
import { userFacingAiError } from "@/lib/ai/errors";
import { getProfileForUser, requireUser } from "@/lib/auth/session";
import { requireAiConsent } from "@/lib/legal/consent";
import { prisma } from "@/lib/prisma";
import { assertResumeHasContent } from "@/lib/resume/content";
import {
  composeContentFromSections,
  coverLetterSectionsSchema,
  draftTypeSchema,
  lengthSchema,
  parseCoverLetterGeneration,
  parseShortMessageGeneration,
  sectionKeySchema,
  toneSchema,
  type CoverLetterSections,
  type Length,
  type Tone,
} from "@/lib/validation/application-draft";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

const SHORT_MESSAGE_TYPES = new Set<string>([
  "recruiter_dm",
  "referral_request",
  "application_note",
]);

type ActionOkId = { ok: true; draftId: string };
type ActionOkDraftPayload = {
  ok: true;
  draftId: string;
  content: string;
  sections: CoverLetterSections;
  title?: string;
};
type ActionErr = { ok: false; error: string };
type ActionResult = ActionOkId | ActionErr;
type SectionRegenResult = ActionOkDraftPayload | ActionErr;

async function getOwnedResumeDocument(userId: string, documentId: string) {
  const doc = await prisma.resumeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.userId !== userId) {
    return null;
  }

  return doc;
}

async function getLatestParsedDocument(userId: string) {
  return prisma.resumeDocument.findFirst({
    where: {
      userId,
      status: "parsed",
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getOwnedJobDescription(userId: string, jobId: string) {
  const job = await prisma.jobDescription.findUnique({
    where: { id: jobId },
  });

  if (!job || job.userId !== userId) {
    return null;
  }

  return job;
}

async function getOwnedDraft(userId: string, draftId: string) {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft || draft.userId !== userId) {
    return null;
  }

  return draft;
}

function parseSectionsJson(value: unknown): CoverLetterSections | null {
  const parsed = coverLetterSectionsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function buildMeta(input: {
  tone: Tone;
  length: Length;
  model: string;
  targetRole: string;
  jobTitle?: string | null;
  company?: string | null;
  evidenceNotes?: string[];
}) {
  return {
    tone: input.tone,
    length: input.length,
    model: input.model,
    sourceProfileTargetRole: input.targetRole,
    jobTitle: input.jobTitle ?? null,
    company: input.company ?? null,
    evidenceNotes: input.evidenceNotes ?? [],
  };
}

export async function generateCoverLetterAction(form: {
  resumeDocumentId?: string;
  jobDescriptionId?: string;
  tone: string;
  length: string;
  supersedesId?: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const consent = await requireAiConsent(user.id);
  if (!consent.ok) return consent;

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  const toneResult = toneSchema.safeParse(form.tone);
  const lengthResult = lengthSchema.safeParse(form.length);
  if (!toneResult.success || !lengthResult.success) {
    return {
      ok: false,
      error: "Invalid tone or length. Choose valid options and try again.",
    };
  }
  const tone = toneResult.data;
  const length = lengthResult.data;

  const resumeDoc = form.resumeDocumentId
    ? await getOwnedResumeDocument(user.id, form.resumeDocumentId)
    : await getLatestParsedDocument(user.id);

  if (!resumeDoc || resumeDoc.status !== "parsed") {
    return {
      ok: false,
      error:
        "Upload and parse a resume first on the resume page before generating a cover letter.",
    };
  }

  let resumeText: string;
  try {
    resumeText = assertResumeHasContent(resumeDoc.rawText, resumeDoc.parsedData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume content is insufficient.";
    return { ok: false, error: message };
  }

  let jobTitle: string | null = null;
  let company: string | null = null;
  let jobText: string | null = null;
  let jobDescriptionId: string | null = null;

  if (form.jobDescriptionId) {
    const job = await getOwnedJobDescription(user.id, form.jobDescriptionId);
    if (!job) {
      return { ok: false, error: "Job description not found or access denied." };
    }
    jobDescriptionId = job.id;
    jobTitle = job.title;
    company = job.company;
    jobText = job.rawText;
  }

  let version = 1;
  let supersedesId: string | null = null;

  if (form.supersedesId) {
    const prior = await getOwnedDraft(user.id, form.supersedesId);
    if (!prior) {
      return {
        ok: false,
        error: "Prior draft not found or access denied.",
      };
    }
    if (prior.type !== "cover_letter") {
      return {
        ok: false,
        error: "Can only supersede a cover letter draft.",
      };
    }
    version = prior.version + 1;
    supersedesId = prior.id;
  }

  const draft = await prisma.applicationDraft.create({
    data: {
      userId: user.id,
      type: "cover_letter",
      title: "Generating…",
      status: "generating",
      tone,
      length,
      content: "",
      resumeDocumentId: resumeDoc.id,
      jobDescriptionId,
      supersedesId,
      version,
    },
  });

  try {
    const generation = await generateCoverLetter({
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      targetIndustry: profile.targetIndustry,
      skills: profile.skills,
      resumeText,
      jobTitle,
      company,
      jobText,
      tone,
      length,
    });

    const validated = parseCoverLetterGeneration(generation);
    const model = getCoverLetterModelId();
    const content = composeContentFromSections(validated.sections);

    await prisma.applicationDraft.update({
      where: { id: draft.id },
      data: {
        status: "draft",
        title: validated.title,
        content,
        sections: validated.sections,
        tone,
        length,
        model,
        meta: buildMeta({
          tone,
          length,
          model,
          targetRole: profile.targetRole,
          jobTitle,
          company,
          evidenceNotes: validated.evidenceNotes,
        }),
        errorMessage: null,
      },
    });

    revalidatePath("/cover-letter");
    revalidatePath("/dashboard");

    await trackEvent({
      userId: user.id,
      name: ANALYTICS_EVENTS.COVER_LETTER_GEN,
      props: { draftId: draft.id },
    });

    return { ok: true, draftId: draft.id };
  } catch (error) {
    const message = userFacingAiError(
      error,
      "Cover letter generation failed. Please try again."
    );

    await prisma.applicationDraft.update({
      where: { id: draft.id },
      data: {
        status: "failed",
        errorMessage: message,
      },
    });

    revalidatePath("/cover-letter");

    return { ok: false, error: message };
  }
}

export async function regenerateCoverLetterSectionAction(form: {
  draftId: string;
  section: "intro" | "body" | "closing";
  /** Prefer form controls; fall back to draft metadata. */
  tone?: string;
  length?: string;
}): Promise<SectionRegenResult> {
  const user = await requireUser();
  const consent = await requireAiConsent(user.id);
  if (!consent.ok) return consent;

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  const sectionResult = sectionKeySchema.safeParse(form.section);
  if (!sectionResult.success) {
    return { ok: false, error: "Invalid section. Use intro, body, or closing." };
  }
  const section = sectionResult.data;

  const draft = await getOwnedDraft(user.id, form.draftId);
  if (!draft) {
    return { ok: false, error: "Draft not found or access denied." };
  }

  if (draft.type !== "cover_letter") {
    return {
      ok: false,
      error: "Section regenerate is only available for cover letters.",
    };
  }

  const currentSections = parseSectionsJson(draft.sections);
  if (!currentSections) {
    return {
      ok: false,
      error:
        "This draft has no structured sections. Generate a full cover letter first.",
    };
  }

  const resumeDoc = draft.resumeDocumentId
    ? await getOwnedResumeDocument(user.id, draft.resumeDocumentId)
    : await getLatestParsedDocument(user.id);

  if (!resumeDoc || resumeDoc.status !== "parsed") {
    return {
      ok: false,
      error:
        "Upload and parse a resume first on the resume page before regenerating.",
    };
  }

  let resumeText: string;
  try {
    resumeText = assertResumeHasContent(resumeDoc.rawText, resumeDoc.parsedData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume content is insufficient.";
    return { ok: false, error: message };
  }

  let jobTitle: string | null = null;
  let company: string | null = null;
  let jobText: string | null = null;

  if (draft.jobDescriptionId) {
    const job = await getOwnedJobDescription(user.id, draft.jobDescriptionId);
    if (job) {
      jobTitle = job.title;
      company = job.company;
      jobText = job.rawText;
    }
  }

  const toneResult = toneSchema.safeParse(
    form.tone ?? draft.tone ?? "professional"
  );
  const lengthResult = lengthSchema.safeParse(
    form.length ?? draft.length ?? "medium"
  );
  const tone = toneResult.success ? toneResult.data : "professional";
  const length = lengthResult.success ? lengthResult.data : "medium";

  try {
    const nextSections = await regenerateCoverLetterSection({
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      targetIndustry: profile.targetIndustry,
      skills: profile.skills,
      resumeText,
      jobTitle,
      company,
      jobText,
      tone,
      length,
      section,
      currentSections,
    });

    const validatedSections = coverLetterSectionsSchema.parse(nextSections);
    const content = composeContentFromSections(validatedSections);
    const model = getCoverLetterModelId();

    await prisma.applicationDraft.update({
      where: { id: draft.id },
      data: {
        status: "draft",
        sections: validatedSections,
        content,
        tone,
        length,
        model,
        errorMessage: null,
      },
    });

    revalidatePath("/cover-letter");
    revalidatePath("/dashboard");

    return {
      ok: true,
      draftId: draft.id,
      content,
      sections: validatedSections,
    };
  } catch (error) {
    const message = userFacingAiError(
      error,
      "Section regeneration failed. Please try again."
    );

    return { ok: false, error: message };
  }
}

export async function generateShortMessageAction(form: {
  messageType: "recruiter_dm" | "referral_request" | "application_note";
  resumeDocumentId?: string;
  jobDescriptionId?: string;
  tone: string;
  supersedesId?: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const consent = await requireAiConsent(user.id);
  if (!consent.ok) return consent;

  const profile = await getProfileForUser(user.id);
  if (!profile?.onboardingCompletedAt) {
    return {
      ok: false,
      error: "Complete onboarding first so we know your target role.",
    };
  }

  const typeResult = draftTypeSchema.safeParse(form.messageType);
  if (!typeResult.success || !SHORT_MESSAGE_TYPES.has(typeResult.data)) {
    return {
      ok: false,
      error:
        "Invalid message type. Choose recruiter DM, referral request, or application note.",
    };
  }
  const messageType = typeResult.data as ShortMessageType;

  const toneResult = toneSchema.safeParse(form.tone);
  if (!toneResult.success) {
    return {
      ok: false,
      error: "Invalid tone. Choose a valid option and try again.",
    };
  }
  const tone = toneResult.data;

  const resumeDoc = form.resumeDocumentId
    ? await getOwnedResumeDocument(user.id, form.resumeDocumentId)
    : await getLatestParsedDocument(user.id);

  if (!resumeDoc || resumeDoc.status !== "parsed") {
    return {
      ok: false,
      error:
        "Upload and parse a resume first on the resume page before generating a message.",
    };
  }

  let resumeText: string;
  try {
    resumeText = assertResumeHasContent(resumeDoc.rawText, resumeDoc.parsedData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume content is insufficient.";
    return { ok: false, error: message };
  }

  let jobTitle: string | null = null;
  let company: string | null = null;
  let jobText: string | null = null;
  let jobDescriptionId: string | null = null;

  if (form.jobDescriptionId) {
    const job = await getOwnedJobDescription(user.id, form.jobDescriptionId);
    if (!job) {
      return { ok: false, error: "Job description not found or access denied." };
    }
    jobDescriptionId = job.id;
    jobTitle = job.title;
    company = job.company;
    jobText = job.rawText;
  }

  let version = 1;
  let supersedesId: string | null = null;

  if (form.supersedesId) {
    const prior = await getOwnedDraft(user.id, form.supersedesId);
    if (!prior) {
      return {
        ok: false,
        error: "Prior draft not found or access denied.",
      };
    }
    if (prior.type !== messageType) {
      return {
        ok: false,
        error: "Can only supersede a draft of the same message type.",
      };
    }
    version = prior.version + 1;
    supersedesId = prior.id;
  }

  const draft = await prisma.applicationDraft.create({
    data: {
      userId: user.id,
      type: messageType,
      title: "Generating…",
      status: "generating",
      tone,
      length: null,
      content: "",
      resumeDocumentId: resumeDoc.id,
      jobDescriptionId,
      supersedesId,
      version,
    },
  });

  try {
    const generation = await generateShortMessage({
      messageType,
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      targetIndustry: profile.targetIndustry,
      skills: profile.skills,
      resumeText,
      jobTitle,
      company,
      jobText,
      tone,
    });

    const validated = parseShortMessageGeneration(generation);
    const model = getApplicationMessageModelId();

    await prisma.applicationDraft.update({
      where: { id: draft.id },
      data: {
        status: "draft",
        title: validated.title,
        content: validated.content,
        tone,
        model,
        meta: {
          tone,
          model,
          messageType,
          sourceProfileTargetRole: profile.targetRole,
          jobTitle,
          company,
          evidenceNotes: validated.evidenceNotes ?? [],
        },
        errorMessage: null,
      },
    });

    revalidatePath("/cover-letter");
    revalidatePath("/dashboard");

    return { ok: true, draftId: draft.id };
  } catch (error) {
    const message = userFacingAiError(
      error,
      "Short message generation failed. Please try again."
    );

    await prisma.applicationDraft.update({
      where: { id: draft.id },
      data: {
        status: "failed",
        errorMessage: message,
      },
    });

    revalidatePath("/cover-letter");

    return { ok: false, error: message };
  }
}

export async function saveApplicationDraftAction(form: {
  draftId: string;
  title?: string;
  content: string;
  /** Pass sections to keep structured panels; null clears them; omit leaves DB value. */
  sections?: { intro: string; body: string; closing: string } | null;
}): Promise<{ ok: true } | ActionErr> {
  const user = await requireUser();

  const draft = await getOwnedDraft(user.id, form.draftId);
  if (!draft) {
    return { ok: false, error: "Draft not found or access denied." };
  }

  const content = form.content?.trim();
  if (!content) {
    return { ok: false, error: "Draft content cannot be empty." };
  }

  let sections: CoverLetterSections | undefined;
  if (form.sections != null) {
    const parsed = coverLetterSectionsSchema.safeParse(form.sections);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Sections must include non-empty intro, body, and closing.",
      };
    }
    sections = parsed.data;
  }

  const title =
    form.title !== undefined ? form.title.trim() || draft.title : undefined;

  // Prefer the client-provided full content (user edits win). Sections are
  // stored as structured metadata only when the client still has them in sync.
  await prisma.applicationDraft.update({
    where: { id: draft.id },
    data: {
      content,
      ...(title !== undefined ? { title } : {}),
      ...(form.sections === null
        ? { sections: Prisma.JsonNull }
        : sections
          ? { sections }
          : {}),
      status: draft.status === "failed" ? "draft" : draft.status,
      errorMessage: null,
    },
  });

  revalidatePath("/cover-letter");
  revalidatePath("/dashboard");

  return { ok: true };
}
