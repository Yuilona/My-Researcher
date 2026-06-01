-- T-113 decommissions the legacy research-argument authority lane.
-- Do not apply this migration to a database that still needs historical
-- research-argument rows without first exporting or accepting data loss.

DROP TABLE IF EXISTS "ResearchArgumentReportProjection" CASCADE;
DROP TABLE IF EXISTS "ResearchArgumentLessonRecord" CASCADE;
DROP TABLE IF EXISTS "ResearchArgumentDecisionRecord" CASCADE;
DROP TABLE IF EXISTS "ResearchArgumentStateSnapshot" CASCADE;
DROP TABLE IF EXISTS "ResearchArgumentGraphObject" CASCADE;
DROP TABLE IF EXISTS "ResearchArgumentBranch" CASCADE;
DROP TABLE IF EXISTS "ResearchArgumentWorkspace" CASCADE;
