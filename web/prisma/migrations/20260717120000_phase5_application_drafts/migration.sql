-- CreateTable
CREATE TABLE "ApplicationDraft" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tone" TEXT,
    "length" TEXT,
    "content" TEXT NOT NULL,
    "sections" JSONB,
    "meta" JSONB,
    "jobDescriptionId" TEXT,
    "resumeDocumentId" TEXT,
    "supersedesId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "model" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationDraft_userId_idx" ON "ApplicationDraft"("userId");

-- CreateIndex
CREATE INDEX "ApplicationDraft_userId_type_idx" ON "ApplicationDraft"("userId", "type");

-- CreateIndex
CREATE INDEX "ApplicationDraft_jobDescriptionId_idx" ON "ApplicationDraft"("jobDescriptionId");

-- CreateIndex
CREATE INDEX "ApplicationDraft_resumeDocumentId_idx" ON "ApplicationDraft"("resumeDocumentId");

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_resumeDocumentId_fkey" FOREIGN KEY ("resumeDocumentId") REFERENCES "ResumeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
