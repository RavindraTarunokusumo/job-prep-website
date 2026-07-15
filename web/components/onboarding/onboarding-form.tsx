"use client";

import { useActionState } from "react";
import {
  saveProfile,
  type OnboardingActionState,
} from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  experienceLevelLabels,
  experienceLevels,
  jobSearchStatusLabels,
  jobSearchStatuses,
  type ExperienceLevel,
  type JobSearchStatus,
} from "@/lib/validation/onboarding";

const initialState: OnboardingActionState = {};

type OnboardingFormProps = {
  defaultValues?: {
    educationBackground?: string;
    experienceLevel?: ExperienceLevel;
    targetRole?: string;
    targetIndustry?: string;
    preferredLocation?: string;
    jobSearchStatus?: JobSearchStatus;
    careerSwitchIntent?: boolean;
    skills?: string;
    certifications?: string;
  };
  submitLabel?: string;
};

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function OnboardingForm({
  defaultValues,
  submitLabel = "Complete onboarding",
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Background</h2>
          <p className="text-sm text-muted-foreground">
            Tell us where you are today so we can tailor your preparation plan.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="educationBackground">Education background</Label>
          <textarea
            id="educationBackground"
            name="educationBackground"
            className={textareaClassName}
            required
            defaultValue={defaultValues?.educationBackground ?? ""}
            placeholder="e.g. B.S. Computer Science, bootcamp graduate, self-taught"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience level</Label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            className={selectClassName}
            required
            defaultValue={defaultValues?.experienceLevel ?? ""}
          >
            <option value="" disabled>
              Select level
            </option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {experienceLevelLabels[level]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="careerSwitchIntent"
            defaultChecked={defaultValues?.careerSwitchIntent ?? false}
            className="size-4 rounded border-input"
          />
          I am switching careers into this target role
        </label>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Career goals</h2>
          <p className="text-sm text-muted-foreground">
            Define the role and market you are preparing for.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetRole">Target role</Label>
            <Input
              id="targetRole"
              name="targetRole"
              required
              defaultValue={defaultValues?.targetRole ?? ""}
              placeholder="e.g. Product Manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetIndustry">Target industry</Label>
            <Input
              id="targetIndustry"
              name="targetIndustry"
              required
              defaultValue={defaultValues?.targetIndustry ?? ""}
              placeholder="e.g. Fintech"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredLocation">Preferred location</Label>
          <Input
            id="preferredLocation"
            name="preferredLocation"
            required
            defaultValue={defaultValues?.preferredLocation ?? ""}
            placeholder="e.g. London, UK or Remote (EU)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobSearchStatus">Job search status</Label>
          <select
            id="jobSearchStatus"
            name="jobSearchStatus"
            className={selectClassName}
            required
            defaultValue={defaultValues?.jobSearchStatus ?? ""}
          >
            <option value="" disabled>
              Select status
            </option>
            {jobSearchStatuses.map((status) => (
              <option key={status} value={status}>
                {jobSearchStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Skills (optional)</h2>
          <p className="text-sm text-muted-foreground">
            Comma-separated lists are fine — we will parse them for you.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="skills">Skills</Label>
          <Input
            id="skills"
            name="skills"
            defaultValue={defaultValues?.skills ?? ""}
            placeholder="e.g. Python, SQL, stakeholder management"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certifications">Certifications</Label>
          <Input
            id="certifications"
            name="certifications"
            defaultValue={defaultValues?.certifications ?? ""}
            placeholder="e.g. PMP, AWS Solutions Architect"
          />
        </div>
      </section>

      {state.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}