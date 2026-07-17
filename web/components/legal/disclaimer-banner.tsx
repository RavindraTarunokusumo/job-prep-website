import { LEGAL_COPY, type LegalCopyKey } from "@/lib/legal/copy";

type DisclaimerBannerProps = {
  /** Prefer a LEGAL_COPY key; falls back to `text` if provided. */
  copyKey?: LegalCopyKey;
  text?: string;
  className?: string;
};

/**
 * Lightweight inline disclaimer near AI or sensitive surfaces.
 */
export function DisclaimerBanner({
  copyKey,
  text,
  className = "",
}: DisclaimerBannerProps) {
  const body = text ?? (copyKey ? LEGAL_COPY[copyKey] : null);
  if (!body) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground ${className}`.trim()}
      role="note"
    >
      {body}
    </div>
  );
}
