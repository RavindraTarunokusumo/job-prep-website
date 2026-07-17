-- CreateTable
CREATE TABLE "InterviewVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categoryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experienceLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "transcript" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewVideo_published_idx" ON "InterviewVideo"("published");
