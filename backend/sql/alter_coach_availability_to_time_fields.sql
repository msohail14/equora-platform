TRUNCATE TABLE coach_availability_exceptions;
TRUNCATE TABLE coach_weekly_availability;

ALTER TABLE coach_weekly_availability
  DROP INDEX idx_cwa_lookup;

ALTER TABLE coach_weekly_availability
  DROP COLUMN IF EXISTS start_minute,
  DROP COLUMN IF EXISTS end_minute,
  ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL AFTER day_of_week,
  ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL AFTER start_time;

CREATE INDEX idx_cwa_lookup
ON coach_weekly_availability (coach_id, day_of_week, is_active, start_time, end_time);

ALTER TABLE coach_availability_exceptions
  DROP INDEX idx_cae_lookup;

ALTER TABLE coach_availability_exceptions
  DROP COLUMN IF EXISTS start_minute,
  DROP COLUMN IF EXISTS end_minute,
  ADD COLUMN IF NOT EXISTS start_time TIME NULL AFTER exception_type,
  ADD COLUMN IF NOT EXISTS end_time TIME NULL AFTER start_time;

CREATE INDEX idx_cae_lookup
ON coach_availability_exceptions (coach_id, exception_date, exception_type, start_time, end_time);
