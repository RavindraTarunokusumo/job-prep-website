"use client";

import { useState, useTransition } from "react";
import {
  requestDataDeletionAction,
  requestDataExportAction,
} from "@/app/actions/privacy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LEGAL_COPY } from "@/lib/legal/copy";
import type { UserDataExportPayload } from "@/lib/legal/data-export";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  // Append to DOM so browsers reliably start the download
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  // Delay revoke until after the download has a chance to start
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 1_000);
}

/**
 * Settings → Your data: export metadata JSON + request deletion (operator-handled).
 */
export function YourDataSection() {
  const [pending, startTransition] = useTransition();
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<UserDataExportPayload | null>(
    null
  );

  function handleExport() {
    setError(null);
    setExportMessage(null);
    startTransition(async () => {
      const result = await requestDataExportAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLastPayload(result.payload);
      downloadJson(
        `roleready-export-${result.requestId}.json`,
        result.payload
      );
      setExportMessage(
        `Export request recorded (${result.requestId}). A metadata JSON file downloaded — profile and document details only, not file contents. ${LEGAL_COPY.dataRights}`
      );
    });
  }

  function handleDeletion() {
    setError(null);
    setDeletionMessage(null);
    const confirmed = window.confirm(
      "Request deletion of your career data? This records a request for operator handling — it does not wipe your account immediately."
    );
    if (!confirmed) {
      return;
    }
    startTransition(async () => {
      const result = await requestDataDeletionAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeletionMessage(
        `Deletion request recorded (${result.requestId}). We process requests as soon as practical; full removal of stored files may take additional operator steps. This does not delete your account immediately.`
      );
    });
  }

  return (
    <Card className="mt-6 shadow-sm">
      <CardHeader>
        <CardTitle>Your data</CardTitle>
        <CardDescription>{LEGAL_COPY.dataRights}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export returns profile answers, resume document metadata, and recent
          analysis ids right away. Deletion requests are logged for operator
          handling — we do not auto-wipe storage in this MVP.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={pending}
          >
            {pending ? "Working…" : "Request data export"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeletion}
            disabled={pending}
          >
            {pending ? "Working…" : "Request data deletion"}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {exportMessage ? (
          <p className="text-sm text-foreground" role="status">
            {exportMessage}
          </p>
        ) : null}

        {deletionMessage ? (
          <p className="text-sm text-foreground" role="status">
            {deletionMessage}
          </p>
        ) : null}

        {lastPayload ? (
          <p className="text-xs text-muted-foreground">
            Last export included {lastPayload.documents.length} document
            {lastPayload.documents.length === 1 ? "" : "s"} and{" "}
            {lastPayload.recentAnalysisIds.resumeReviews.length +
              lastPayload.recentAnalysisIds.jobMatchAnalyses.length}{" "}
            recent review/match ids.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
