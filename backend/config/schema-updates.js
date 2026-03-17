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

const ensurePaymentsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`payments\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`transaction_id\` VARCHAR(255) UNIQUE NOT NULL,
      \`user_id\` INT NOT NULL,
      \`amount\` DECIMAL(10, 2) NOT NULL,
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'SAR',
      \`status\` ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
      \`provider\` ENUM('tappay','hyperpay','manual') NOT NULL,
      \`provider_reference\` VARCHAR(255) NULL,
      \`payment_type\` ENUM('subscription','session','course','tip') NOT NULL,
      \`related_id\` INT NULL,
      \`metadata\` JSON NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_payments_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_payments_user\` (\`user_id\`, \`status\`),
      INDEX \`idx_payments_transaction\` (\`transaction_id\`)
    )
  `);
};

const ensureSubscriptionsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`subscriptions\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`user_id\` INT NOT NULL,
      \`plan_type\` ENUM('basic','premium','pro') NOT NULL,
      \`status\` ENUM('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
      \`start_date\` DATE NOT NULL,
      \`end_date\` DATE NOT NULL,
      \`auto_renew\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`payment_id\` INT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_subscriptions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_subscriptions_payment\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payments\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_subscriptions_user\` (\`user_id\`, \`status\`),
      INDEX \`idx_subscriptions_expiry\` (\`end_date\`, \`status\`)
    )
  `);
};

const ensureCoachPayoutsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`coach_payouts\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`coach_id\` INT NOT NULL,
      \`session_id\` INT NULL,
      \`amount\` DECIMAL(10, 2) NOT NULL,
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'SAR',
      \`status\` ENUM('pending','processing','paid','failed') NOT NULL DEFAULT 'pending',
      \`payout_date\` DATE NULL,
      \`reference\` VARCHAR(255) NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_coach_payouts_coach\` FOREIGN KEY (\`coach_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_coach_payouts_session\` FOREIGN KEY (\`session_id\`) REFERENCES \`course_sessions\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_coach_payouts_coach\` (\`coach_id\`, \`status\`)
    )
  `);
};

const ensureColumnExists = async (table, column, alterSql) => {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND COLUMN_NAME = '${column}'
  `);
  const hasColumn = Number(results?.[0]?.count || 0) > 0;
  if (!hasColumn) {
    await sequelize.query(`ALTER TABLE \`${table}\` ${alterSql}`);
  }
};

const ensureHorseNewColumns = async () => {
  await ensureColumnExists('horses', 'age', 'ADD COLUMN `age` INT NULL AFTER `description`');
  await ensureColumnExists('horses', 'training_level', "ADD COLUMN `training_level` ENUM('beginner','intermediate','advanced') NULL AFTER `age`");
  await ensureColumnExists('horses', 'temperament', 'ADD COLUMN `temperament` VARCHAR(100) NULL AFTER `training_level`');
  await ensureColumnExists('horses', 'injury_notes', 'ADD COLUMN `injury_notes` TEXT NULL AFTER `temperament`');
  await ensureColumnExists('horses', 'rider_suitability', 'ADD COLUMN `rider_suitability` VARCHAR(255) NULL AFTER `injury_notes`');
  await ensureColumnExists('horses', 'fei_pedigree_link', 'ADD COLUMN `fei_pedigree_link` VARCHAR(512) NULL AFTER `rider_suitability`');
  await ensureColumnExists('horses', 'max_daily_sessions', 'ADD COLUMN `max_daily_sessions` INT NOT NULL DEFAULT 3 AFTER `fei_pedigree_link`');
};

const ensureUserNewColumns = async () => {
  await ensureColumnExists('user', 'fei_number', 'ADD COLUMN `fei_number` VARCHAR(50) NULL AFTER `gender`');
  await ensureColumnExists('user', 'riding_level', "ADD COLUMN `riding_level` ENUM('beginner','intermediate','advanced') NULL AFTER `fei_number`");
  await ensureColumnExists('user', 'specialties', 'ADD COLUMN `specialties` JSON NULL AFTER `riding_level`');
  await ensureColumnExists('user', 'bio', 'ADD COLUMN `bio` TEXT NULL AFTER `specialties`');
  await ensureColumnExists('user', 'is_verified', 'ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT FALSE AFTER `bio`');
  await ensureColumnExists('user', 'fcm_token', 'ADD COLUMN `fcm_token` VARCHAR(255) NULL AFTER `is_verified`');
};

const ensureStableNewColumns = async () => {
  await ensureColumnExists('stables', 'rating', 'ADD COLUMN `rating` DECIMAL(3,2) NULL AFTER `description`');
  await ensureColumnExists('stables', 'lesson_price_min', 'ADD COLUMN `lesson_price_min` DECIMAL(10,2) NULL AFTER `rating`');
  await ensureColumnExists('stables', 'lesson_price_max', 'ADD COLUMN `lesson_price_max` DECIMAL(10,2) NULL AFTER `lesson_price_min`');
  await ensureColumnExists('stables', 'is_approved', 'ADD COLUMN `is_approved` BOOLEAN NOT NULL DEFAULT FALSE AFTER `lesson_price_max`');
};

const ensureArenaIsActiveColumn = async () => {
  await ensureColumnExists('arenas', 'is_active', 'ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `discipline_id`');
};

const ensureCourseSessionNewColumns = async () => {
  await ensureColumnExists('course_sessions', 'horse_id', 'ADD COLUMN `horse_id` INT NULL AFTER `cancelled_by_user_id`');
  await ensureColumnExists('course_sessions', 'arena_id', 'ADD COLUMN `arena_id` INT NULL AFTER `horse_id`');
  await ensureColumnExists('course_sessions', 'course_template_id', 'ADD COLUMN `course_template_id` INT NULL AFTER `arena_id`');
};

const ensureCourseLayoutColumns = async () => {
  await ensureColumnExists('courses', 'layout_image_url', 'ADD COLUMN `layout_image_url` VARCHAR(512) NULL AFTER `thumbnail_url`');
  await ensureColumnExists('courses', 'layout_drawing_data', 'ADD COLUMN `layout_drawing_data` JSON NULL AFTER `layout_image_url`');
};

const ensureNotificationsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`notifications\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`user_id\` INT NULL,
      \`admin_id\` INT NULL,
      \`type\` ENUM('lesson_booked','session_reminder','payment_confirmed','horse_assigned','horse_approved','feedback_posted','coach_verified','stable_approved','payout_processed','general') NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`body\` TEXT NULL,
      \`data\` JSON NULL,
      \`is_read\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_notifications_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_notifications_admin\` FOREIGN KEY (\`admin_id\`) REFERENCES \`admin\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_notifications_user\` (\`user_id\`, \`is_read\`),
      INDEX \`idx_notifications_admin\` (\`admin_id\`, \`is_read\`)
    )
  `);
};

const ensureLessonBookingsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`lesson_bookings\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`rider_id\` INT NOT NULL,
      \`coach_id\` INT NOT NULL,
      \`stable_id\` INT NOT NULL,
      \`arena_id\` INT NULL,
      \`horse_id\` INT NULL,
      \`session_id\` INT NULL,
      \`booking_date\` DATE NOT NULL,
      \`start_time\` TIME NOT NULL,
      \`end_time\` TIME NOT NULL,
      \`lesson_type\` ENUM('private','group') NOT NULL DEFAULT 'private',
      \`status\` ENUM('pending_horse_approval','pending_payment','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending_horse_approval',
      \`payment_id\` INT NULL,
      \`price\` DECIMAL(10,2) NULL,
      \`notes\` TEXT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_lesson_bookings_rider\` FOREIGN KEY (\`rider_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lesson_bookings_coach\` FOREIGN KEY (\`coach_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lesson_bookings_stable\` FOREIGN KEY (\`stable_id\`) REFERENCES \`stables\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_lesson_bookings_arena\` FOREIGN KEY (\`arena_id\`) REFERENCES \`arenas\`(\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_lesson_bookings_horse\` FOREIGN KEY (\`horse_id\`) REFERENCES \`horses\`(\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_lesson_bookings_session\` FOREIGN KEY (\`session_id\`) REFERENCES \`course_sessions\`(\`id\`) ON DELETE SET NULL,
      CONSTRAINT \`fk_lesson_bookings_payment\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payments\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_lesson_bookings_rider\` (\`rider_id\`, \`status\`),
      INDEX \`idx_lesson_bookings_coach\` (\`coach_id\`, \`status\`),
      INDEX \`idx_lesson_bookings_date\` (\`booking_date\`, \`status\`)
    )
  `);
};

const ensureHorseAvailabilityTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`horse_availability\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`horse_id\` INT NOT NULL,
      \`date\` DATE NOT NULL,
      \`max_sessions_per_day\` INT NOT NULL DEFAULT 3,
      \`sessions_booked\` INT NOT NULL DEFAULT 0,
      \`is_available\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_horse_availability_horse\` FOREIGN KEY (\`horse_id\`) REFERENCES \`horses\`(\`id\`) ON DELETE CASCADE,
      UNIQUE KEY \`uq_horse_availability_date\` (\`horse_id\`, \`date\`),
      INDEX \`idx_horse_availability_date\` (\`date\`, \`is_available\`)
    )
  `);
};

const ensureLessonPackagesTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`lesson_packages\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`coach_id\` INT NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`description\` TEXT NULL,
      \`lesson_count\` INT NOT NULL,
      \`price\` DECIMAL(10,2) NOT NULL,
      \`currency\` VARCHAR(10) NOT NULL DEFAULT 'SAR',
      \`validity_days\` INT NOT NULL DEFAULT 30,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_lesson_packages_coach\` FOREIGN KEY (\`coach_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_lesson_packages_coach\` (\`coach_id\`, \`is_active\`)
    )
  `);
};

const ensureRiderPackageBalancesTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`rider_package_balances\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`rider_id\` INT NOT NULL,
      \`package_id\` INT NOT NULL,
      \`remaining_lessons\` INT NOT NULL,
      \`purchased_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`expires_at\` DATE NOT NULL,
      \`payment_id\` INT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_rider_package_balances_rider\` FOREIGN KEY (\`rider_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_rider_package_balances_package\` FOREIGN KEY (\`package_id\`) REFERENCES \`lesson_packages\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_rider_package_balances_payment\` FOREIGN KEY (\`payment_id\`) REFERENCES \`payments\`(\`id\`) ON DELETE SET NULL,
      INDEX \`idx_rider_package_balances_rider\` (\`rider_id\`, \`expires_at\`)
    )
  `);
};

const ensureCourseTemplatesTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`course_templates\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`coach_id\` INT NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      \`difficulty\` ENUM('beginner','intermediate','advanced') NULL,
      \`obstacles\` JSON NULL,
      \`distances\` JSON NULL,
      \`arena_layout\` JSON NULL,
      \`notes\` TEXT NULL,
      \`layout_image_url\` VARCHAR(512) NULL,
      \`layout_drawing_data\` JSON NULL,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_course_templates_coach\` FOREIGN KEY (\`coach_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      INDEX \`idx_course_templates_coach\` (\`coach_id\`, \`is_active\`)
    )
  `);
};

const ensureSessionFeedbackTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`session_feedback\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`session_id\` INT NOT NULL,
      \`coach_id\` INT NOT NULL,
      \`rider_id\` INT NOT NULL,
      \`feedback_text\` TEXT NULL,
      \`performance_rating\` TINYINT UNSIGNED NULL,
      \`areas_to_improve\` JSON NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_session_feedback_session\` FOREIGN KEY (\`session_id\`) REFERENCES \`course_sessions\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_session_feedback_coach\` FOREIGN KEY (\`coach_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_session_feedback_rider\` FOREIGN KEY (\`rider_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
      UNIQUE KEY \`uq_session_feedback_session\` (\`session_id\`),
      INDEX \`idx_session_feedback_rider\` (\`rider_id\`)
    )
  `);
};

const ensurePlatformSettingsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`platform_settings\` (
      \`id\` INT PRIMARY KEY AUTO_INCREMENT,
      \`key\` VARCHAR(100) NOT NULL UNIQUE,
      \`value\` JSON NULL,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const ensureAdminRoleColumn = async () => {
  const [results] = await sequelize.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'admin'
      AND COLUMN_NAME = 'role'
  `);
  const hasColumn = Number(results?.[0]?.count || 0) > 0;
  if (!hasColumn) {
    await sequelize.query(`
      ALTER TABLE \`admin\`
      ADD COLUMN \`role\` ENUM('super_admin', 'stable_owner') NOT NULL DEFAULT 'super_admin' AFTER \`last_name\`
    `);
  }
};

const ensureFeaturedColumns = async () => {
  await ensureColumnExists('stables', 'is_featured', 'ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT FALSE AFTER `lesson_price_max`');
  await ensureColumnExists('user', 'is_featured', 'ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT FALSE AFTER `bio`');
  await ensureColumnExists('horses', 'is_featured', 'ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT FALSE AFTER `max_daily_sessions`');
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
  await ensurePaymentsTable();
  await ensureSubscriptionsTable();
  await ensureCoachPayoutsTable();
  await ensureHorseNewColumns();
  await ensureUserNewColumns();
  await ensureStableNewColumns();
  await ensureArenaIsActiveColumn();
  await ensureCourseLayoutColumns();
  await ensureNotificationsTable();
  await ensureLessonBookingsTable();
  await ensureHorseAvailabilityTable();
  await ensureLessonPackagesTable();
  await ensureRiderPackageBalancesTable();
  await ensureCourseTemplatesTable();
  await ensureSessionFeedbackTable();
  await ensurePlatformSettingsTable();
  await ensureCourseSessionNewColumns();
  await ensureAdminRoleColumn();
  await ensureFeaturedColumns();
};
