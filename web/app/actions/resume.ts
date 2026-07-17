"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { upsertUserFromAuth } from "@/lib/auth/upsert-user";
import { extractResumeText } from "@/lib/resume/extract-text";
import { parseResumeStructure } from "@/lib/resume/parse-structure";
import {
  isGlinerStructureEnabled,
  parseResumeWithGliner,
} from "@/lib/resume/parse-with-gliner";
import {
  buildResumeStoragePath,
  downloadResumeFile,
  uploadResumeFile,
} from "@/lib/storage/resumes";
import { hasConsent, recordConsent } from "@/lib/legal/consent";
import {
  parseResumeFormData,
  type ParsedResume,
  validateResumeUpload,
} from "@/lib/validation/resume";
import type { ResumeDocument } from "@prisma/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

export type ResumeActionState = {
  error?: string;
};

export type ResumeDocumentSummary = {
  id: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  status: string;
  parseError: string | null;
  createdAt: string;
  updatedAt: string;
};

function toSummary(doc: ResumeDocument): ResumeDocumentSummary {
  return {
    id: doc.id,
    originalFilename: doc.originalFilename,
    mimeType: doc.mimeType,
    byteSize: doc.byteSize,
    status: doc.status,
    parseError: doc.parseError,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function getOwnedDocument(userId: string, documentId: string) {
  const doc = await prisma.resumeDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.userId !== userId) {
    return null;
  }

  return doc;
}

export async function listResumeDocuments(): Promise<ResumeDocumentSummary[]> {
  const user = await requireUser();
  const docs = await prisma.resumeDocument.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return docs.map(toSummary);
}

export async function getResumeDocument(documentId: string) {
  const user = await requireUser();
  const doc = await getOwnedDocument(user.id, documentId);
  if (!doc) {
    return null;
  }

  return {
    ...toSummary(doc),
    rawText: doc.rawText,
    parsedData: (doc.parsedData as ParsedResume | null) ?? null,
  };
}

async function processResumeDocument(documentId: string, userId: string) {
  const doc = await getOwnedDocument(userId, documentId);
  if (!doc) {
    return;
  }

  await prisma.resumeDocument.update({
    where: { id: documentId },
    data: { status: "extracting", parseError: null },
  });

  try {
    const bytes = await downloadResumeFile(doc.storagePath);
    const extracted = await extractResumeText(bytes, doc.mimeType);

    if (!extracted.ok) {
      await prisma.resumeDocument.update({
        where: { id: documentId },
        data: {
          status: "failed",
          parseError: extracted.error,
        },
      });
      return;
    }

    let parsedData = parseResumeStructure(extracted.text);
    let structureNote: string | null = null;

    // Optional GLiNER2 structure step (experimental). Falls back to heuristics.
    if (isGlinerStructureEnabled()) {
      const gliner = await parseResumeWithGliner(extracted.text);
      if (gliner.ok) {
        parsedData = gliner.data;
        structureNote = null;
      } else {
        structureNote = `GLiNER structure failed (${gliner.error}); used heuristic parser.`;
      }
    }

    await prisma.resumeDocument.update({
      where: { id: documentId },
      data: {
        status: "parsed",
        rawText: extracted.text,
        parsedData,
        parseError: structureNote,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume processing failed.";
    await prisma.resumeDocument.update({
      where: { id: documentId },
      data: {
        status: "failed",
        parseError: message,
      },
    });
  }
}

export async function uploadResume(
  _prevState: ResumeActionState,
  formData: FormData
): Promise<ResumeActionState> {
  const user = await requireUser();
  await upsertUserFromAuth(user);

  const consentChecked = formData.get("uploadConsent") === "on";
  if (consentChecked) {
    await recordConsent(user.id, "upload");
  } else if (!(await hasConsent(user.id, "upload"))) {
    return {
      error:
        "Confirm the upload consent checkbox before uploading your CV.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Please select a PDF or Word document to upload." };
  }

  const validation = validateResumeUpload({
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (!validation.ok) {
    return { error: validation.error };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let documentId: string;
  try {
    const created = await prisma.resumeDocument.create({
      data: {
        userId: user.id,
        originalFilename: file.name,
        mimeType: file.type,
        byteSize: file.size,
        storagePath: "",
        status: "uploaded",
      },
    });
    documentId = created.id;

    const storagePath = buildResumeStoragePath(user.id, documentId, file.name);
    await uploadResumeFile(storagePath, bytes, file.type);

    await prisma.resumeDocument.update({
      where: { id: documentId },
      data: { storagePath },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed. Please try again.";
    return { error: message };
  }

  await processResumeDocument(documentId, user.id);

  await trackEvent({
    userId: user.id,
    name: ANALYTICS_EVENTS.CV_UPLOAD,
    props: {
      documentId,
      mimeType: file.type,
      byteSize: file.size,
    },
  });

  redirect(`/resume/review?id=${documentId}`);
}

export async function saveParsedResume(
  _prevState: ResumeActionState,
  formData: FormData
): Promise<ResumeActionState> {
  const user = await requireUser();
  const documentId = String(formData.get("documentId") ?? "");

  if (!documentId) {
    return { error: "Missing document identifier." };
  }

  const doc = await getOwnedDocument(user.id, documentId);
  if (!doc) {
    return { error: "Resume not found or access denied." };
  }

  let parsedData: ParsedResume;
  try {
    parsedData = parseResumeFormData(formData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid resume data.";
    return { error: message };
  }

  await prisma.resumeDocument.update({
    where: { id: documentId },
    data: {
      parsedData,
      status: doc.status === "failed" ? "parsed" : doc.status,
      parseError: null,
    },
  });

  redirect("/resume");
}

export async function retryResumeProcessing(
  documentId: string
): Promise<ResumeActionState> {
  const user = await requireUser();
  const doc = await getOwnedDocument(user.id, documentId);

  if (!doc) {
    return { error: "Resume not found or access denied." };
  }

  if (!doc.storagePath) {
    return { error: "Stored file is missing for this document." };
  }

  await processResumeDocument(documentId, user.id);
  redirect(`/resume/review?id=${documentId}`);
}