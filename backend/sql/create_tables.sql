CREATE TABLE IF NOT EXISTS `user` (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('rider', 'coach') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL,
    reset_password_token VARCHAR(255) NULL,
    reset_password_expires DATETIME NULL,
    profile_picture_url VARCHAR(255),
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verification_otp VARCHAR(10) NULL,
    email_verification_expires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_password_token VARCHAR(255) NULL,
    reset_password_expires DATETIME NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    location_address TEXT NOT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    logo_url VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_id INT,
    CONSTRAINT fk_stables_admin_id FOREIGN KEY (admin_id) REFERENCES admin(id)
);

CREATE TABLE IF NOT EXISTS disciplines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon_url VARCHAR(255),
    description TEXT,
    difficulty_level VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS arenas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stable_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    capacity INT NOT NULL DEFAULT 1,
    discipline_id INT NOT NULL,
    CONSTRAINT fk_arenas_stable_id FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    CONSTRAINT fk_arenas_discipline_id FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS horses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    breed VARCHAR(100),
    discipline_id INT NOT NULL,
    profile_picture_url VARCHAR(255),
    stable_id INT NOT NULL,
    status ENUM('available', 'busy', 'resting', 'injured') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_horses_stable_id FOREIGN KEY (stable_id) REFERENCES stables(id) ON DELETE CASCADE,
    CONSTRAINT fk_horses_discipline_id FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    coach_id INT NOT NULL,
    discipline_id INT NOT NULL,
    course_type ENUM('one_to_one', 'group') DEFAULT 'one_to_one',
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
    focus_type ENUM('rider_focused', 'horse_focused', 'balanced'),
    duration_days INT,
    max_session_duration INT COMMENT 'Duration of one session in minutes',
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    total_sessions INT,
    max_enrollment INT,
    price DECIMAL(10, 2),
    thumbnail_url VARCHAR(255),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_coach_id FOREIGN KEY (coach_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_courses_discipline_id FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS coach_weekly_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coach_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Monday ... 7=Sunday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes SMALLINT NOT NULL DEFAULT 60 COMMENT 'Booking slot size for this window',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from DATE NULL,
    valid_to DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_coach_weekly_availability_coach_id FOREIGN KEY (coach_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT chk_cwa_day_of_week CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_cwa_time_range CHECK (end_time > start_time),
    CONSTRAINT chk_cwa_slot_duration CHECK (slot_duration_minutes > 0)
);

CREATE INDEX idx_cwa_lookup
ON coach_weekly_availability (coach_id, day_of_week, is_active, start_time, end_time);

CREATE INDEX idx_cwa_validity
ON coach_weekly_availability (coach_id, valid_from, valid_to);

CREATE TABLE IF NOT EXISTS coach_availability_exceptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coach_id INT NOT NULL,
    exception_date DATE NOT NULL,
    exception_type ENUM('unavailable', 'available') NOT NULL DEFAULT 'unavailable',
    start_time TIME NULL COMMENT 'NULL + NULL means full-day exception',
    end_time TIME NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_coach_availability_exceptions_coach_id FOREIGN KEY (coach_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT chk_cae_time_pair CHECK (
      (start_time IS NULL AND end_time IS NULL) OR
      (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    )
);

CREATE INDEX idx_cae_lookup
ON coach_availability_exceptions (coach_id, exception_date, exception_type, start_time, end_time);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    rider_id INT NOT NULL,
    status ENUM('active', 'cancelled', 'completed') NOT NULL DEFAULT 'active',
    enrollment_source ENUM('rider_self', 'admin') NOT NULL DEFAULT 'rider_self',
    enrolled_by_type ENUM('rider', 'admin') NULL,
    enrolled_by_id INT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_enrollments_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_enrollments_rider_id FOREIGN KEY (rider_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT uq_course_enrollments_course_rider UNIQUE (course_id, rider_id)
);

CREATE INDEX idx_course_enrollments_course_status
ON course_enrollments (course_id, status);

CREATE INDEX idx_course_enrollments_rider_status
ON course_enrollments (rider_id, status);

CREATE TABLE IF NOT EXISTS course_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    coach_id INT NOT NULL,
    rider_id INT NULL,
    created_by_user_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    cancel_reason VARCHAR(255) NULL,
    cancelled_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_sessions_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_sessions_coach_id FOREIGN KEY (coach_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_sessions_rider_id FOREIGN KEY (rider_id) REFERENCES user(id) ON DELETE SET NULL,
    CONSTRAINT fk_course_sessions_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES user(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_sessions_cancelled_by_user_id FOREIGN KEY (cancelled_by_user_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE INDEX idx_course_sessions_course_schedule
ON course_sessions (course_id, session_date, start_time, status);

CREATE INDEX idx_course_sessions_coach_schedule
ON course_sessions (coach_id, session_date, start_time, status);
