/**
 * Immediate JSON export shape for Settings → Your data.
 * Metadata only — no resume file bytes, rawText, or storage paths.
 */

export type ExportProfileSnapshot = {
  educationBackground: string;
  experienceLevel: string;
  targetRole: string;
  targetIndustry: string;
  preferredLocation: string;
  jobSearchStatus: string;
  careerSwitchIntent: boolean;
  skills: string[];
  certifications: string[];
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
} | null;

export type ExportDocumentMeta = {
  id: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type UserDataExportInput = {
  requestId: string;
  exportedAt?: Date;
  user: { id: string; email: string };
  profile: {
    educationBackground: string;
    experienceLevel: string;
    targetRole: string;
    targetIndustry: string;
    preferredLocation: string;
    jobSearchStatus: string;
    careerSwitchIntent: boolean;
    skills: string[];
    certifications: string[];
    onboardingCompletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  documents: Array<{
    id: string;
    originalFilename: string;
    mimeType: string;
    byteSize: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  /** Most recent analysis / plan / draft ids (already ordered by caller). */
  recentAnalysisIds: {
    resumeReviews: string[];
    jobMatchAnalyses: string[];
    preparationPlans: string[];
    applicationDrafts: string[];
  };
};

export type UserDataExportPayload = {
  requestId: string;
  exportedAt: string;
  user: { id: string; email: string };
  profile: ExportProfileSnapshot;
  documents: ExportDocumentMeta[];
  recentAnalysisIds: {
    resumeReviews: string[];
    jobMatchAnalyses: string[];
    preparationPlans: string[];
    applicationDrafts: string[];
  };
};

function toIso(value: Date): string {
  return value.toISOString();
}

/**
 * Build a serializable export payload from DB rows (no file bytes).
 */
export function buildUserDataExportPayload(
  input: UserDataExportInput
): UserDataExportPayload {
  const exportedAt = (input.exportedAt ?? new Date()).toISOString();

  return {
    requestId: input.requestId,
    exportedAt,
    user: {
      id: input.user.id,
      email: input.user.email,
    },
    profile: input.profile
      ? {
          educationBackground: input.profile.educationBackground,
          experienceLevel: input.profile.experienceLevel,
          targetRole: input.profile.targetRole,
          targetIndustry: input.profile.targetIndustry,
          preferredLocation: input.profile.preferredLocation,
          jobSearchStatus: input.profile.jobSearchStatus,
          careerSwitchIntent: input.profile.careerSwitchIntent,
          skills: [...input.profile.skills],
          certifications: [...input.profile.certifications],
          onboardingCompletedAt: input.profile.onboardingCompletedAt
            ? toIso(input.profile.onboardingCompletedAt)
            : null,
          createdAt: toIso(input.profile.createdAt),
          updatedAt: toIso(input.profile.updatedAt),
        }
      : null,
    documents: input.documents.map((doc) => ({
      id: doc.id,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      byteSize: doc.byteSize,
      status: doc.status,
      createdAt: toIso(doc.createdAt),
      updatedAt: toIso(doc.updatedAt),
    })),
    recentAnalysisIds: {
      resumeReviews: [...input.recentAnalysisIds.resumeReviews],
      jobMatchAnalyses: [...input.recentAnalysisIds.jobMatchAnalyses],
      preparationPlans: [...input.recentAnalysisIds.preparationPlans],
      applicationDrafts: [...input.recentAnalysisIds.applicationDrafts],
    },
  };
}
