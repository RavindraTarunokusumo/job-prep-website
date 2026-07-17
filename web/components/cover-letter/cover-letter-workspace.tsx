"use client";

import { useState } from "react";
import {
  DraftEditor,
  type DraftSnapshot,
  type JobOption,
  type ResumeOption,
} from "@/components/cover-letter/draft-editor";
import {
  MessageEditor,
  type MessageDraftSnapshot,
} from "@/components/cover-letter/message-editor";

type TabId = "cover_letter" | "short_messages";

const SHORT_TYPES = new Set([
  "recruiter_dm",
  "referral_request",
  "application_note",
]);

function tabFromDraftType(type: string | null | undefined): TabId {
  if (type && SHORT_TYPES.has(type)) {
    return "short_messages";
  }
  return "cover_letter";
}

type CoverLetterWorkspaceProps = {
  resumes: ResumeOption[];
  jobs: JobOption[];
  targetRole: string | null;
  initialDraft: (DraftSnapshot & { type: string }) | null;
};

export function CoverLetterWorkspace({
  resumes,
  jobs,
  targetRole,
  initialDraft,
}: CoverLetterWorkspaceProps) {
  const [tab, setTab] = useState<TabId>(() =>
    tabFromDraftType(initialDraft?.type)
  );

  const coverLetterDraft: DraftSnapshot | null =
    initialDraft && initialDraft.type === "cover_letter"
      ? {
          id: initialDraft.id,
          title: initialDraft.title,
          content: initialDraft.content,
          status: initialDraft.status,
          tone: initialDraft.tone,
          length: initialDraft.length,
          sections: initialDraft.sections,
          resumeDocumentId: initialDraft.resumeDocumentId,
          jobDescriptionId: initialDraft.jobDescriptionId,
          errorMessage: initialDraft.errorMessage,
          version: initialDraft.version,
        }
      : null;

  const messageDraft: MessageDraftSnapshot | null =
    initialDraft && SHORT_TYPES.has(initialDraft.type)
      ? {
          id: initialDraft.id,
          title: initialDraft.title,
          content: initialDraft.content,
          status: initialDraft.status,
          type: initialDraft.type,
          tone: initialDraft.tone,
          resumeDocumentId: initialDraft.resumeDocumentId,
          jobDescriptionId: initialDraft.jobDescriptionId,
          errorMessage: initialDraft.errorMessage,
          version: initialDraft.version,
        }
      : null;

  const tabButtonClass = (active: boolean) =>
    active
      ? "flex-1 rounded-md bg-background px-3 py-1.5 text-center text-sm font-semibold text-foreground shadow-sm"
      : "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium text-muted-foreground hover:text-foreground";

  return (
    <div className="space-y-6">
      <div
        className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1"
        role="tablist"
        aria-label="Draft type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cover_letter"}
          className={tabButtonClass(tab === "cover_letter")}
          onClick={() => setTab("cover_letter")}
        >
          Cover letter
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "short_messages"}
          className={tabButtonClass(tab === "short_messages")}
          onClick={() => setTab("short_messages")}
        >
          Short messages
        </button>
      </div>

      {tab === "cover_letter" ? (
        <DraftEditor
          key={coverLetterDraft?.id ?? "new-cover-letter"}
          resumes={resumes}
          jobs={jobs}
          targetRole={targetRole}
          initialDraft={coverLetterDraft}
        />
      ) : (
        <MessageEditor
          key={messageDraft?.id ?? "new-message"}
          resumes={resumes}
          jobs={jobs}
          targetRole={targetRole}
          initialDraft={messageDraft}
        />
      )}
    </div>
  );
}
