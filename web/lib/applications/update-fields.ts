/** Attachment / link fields users can set on an application after create. */
export type ApplicationAttachFields = {
  jobDescriptionId: string | null;
  jobMatchAnalysisId: string | null;
  applicationDraftId: string | null;
  interviewSessionId: string | null;
  preparationPlanId: string | null;
};

export type ApplicationEditableFields = ApplicationAttachFields & {
  nextAction: string | null;
  nextActionDue: string | null;
  notes: string | null;
  company?: string;
  role?: string;
};

/** Minimal shape needed to hydrate the edit form (avoids importing server actions). */
export type ApplicationFieldSource = ApplicationEditableFields;

/** Empty string clears optional IDs/dates; undefined means leave unchanged. */
export function emptyToNullId(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === "" ? null : t;
}

/**
 * Build the payload for updateApplicationAction from form state.
 * Used by the workspace UI so attach + next-action updates share one path.
 */
export function buildApplicationUpdatePayload(
  id: string,
  fields: ApplicationEditableFields
): {
  id: string;
  company?: string;
  role?: string;
  nextAction: string | null;
  nextActionDue: string | null;
  notes: string | null;
  jobDescriptionId: string | null;
  jobMatchAnalysisId: string | null;
  applicationDraftId: string | null;
  interviewSessionId: string | null;
  preparationPlanId: string | null;
} {
  return {
    id,
    ...(fields.company !== undefined ? { company: fields.company } : {}),
    ...(fields.role !== undefined ? { role: fields.role } : {}),
    nextAction: fields.nextAction?.trim() ? fields.nextAction.trim() : null,
    nextActionDue: fields.nextActionDue?.trim()
      ? fields.nextActionDue.trim()
      : null,
    notes: fields.notes?.trim() ? fields.notes.trim() : null,
    jobDescriptionId: emptyToNullId(fields.jobDescriptionId),
    jobMatchAnalysisId: emptyToNullId(fields.jobMatchAnalysisId),
    applicationDraftId: emptyToNullId(fields.applicationDraftId),
    interviewSessionId: emptyToNullId(fields.interviewSessionId),
    preparationPlanId: emptyToNullId(fields.preparationPlanId),
  };
}

export function fieldsFromApplication(
  app: ApplicationFieldSource
): ApplicationEditableFields {
  return {
    nextAction: app.nextAction,
    nextActionDue: app.nextActionDue,
    notes: app.notes,
    jobDescriptionId: app.jobDescriptionId,
    jobMatchAnalysisId: app.jobMatchAnalysisId,
    applicationDraftId: app.applicationDraftId,
    interviewSessionId: app.interviewSessionId,
    preparationPlanId: app.preparationPlanId,
  };
}

/** True when any attachment id is set (for UI badges). */
export function hasAttachments(fields: ApplicationAttachFields): boolean {
  return Boolean(
    fields.jobDescriptionId ||
      fields.jobMatchAnalysisId ||
      fields.applicationDraftId ||
      fields.interviewSessionId ||
      fields.preparationPlanId
  );
}
