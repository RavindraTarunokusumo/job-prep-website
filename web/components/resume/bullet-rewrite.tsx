"use client";

import { useState, useTransition } from "react";
import { rewriteResumeBulletAction } from "@/app/actions/resume-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BulletRewriteProps = {
  original: string;
  surroundingContext?: string;
  label?: string;
  allowCustomInput?: boolean;
};

export function BulletRewrite({
  original,
  surroundingContext,
  label = "Rewrite bullet",
  allowCustomInput = false,
}: BulletRewriteProps) {
  const [customOriginal, setCustomOriginal] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bulletText = allowCustomInput ? customOriginal : original;

  function handleRewrite() {
    const text = bulletText.trim();
    if (!text) {
      setError("Enter a bullet to rewrite.");
      return;
    }

    setError(null);
    setSuggestions([]);

    startTransition(async () => {
      const result = await rewriteResumeBulletAction({
        original: text,
        surroundingContext,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuggestions(result.suggestions);
    });
  }

  return (
    <div className="space-y-3">
      {allowCustomInput ? (
        <div className="space-y-2">
          <Label htmlFor="custom-bullet">Bullet to rewrite</Label>
          <Input
            id="custom-bullet"
            value={customOriginal}
            onChange={(event) => setCustomOriginal(event.target.value)}
            placeholder="Paste a resume bullet…"
            disabled={pending}
          />
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRewrite}
        disabled={pending || (!allowCustomInput && !original.trim())}
      >
        {pending ? "Rewriting…" : label}
      </Button>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="space-y-2 rounded-lg border border-border bg-muted/20 px-3 py-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion} className="text-sm text-foreground">
              {suggestion}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}