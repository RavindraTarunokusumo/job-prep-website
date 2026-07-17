"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VideoFilterState = {
  category?: string;
  role?: string;
  industry?: string;
  experience?: string;
  q?: string;
};

type VideoFiltersProps = {
  value: VideoFilterState;
  categories: string[];
  roles: string[];
  industries: string[];
  experienceLevels: string[];
};

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function VideoFilters({
  value,
  categories,
  roles,
  industries,
  experienceLevels,
}: VideoFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function push(next: VideoFilterState) {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.role) params.set("role", next.role);
    if (next.industry) params.set("industry", next.industry);
    if (next.experience) params.set("experience", next.experience);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function clear() {
    push({});
  }

  const hasAny =
    Boolean(value.category) ||
    Boolean(value.role) ||
    Boolean(value.industry) ||
    Boolean(value.experience) ||
    Boolean(value.q);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        push({
          category: String(fd.get("category") ?? "").trim() || undefined,
          role: String(fd.get("role") ?? "").trim() || undefined,
          industry: String(fd.get("industry") ?? "").trim() || undefined,
          experience: String(fd.get("experience") ?? "").trim() || undefined,
          q: String(fd.get("q") ?? "").trim() || undefined,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          id="category"
          label="Category"
          value={value.category ?? ""}
          options={categories}
          onChange={(category) =>
            push({ ...value, category: category || undefined })
          }
        />
        <SelectField
          id="role"
          label="Role"
          value={value.role ?? ""}
          options={roles}
          onChange={(role) => push({ ...value, role: role || undefined })}
        />
        <SelectField
          id="industry"
          label="Industry"
          value={value.industry ?? ""}
          options={industries}
          onChange={(industry) =>
            push({ ...value, industry: industry || undefined })
          }
        />
        <SelectField
          id="experience"
          label="Experience"
          value={value.experience ?? ""}
          options={experienceLevels}
          onChange={(experience) =>
            push({ ...value, experience: experience || undefined })
          }
        />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={value.q ?? ""}
            placeholder="Title or summary keywords"
            disabled={pending}
          />
          {/* keep selects named for form submit of search only path */}
          <input type="hidden" name="category" value={value.category ?? ""} />
          <input type="hidden" name="role" value={value.role ?? ""} />
          <input type="hidden" name="industry" value={value.industry ?? ""} />
          <input
            type="hidden"
            name="experience"
            value={value.experience ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Apply search
        </Button>
        {hasAny ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={clear}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </form>
  );
}
