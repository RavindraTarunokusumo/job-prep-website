import { describe, expect, it } from "vitest";
import {
  CONSENT_COPY_VERSION,
  LEGAL_COPY,
  type LegalCopyKey,
} from "@/lib/legal/copy";

const REQUIRED_KEYS: LegalCopyKey[] = [
  "privacySummary",
  "uploadConsent",
  "aiGuidanceDisclaimer",
  "jobFitLimitations",
  "interviewFeedbackDisclaimer",
  "assessmentNonClinical",
  "careerRecommendationLimits",
  "dataRights",
];

describe("legal copy", () => {
  it("exposes a non-empty consent copy version", () => {
    expect(typeof CONSENT_COPY_VERSION).toBe("string");
    expect(CONSENT_COPY_VERSION.trim().length).toBeGreaterThan(0);
  });

  it("defines all required keys as non-empty strings", () => {
    for (const key of REQUIRED_KEYS) {
      const value = LEGAL_COPY[key];
      expect(typeof value).toBe("string");
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it("does not include empty or whitespace-only values", () => {
    for (const [key, value] of Object.entries(LEGAL_COPY)) {
      expect(value.trim().length, `${key} should be non-empty`).toBeGreaterThan(
        0
      );
    }
  });
});
