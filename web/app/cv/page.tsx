import Link from "next/link";
import {
  getCvVersionAction,
  listCvDocumentsAction,
  listCvVersionsAction,
} from "@/app/actions/cv";
import { CvWorkspace } from "@/components/cv/cv-workspace";
import { Logo } from "@/components/landing/logo";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

type PageProps = {
  searchParams: Promise<{ documentId?: string; versionId?: string }>;
};

export default async function CvPage({ searchParams }: PageProps) {
  await requireUser();
  const params = await searchParams;
  const docsResult = await listCvDocumentsAction();
  const documents = docsResult.ok ? docsResult.documents : [];

  let documentId = params.documentId?.trim() || null;
  let versionId = params.versionId?.trim() || null;

  if (!documentId && documents.length > 0) {
    documentId = documents[0].id;
    versionId = documents[0].currentVersionId;
  }

  const versions =
    documentId != null
      ? await listCvVersionsAction(documentId)
      : { ok: true as const, versions: [] };

  const versionList = versions.ok ? versions.versions : [];

  if (!versionId && versionList.length > 0) {
    versionId =
      versionList.find((v) => v.isCurrent)?.id ?? versionList[0].id;
  }

  const selected =
    versionId != null ? await getCvVersionAction(versionId) : null;

  const loadError = !docsResult.ok
    ? docsResult.error
    : !versions.ok
      ? versions.error
      : selected && !selected.ok
        ? selected.error
        : null;

  return (
    <main className="min-h-screen bg-page px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Back to dashboard
          </Link>
        </div>

        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              Structured CV editor
            </CardTitle>
            <CardDescription>
              Build versioned CVs from confirmed data, apply rewrites without
              silently changing verified facts, and export a selectable PDF.
            </CardDescription>
          </CardHeader>
        </Card>

        <CvWorkspace
          documents={documents}
          versions={versionList}
          selected={selected && selected.ok ? selected.version : null}
          loadError={loadError}
        />
      </div>
    </main>
  );
}
