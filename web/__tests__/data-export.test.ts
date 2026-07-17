import { describe, expect, it } from "vitest";
import { buildUserDataExportPayload } from "@/lib/legal/data-export";
import {
  DATA_REQUEST_STATUSES,
  DATA_REQUEST_TYPES,
  dataRequestStatusSchema,
  dataRequestTypeSchema,
  parseDataRequestType,
} from "@/lib/validation/privacy";

describe("data request validation", () => {
  it("accepts known request types", () => {
    expect(DATA_REQUEST_TYPES).toEqual(["export", "deletion"]);
    for (const type of DATA_REQUEST_TYPES) {
      expect(dataRequestTypeSchema.safeParse(type).success).toBe(true);
      expect(parseDataRequestType(type)).toBe(type);
    }
  });

  it("rejects unknown request types", () => {
    expect(dataRequestTypeSchema.safeParse("erase_all").success).toBe(false);
    expect(parseDataRequestType("")).toBeNull();
    expect(parseDataRequestType(null)).toBeNull();
  });

  it("accepts known request statuses", () => {
    expect(DATA_REQUEST_STATUSES).toEqual([
      "pending",
      "completed",
      "rejected",
    ]);
    for (const status of DATA_REQUEST_STATUSES) {
      expect(dataRequestStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});

describe("buildUserDataExportPayload", () => {
  const base = {
    requestId: "req_123",
    exportedAt: new Date("2026-07-17T12:00:00.000Z"),
    user: { id: "user-uuid", email: "user@example.com" },
    recentAnalysisIds: {
      resumeReviews: ["rr1"],
      jobMatchAnalyses: ["jm1", "jm2"],
      preparationPlans: ["pp1"],
      applicationDrafts: [],
    },
  };

  it("serializes profile and document metadata without file fields", () => {
    const payload = buildUserDataExportPayload({
      ...base,
      profile: {
        educationBackground: "bachelors",
        experienceLevel: "mid",
        targetRole: "Engineer",
        targetIndustry: "Tech",
        preferredLocation: "Remote",
        jobSearchStatus: "active",
        careerSwitchIntent: false,
        skills: ["TypeScript"],
        certifications: [],
        onboardingCompletedAt: new Date("2026-07-01T00:00:00.000Z"),
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
      documents: [
        {
          id: "doc1",
          originalFilename: "cv.pdf",
          mimeType: "application/pdf",
          byteSize: 1024,
          status: "ready",
          createdAt: new Date("2026-07-10T00:00:00.000Z"),
          updatedAt: new Date("2026-07-10T00:00:00.000Z"),
        },
      ],
    });

    expect(payload.requestId).toBe("req_123");
    expect(payload.exportedAt).toBe("2026-07-17T12:00:00.000Z");
    expect(payload.user.email).toBe("user@example.com");
    expect(payload.profile?.targetRole).toBe("Engineer");
    expect(payload.profile?.onboardingCompletedAt).toBe(
      "2026-07-01T00:00:00.000Z"
    );
    expect(payload.documents).toHaveLength(1);
    expect(payload.documents[0]).toEqual({
      id: "doc1",
      originalFilename: "cv.pdf",
      mimeType: "application/pdf",
      byteSize: 1024,
      status: "ready",
      createdAt: "2026-07-10T00:00:00.000Z",
      updatedAt: "2026-07-10T00:00:00.000Z",
    });
    expect(payload.documents[0]).not.toHaveProperty("rawText");
    expect(payload.documents[0]).not.toHaveProperty("storagePath");
    expect(payload.recentAnalysisIds.jobMatchAnalyses).toEqual(["jm1", "jm2"]);
  });

  it("allows null profile and empty collections", () => {
    const payload = buildUserDataExportPayload({
      ...base,
      profile: null,
      documents: [],
      recentAnalysisIds: {
        resumeReviews: [],
        jobMatchAnalyses: [],
        preparationPlans: [],
        applicationDrafts: [],
      },
    });

    expect(payload.profile).toBeNull();
    expect(payload.documents).toEqual([]);
    expect(payload.recentAnalysisIds.resumeReviews).toEqual([]);
  });
});
