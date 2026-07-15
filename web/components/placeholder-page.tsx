import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
};

export function PlaceholderPage({
  title,
  description,
  homeHref = "/",
  homeLabel = "Back to home",
}: PlaceholderPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <p className="mt-6 font-mono text-xs font-semibold tracking-wider text-brand-purple uppercase">
          Coming soon
        </p>
        <Link
          href={homeHref}
          className="mt-8 inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {homeLabel}
        </Link>
      </div>
    </main>
  );
}