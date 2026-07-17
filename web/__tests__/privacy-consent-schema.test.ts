import { describe, expect, it } from "vitest";
import { CONSENT_COPY_VERSION } from "@/lib/legal/copy";
import {
  CONSENT_KINDS,
  consentKindSchema,
  parseConsentKind,
} from "@/lib/validation/privacy";

describe("privacy consent schema", () => {
  it("exposes a non-empty CONSENT_COPY_VERSION for UserConsent rows", () => {
    expect(typeof CONSENT_COPY_VERSION).toBe("string");
    expect(CONSENT_COPY_VERSION.trim().length).toBeGreaterThan(0);
    expect(CONSENT_COPY_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts known consent kinds", () => {
    expect(CONSENT_KINDS).toEqual(["upload", "ai_processing"]);
    for (const kind of CONSENT_KINDS) {
      expect(consentKindSchema.safeParse(kind).success).toBe(true);
      expect(parseConsentKind(kind)).toBe(kind);
    }
  });

  it("rejects unknown consent kinds", () => {
    expect(consentKindSchema.safeParse("export").success).toBe(false);
    expect(consentKindSchema.safeParse("").success).toBe(false);
    expect(consentKindSchema.safeParse(null).success).toBe(false);
    expect(parseConsentKind("deletion")).toBeNull();
    expect(parseConsentKind(undefined)).toBeNull();
  });
});
