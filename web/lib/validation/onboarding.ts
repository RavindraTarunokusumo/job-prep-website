import { z } from "zod";

export const experienceLevels = [
  "student",
  "entry",
  "mid",
  "senior",
  "career_switch",
] as const;

export const jobSearchStatuses = [
  "exploring",
  "actively_applying",
  "interviewing",
  "not_looking",
] as const;

export type ExperienceLevel = (typeof experienceLevels)[number];
export type JobSearchStatus = (typeof jobSearchStatuses)[number];

export function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export const onboardingSchema = z.object({
  educationBackground: z
    .string()
    .trim()
    .min(1, "Education background is required"),
  experienceLevel: z.enum(experienceLevels, {
    message: "Select your experience level",
  }),
  targetRole: z.string().trim().min(1, "Target role is required"),
  targetIndustry: z.string().trim().min(1, "Target industry is required"),
  preferredLocation: z.string().trim().min(1, "Preferred location is required"),
  jobSearchStatus: z.enum(jobSearchStatuses, {
    message: "Select your job search status",
  }),
  careerSwitchIntent: z.boolean(),
  skills: z.array(z.string().trim().min(1)).default([]),
  certifications: z.array(z.string().trim().min(1)).default([]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const onboardingFormSchema = onboardingSchema
  .omit({ skills: true, certifications: true })
  .extend({
    skillsInput: z.string().optional(),
    certificationsInput: z.string().optional(),
  });

export type OnboardingFormInput = z.infer<typeof onboardingFormSchema>;

export function formInputToOnboarding(
  input: OnboardingFormInput
): OnboardingInput {
  return onboardingSchema.parse({
    educationBackground: input.educationBackground,
    experienceLevel: input.experienceLevel,
    targetRole: input.targetRole,
    targetIndustry: input.targetIndustry,
    preferredLocation: input.preferredLocation,
    jobSearchStatus: input.jobSearchStatus,
    careerSwitchIntent: input.careerSwitchIntent,
    skills: input.skillsInput
      ? parseCommaSeparatedList(input.skillsInput)
      : [],
    certifications: input.certificationsInput
      ? parseCommaSeparatedList(input.certificationsInput)
      : [],
  });
}

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  student: "Student",
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior",
  career_switch: "Career switcher",
};

export const jobSearchStatusLabels: Record<JobSearchStatus, string> = {
  exploring: "Exploring options",
  actively_applying: "Actively applying",
  interviewing: "Interviewing",
  not_looking: "Not looking right now",
};