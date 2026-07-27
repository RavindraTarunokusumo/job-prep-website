-- Prevent duplicate requirement mappings per user/job/key (JOB-86)
CREATE UNIQUE INDEX "RequirementEvidenceMatch_userId_jobDescriptionId_requirementKey_key"
ON "RequirementEvidenceMatch"("userId", "jobDescriptionId", "requirementKey");
