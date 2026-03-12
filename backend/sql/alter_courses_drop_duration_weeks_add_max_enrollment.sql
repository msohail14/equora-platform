ALTER TABLE courses
ADD COLUMN IF NOT EXISTS max_enrollment INT NULL AFTER total_sessions;

ALTER TABLE courses
DROP COLUMN IF EXISTS duration_weeks;
