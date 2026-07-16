-- CreateTable
CREATE TABLE "ResumeReview" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "resumeDocumentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "errorMessage" TEXT,
    "result" JSONB,
    "overallScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeReview_userId_idx" ON "ResumeReview"("userId");

-- CreateIndex
CREATE INDEX "ResumeReview_resumeDocumentId_idx" ON "ResumeReview"("resumeDocumentId");

-- AddForeignKey
ALTER TABLE "ResumeReview" ADD CONSTRAINT "ResumeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeReview" ADD CONSTRAINT "ResumeReview_resumeDocumentId_fkey" FOREIGN KEY ("resumeDocumentId") REFERENCES "ResumeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
