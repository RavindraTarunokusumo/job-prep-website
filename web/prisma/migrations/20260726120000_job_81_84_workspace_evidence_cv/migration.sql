-- JOB-81 JobApplication
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'interested',
    "sourceUrl" TEXT,
    "location" TEXT,
    "appliedAt" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "nextAction" TEXT,
    "nextActionDue" TIMESTAMP(3),
    "contactName" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "jobDescriptionId" TEXT,
    "jobMatchAnalysisId" TEXT,
    "applicationDraftId" TEXT,
    "interviewSessionId" TEXT,
    "preparationPlanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");
CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status");
CREATE INDEX "JobApplication_userId_nextActionDue_idx" ON "JobApplication"("userId", "nextActionDue");
CREATE INDEX "JobApplication_userId_stage_idx" ON "JobApplication"("userId", "stage");

ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- JOB-82 CareerEvidence
CREATE TABLE "CareerEvidence" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "organization" TEXT,
    "roleTitle" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "responsibilities" TEXT,
    "achievements" TEXT,
    "metrics" TEXT,
    "verification" TEXT NOT NULL DEFAULT 'unconfirmed',
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CareerEvidence_userId_idx" ON "CareerEvidence"("userId");
CREATE INDEX "CareerEvidence_userId_verification_idx" ON "CareerEvidence"("userId", "verification");

ALTER TABLE "CareerEvidence" ADD CONSTRAINT "CareerEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- JOB-82 StarStory
CREATE TABLE "StarStory" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "evidenceId" TEXT,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "readiness" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StarStory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StarStory_userId_idx" ON "StarStory"("userId");
CREATE INDEX "StarStory_userId_readiness_idx" ON "StarStory"("userId", "readiness");
CREATE INDEX "StarStory_evidenceId_idx" ON "StarStory"("evidenceId");

ALTER TABLE "StarStory" ADD CONSTRAINT "StarStory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StarStory" ADD CONSTRAINT "StarStory_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CareerEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- JOB-84 CvDocument
CREATE TABLE "CvDocument" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CvDocument_userId_idx" ON "CvDocument"("userId");
CREATE INDEX "CvDocument_userId_status_idx" ON "CvDocument"("userId", "status");

ALTER TABLE "CvDocument" ADD CONSTRAINT "CvDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- JOB-84 CvVersion
CREATE TABLE "CvVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sectionConfig" JSONB,
    "jobDescriptionId" TEXT,
    "jobApplicationId" TEXT,
    "sourceFingerprint" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CvVersion_documentId_idx" ON "CvVersion"("documentId");
CREATE INDEX "CvVersion_userId_idx" ON "CvVersion"("userId");
CREATE INDEX "CvVersion_userId_isCurrent_idx" ON "CvVersion"("userId", "isCurrent");

ALTER TABLE "CvVersion" ADD CONSTRAINT "CvVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CvDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CvVersion" ADD CONSTRAINT "CvVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
