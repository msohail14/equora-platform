import sequelize from './database.js';

const ensureUserIsActiveColumn = async () => {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
      AND COLUMN_NAME = 'is_active'
  `);

  const hasColumn = Number(results?.[0]?.count || 0) > 0;
  if (hasColumn) {
    return;
  }

  await sequelize.query(`
    ALTER TABLE \`user\`
    ADD COLUMN \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE AFTER \`is_email_verified\`
  `);
};

const ensureCoursesMaxEnrollmentAndRemoveDurationWeeks = async () => {
  const [maxEnrollmentResults] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'courses'
      AND COLUMN_NAME = 'max_enrollment'
  `);

  const hasMaxEnrollment = Number(maxEnrollmentResults?.[0]?.count || 0) > 0;
  if (!hasMaxEnrollment) {
    await sequelize.query(`
      ALTER TABLE \`courses\`
      ADD COLUMN \`max_enrollment\` INT NULL AFTER \`total_sessions\`
    `);
  }

  const [durationWeeksResults] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'courses'
      AND COLUMN_NAME = 'duration_weeks'
  `);

  const hasDurationWeeks = Number(durationWeeksResults?.[0]?.count || 0) > 0;
  if (hasDurationWeeks) {
    await sequelize.query(`
      ALTER TABLE \`courses\`
      DROP COLUMN \`duration_weeks\`
    `);
  }
};

const ensureHorseAndArenaDescriptionColumns = async () => {
  const [horseDescriptionResults] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'horses'
      AND COLUMN_NAME = 'description'
  `);

  const hasHorseDescription = Number(horseDescriptionResults?.[0]?.count || 0) > 0;
  if (!hasHorseDescription) {
    await sequelize.query(`
      ALTER TABLE \`horses\`
      ADD COLUMN \`description\` TEXT NULL AFTER \`breed\`
    `);
  }

  const [arenaDescriptionResults] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'arenas'
      AND COLUMN_NAME = 'description'
  `);

  const hasArenaDescription = Number(arenaDescriptionResults?.[0]?.count || 0) > 0;
  if (!hasArenaDescription) {
    await sequelize.query(`
      ALTER TABLE \`arenas\`
      ADD COLUMN \`description\` TEXT NULL AFTER \`name\`
    `);
  }
};

const ensureCourseSessionCancelReasonColumn = async () => {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'course_sessions'
      AND COLUMN_NAME = 'cancel_reason'
  `);

  const hasColumn = Number(results?.[0]?.count || 0) > 0;
  if (hasColumn) {
    return;
  }

  await sequelize.query(`
    ALTER TABLE \`course_sessions\`
    ADD COLUMN \`cancel_reason\` VARCHAR(255) NULL AFTER \`status\`
  `);
};

const ensureCourseSessionCancelledByColumn = async () => {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'course_sessions'
      AND COLUMN_NAME = 'cancelled_by_user_id'
  `);

  const hasColumn = Number(results?.[0]?.count || 0) > 0;
  if (hasColumn) {
    return;
  }

  await sequelize.query(`
    ALTER TABLE \`course_sessions\`
    ADD COLUMN \`cancelled_by_user_id\` INT NULL AFTER \`cancel_reason\`
  `);

  await sequelize.query(`
    ALTER TABLE \`course_sessions\`
    ADD CONSTRAINT \`fk_course_sessions_cancelled_by_user_id\`
    FOREIGN KEY (\`cancelled_by_user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL
  `);
};

const ensureCoursesStableAssociation = async () => {
  const [stableIdResults] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'courses'
      AND COLUMN_NAME = 'stable_id'
  `);

  const hasStableColumn = Number(stableIdResults?.[0]?.count || 0) > 0;
  if (!hasStableColumn) {
    await sequelize.query(`
      ALTER TABLE \`courses\`
      ADD COLUMN \`stable_id\` INT NULL AFTER \`coach_id\`
    `);
  }

  const [stableRows] = await sequelize.query(`
    SELECT id
    FROM \`stables\`
    ORDER BY id ASC
    LIMIT 1
  `);
  const defaultStableId = Number(stableRows?.[0]?.id || 0);

  if (defaultStableId > 0) {
    await sequelize.query(`
      UPDATE \`courses\`
      SET \`stable_id\` = :stableId
      WHERE \`stable_id\` IS NULL
    `, {
      replacements: { stableId: defaultStableId },
    });
  }

  const [foreignKeyResults] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'courses'
      AND COLUMN_NAME = 'stable_id'
      AND REFERENCED_TABLE_NAME = 'stables'
  `);

  const hasForeignKey = Number(foreignKeyResults?.[0]?.count || 0) > 0;
  if (!hasForeignKey) {
    await sequelize.query(`
      ALTER TABLE \`courses\`
      ADD CONSTRAINT \`fk_courses_stable_id\`
      FOREIGN KEY (\`stable_id\`) REFERENCES \`stables\`(\`id\`) ON DELETE RESTRICT
    `);
  }
};

const ensureStableAddressColumns = async () => {
  const columns = [
    { name: 'city', sql: 'ADD COLUMN `city` VARCHAR(100) NULL AFTER `location_address`' },
    { name: 'state', sql: 'ADD COLUMN `state` VARCHAR(100) NULL AFTER `city`' },
    { name: 'country', sql: 'ADD COLUMN `country` VARCHAR(100) NULL AFTER `state`' },
    { name: 'pincode', sql: 'ADD COLUMN `pincode` VARCHAR(20) NULL AFTER `country`' },
  ];

  for (const column of columns) {
    const [results] = await sequelize.query(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'stables'
        AND COLUMN_NAME = '${column.name}'
    `);
    const hasColumn = Number(results?.[0]?.count || 0) > 0;
    if (!hasColumn) {
      await sequelize.query(`
        ALTER TABLE \`stables\`
        ${column.sql}
      `);
    }
  }
};

const ensureUserProfileExtraColumns = async () => {
  const columns = [
    { name: 'city', sql: 'ADD COLUMN `city` VARCHAR(100) NULL AFTER `last_name`' },
    { name: 'state', sql: 'ADD COLUMN `state` VARCHAR(100) NULL AFTER `city`' },
    { name: 'country', sql: 'ADD COLUMN `country` VARCHAR(100) NULL AFTER `state`' },
    { name: 'pincode', sql: 'ADD COLUMN `pincode` VARCHAR(20) NULL AFTER `country`' },
    { name: 'date_of_birth', sql: 'ADD COLUMN `date_of_birth` DATE NULL AFTER `pincode`' },
    { name: 'gender', sql: 'ADD COLUMN `gender` VARCHAR(20) NULL AFTER `date_of_birth`' },
  ];

  for (const column of columns) {
    const [results] = await sequelize.query(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user'
        AND COLUMN_NAME = '${column.name}'
    `);
    const hasColumn = Number(results?.[0]?.count || 0) > 0;
    if (!hasColumn) {
      await sequelize.query(`
        ALTER TABLE \`user\`
        ${column.sql}
      `);
    }
  }
};

const ensureUserMobileNumberColumn = async () => {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
      AND COLUMN_NAME = 'mobile_number'
  `);

  const hasColumn = Number(results?.[0]?.count || 0) > 0;
  if (hasColumn) {
    return;
  }

  await sequelize.query(`
    ALTER TABLE \`user\`
    ADD COLUMN \`mobile_number\` VARCHAR(20) NULL AFTER \`email\`
  `);
};

const ensureCourseEnrollmentTrackingColumns = async () => {
  const columns = [
    {
      name: 'enrollment_source',
      sql: "ADD COLUMN `enrollment_source` ENUM('rider_self','admin') NOT NULL DEFAULT 'rider_self' AFTER `status`",
    },
    {
      name: 'enrolled_by_type',
      sql: "ADD COLUMN `enrolled_by_type` ENUM('rider','admin') NULL AFTER `enrollment_source`",
    },
    {
      name: 'enrolled_by_id',
      sql: 'ADD COLUMN `enrolled_by_id` INT NULL AFTER `enrolled_by_type`',
    },
  ];

  for (const column of columns) {
    const [results] = await sequelize.query(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'course_enrollments'
        AND COLUMN_NAME = '${column.name}'
    `);
    const hasColumn = Number(results?.[0]?.count || 0) > 0;
    if (!hasColumn) {
      await sequelize.query(`
        ALTER TABLE \`course_enrollments\`
        ${column.sql}
      `);
    }
  }
};

const ensureCoachReviewsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`coach_reviews\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`coach_id\` INT NOT NULL,
      \`course_id\` INT NOT NULL,
      \`reviewer_type\` ENUM('rider','admin') NOT NULL,
      \`reviewer_user_id\` INT NULL,
      \`reviewer_admin_id\` INT NULL,
      \`stars\` TINYINT UNSIGNED NOT NULL,
      \`comment\` VARCHAR(500) NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_coach_reviews_coach\` FOREIGN KEY (\`coach_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_coach_reviews_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_coach_reviews_reviewer_user\` FOREIGN KEY (\`reviewer_user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_coach_reviews_reviewer_admin\` FOREIGN KEY (\`reviewer_admin_id\`) REFERENCES \`admin\`(\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`uq_coach_reviews_rider_once_per_course\` UNIQUE (\`coach_id\`, \`course_id\`, \`reviewer_user_id\`),
      INDEX \`idx_coach_reviews_coach\` (\`coach_id\`),
      INDEX \`idx_coach_reviews_course\` (\`course_id\`)
    )
  `);
};

export const applySchemaUpdates = async () => {
  await ensureUserIsActiveColumn();
  await ensureUserMobileNumberColumn();
  await ensureStableAddressColumns();
  await ensureUserProfileExtraColumns();
  await ensureCoursesStableAssociation();
  await ensureCourseEnrollmentTrackingColumns();
  await ensureCoachReviewsTable();
  await ensureCoursesMaxEnrollmentAndRemoveDurationWeeks();
  await ensureHorseAndArenaDescriptionColumns();
  await ensureCourseSessionCancelReasonColumn();
  await ensureCourseSessionCancelledByColumn();
};
