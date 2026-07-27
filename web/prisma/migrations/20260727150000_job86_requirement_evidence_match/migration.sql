-- JOB-86 RequirementEvidenceMatch
CREATE TABLE "RequirementEvidenceMatch" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "requirementKey" TEXT NOT NULL,
    "requirementText" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "evidenceStrength" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "explanation" TEXT NOT NULL,
    "evidenceId" TEXT,
    "skillId" TEXT,
    "starStoryId" TEXT,
    "userReview" TEXT NOT NULL DEFAULT 'suggested',
    "safeAction" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RequirementEvidenceMatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RequirementEvidenceMatch_userId_idx" ON "RequirementEvidenceMatch"("userId");
CREATE INDEX "RequirementEvidenceMatch_jobDescriptionId_idx" ON "RequirementEvidenceMatch"("jobDescriptionId");
CREATE INDEX "RequirementEvidenceMatch_userId_jobDescriptionId_idx" ON "RequirementEvidenceMatch"("userId", "jobDescriptionId");
CREATE INDEX "RequirementEvidenceMatch_userId_userReview_idx" ON "RequirementEvidenceMatch"("userId", "userReview");
ALTER TABLE "RequirementEvidenceMatch" ADD CONSTRAINT "RequirementEvidenceMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RequirementEvidenceMatch" ADD CONSTRAINT "RequirementEvidenceMatch_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
