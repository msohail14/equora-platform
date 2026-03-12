ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_type ENUM('one_to_one', 'group') NOT NULL DEFAULT 'one_to_one' AFTER discipline_id,
ADD COLUMN IF NOT EXISTS duration_days INT NULL AFTER focus_type,
ADD COLUMN IF NOT EXISTS max_session_duration INT NULL COMMENT 'Duration of one session in minutes' AFTER duration_days,
ADD COLUMN IF NOT EXISTS start_date DATE NULL AFTER max_session_duration,
ADD COLUMN IF NOT EXISTS end_date DATE NULL AFTER start_date,
ADD COLUMN IF NOT EXISTS start_time TIME NULL AFTER end_date,
ADD COLUMN IF NOT EXISTS end_time TIME NULL AFTER start_time,
ADD COLUMN IF NOT EXISTS total_sessions INT NULL AFTER end_time,
ADD COLUMN IF NOT EXISTS max_enrollment INT NULL AFTER total_sessions;
