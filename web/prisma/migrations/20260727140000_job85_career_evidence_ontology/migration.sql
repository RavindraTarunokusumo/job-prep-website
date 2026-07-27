-- JOB-85 shared career evidence ontology (additive)

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "verification" TEXT NOT NULL DEFAULT 'unconfirmed',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "provenance" JSONB,
    "sourceNote" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "metricLabel" TEXT,
    "metricValue" TEXT,
    "verification" TEXT NOT NULL DEFAULT 'unconfirmed',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "verification" TEXT NOT NULL DEFAULT 'unconfirmed',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StarStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenioritySignal" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "verification" TEXT NOT NULL DEFAULT 'unconfirmed',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenioritySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetRole" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "industry" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSkillLink" (
    "evidenceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "strength" TEXT NOT NULL DEFAULT 'mentioned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceSkillLink_pkey" PRIMARY KEY ("evidenceId","skillId")
);

-- CreateIndex
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");
CREATE INDEX "Skill_userId_verification_idx" ON "Skill"("userId", "verification");
CREATE INDEX "Skill_userId_normalizedName_idx" ON "Skill"("userId", "normalizedName");

CREATE INDEX "CareerEvidence_userId_idx" ON "CareerEvidence"("userId");
CREATE INDEX "CareerEvidence_userId_verification_idx" ON "CareerEvidence"("userId", "verification");

CREATE INDEX "Achievement_evidenceId_idx" ON "Achievement"("evidenceId");
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

CREATE INDEX "StarStory_userId_idx" ON "StarStory"("userId");
CREATE INDEX "StarStory_userId_readiness_idx" ON "StarStory"("userId", "readiness");
CREATE INDEX "StarStory_evidenceId_idx" ON "StarStory"("evidenceId");

CREATE INDEX "SenioritySignal_userId_idx" ON "SenioritySignal"("userId");
CREATE INDEX "SenioritySignal_userId_kind_idx" ON "SenioritySignal"("userId", "kind");

CREATE INDEX "TargetRole_userId_idx" ON "TargetRole"("userId");
CREATE INDEX "TargetRole_userId_isPrimary_idx" ON "TargetRole"("userId", "isPrimary");

CREATE INDEX "EvidenceSkillLink_userId_idx" ON "EvidenceSkillLink"("userId");
CREATE INDEX "EvidenceSkillLink_skillId_idx" ON "EvidenceSkillLink"("skillId");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerEvidence" ADD CONSTRAINT "CareerEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CareerEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StarStory" ADD CONSTRAINT "StarStory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StarStory" ADD CONSTRAINT "StarStory_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CareerEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SenioritySignal" ADD CONSTRAINT "SenioritySignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TargetRole" ADD CONSTRAINT "TargetRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceSkillLink" ADD CONSTRAINT "EvidenceSkillLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceSkillLink" ADD CONSTRAINT "EvidenceSkillLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "CareerEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceSkillLink" ADD CONSTRAINT "EvidenceSkillLink_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
