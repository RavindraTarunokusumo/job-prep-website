-- Record which parser produced ResumeDocument.parsedData so heuristic fallback
-- is no longer signalled by overloading parseError.
ALTER TABLE "ResumeDocument" ADD COLUMN "structureParser" TEXT;
