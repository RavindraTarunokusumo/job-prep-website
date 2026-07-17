import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CONSENT_COPY_VERSION,
  LEGAL_COPY,
  PRIVACY_PAGE,
  PRIVACY_SUMMARY_BULLETS,
} from "@/lib/legal/copy";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-page px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <p className="font-mono text-xs font-semibold tracking-wider text-brand-purple uppercase">
            Legal · copy {CONSENT_COPY_VERSION}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
            {PRIVACY_PAGE.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {PRIVACY_PAGE.intro}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>In short</CardTitle>
            <CardDescription>What this product does with your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {LEGAL_COPY.privacySummary}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>{PRIVACY_PAGE.whatWeCollectTitle}</CardTitle>
            <CardDescription>
              Typical categories for an active RoleReady account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
              {PRIVACY_SUMMARY_BULLETS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>{PRIVACY_PAGE.howWeUseTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              {PRIVACY_PAGE.howWeUseBody}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {LEGAL_COPY.uploadConsent.replace(/^I understand /, "When you upload: ")}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>{PRIVACY_PAGE.storageTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {PRIVACY_PAGE.storageBody}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>{PRIVACY_PAGE.thirdPartiesTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {PRIVACY_PAGE.thirdPartiesBody}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>Your data rights</CardTitle>
            <CardDescription>Export and deletion requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              {LEGAL_COPY.dataRights}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {PRIVACY_PAGE.contactNote}
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/ai-use"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            How we use AI
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
