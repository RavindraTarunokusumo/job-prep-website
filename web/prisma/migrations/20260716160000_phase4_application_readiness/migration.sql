-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "sourceNote" TEXT,
    "rawText" TEXT NOT NULL,
    "extracted" JSONB,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatchAnalysis" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "resumeDocumentId" TEXT,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "errorMessage" TEXT,
    "result" JSONB,
    "matchScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatchAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationPlan" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My prep plan',
    "status" TEXT NOT NULL,
    "sourceProfileUpdatedAt" TIMESTAMP(3),
    "sourceResumeReviewId" TEXT,
    "sourceJobMatchId" TEXT,
    "model" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "href" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparationPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobDescription_userId_idx" ON "JobDescription"("userId");

-- CreateIndex
CREATE INDEX "JobMatchAnalysis_userId_idx" ON "JobMatchAnalysis"("userId");

-- CreateIndex
CREATE INDEX "JobMatchAnalysis_jobDescriptionId_idx" ON "JobMatchAnalysis"("jobDescriptionId");

-- CreateIndex
CREATE INDEX "PreparationPlan_userId_idx" ON "PreparationPlan"("userId");

-- CreateIndex
CREATE INDEX "PreparationPlanItem_planId_idx" ON "PreparationPlanItem"("planId");

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchAnalysis" ADD CONSTRAINT "JobMatchAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchAnalysis" ADD CONSTRAINT "JobMatchAnalysis_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatchAnalysis" ADD CONSTRAINT "JobMatchAnalysis_resumeDocumentId_fkey" FOREIGN KEY ("resumeDocumentId") REFERENCES "ResumeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlan" ADD CONSTRAINT "PreparationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlanItem" ADD CONSTRAINT "PreparationPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;