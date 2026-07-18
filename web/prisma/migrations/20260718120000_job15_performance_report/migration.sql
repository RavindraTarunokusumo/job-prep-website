-- CreateTable
CREATE TABLE "PerformanceReport" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sections" JSONB,
    "meta" JSONB,
    "resumeReviewId" TEXT,
    "jobMatchAnalysisId" TEXT,
    "interviewSessionId" TEXT,
    "preparationPlanId" TEXT,
    "model" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceReport_userId_idx" ON "PerformanceReport"("userId");

-- CreateIndex
CREATE INDEX "PerformanceReport_userId_createdAt_idx" ON "PerformanceReport"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PerformanceReport" ADD CONSTRAINT "PerformanceReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
