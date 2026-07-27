CREATE TABLE "ApplicationReadinessScore" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "jobDescriptionId" TEXT,
    "jobApplicationId" TEXT,
    "confidenceBand" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "overallScore" INTEGER,
    "explanations" JSONB,
    "sourceTimestamps" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationReadinessScore_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ApplicationReadinessScore_userId_idx" ON "ApplicationReadinessScore"("userId");
CREATE INDEX "ApplicationReadinessScore_userId_jobDescriptionId_idx" ON "ApplicationReadinessScore"("userId", "jobDescriptionId");
ALTER TABLE "ApplicationReadinessScore" ADD CONSTRAINT "ApplicationReadinessScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ApplicationOutcome" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "jobDescriptionId" TEXT,
    "jobApplicationId" TEXT,
    "stage" TEXT NOT NULL,
    "outcome" TEXT,
    "stageDate" TIMESTAMP(3),
    "employerFeedback" TEXT,
    "userInterpretation" TEXT,
    "perceivedBlockers" TEXT,
    "meta" JSONB,
    "isSensitive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationOutcome_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ApplicationOutcome_userId_idx" ON "ApplicationOutcome"("userId");
CREATE INDEX "ApplicationOutcome_userId_stage_idx" ON "ApplicationOutcome"("userId", "stage");
ALTER TABLE "ApplicationOutcome" ADD CONSTRAINT "ApplicationOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "workflow" TEXT NOT NULL,
    "taskClass" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "validationOk" BOOLEAN,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiUsageEvent_userId_idx" ON "AiUsageEvent"("userId");
CREATE INDEX "AiUsageEvent_workflow_idx" ON "AiUsageEvent"("workflow");
CREATE INDEX "AiUsageEvent_model_idx" ON "AiUsageEvent"("model");
CREATE INDEX "AiUsageEvent_createdAt_idx" ON "AiUsageEvent"("createdAt");
CREATE INDEX "AiUsageEvent_userId_workflow_idx" ON "AiUsageEvent"("userId", "workflow");
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductPlan_code_key" ON "ProductPlan"("code");

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stub',
    "providerCustomerId" TEXT,
    "providerSubId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");
CREATE INDEX "Subscription_providerSubId_idx" ON "Subscription"("providerSubId");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EntitlementGrant" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EntitlementGrant_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EntitlementGrant_userId_idx" ON "EntitlementGrant"("userId");
CREATE INDEX "EntitlementGrant_userId_feature_status_idx" ON "EntitlementGrant"("userId", "feature", "status");
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "subscriptionId" TEXT,
    "type" TEXT NOT NULL,
    "providerEventId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingEvent_providerEventId_key" ON "BillingEvent"("providerEventId");
CREATE INDEX "BillingEvent_userId_idx" ON "BillingEvent"("userId");
CREATE INDEX "BillingEvent_subscriptionId_idx" ON "BillingEvent"("subscriptionId");
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
