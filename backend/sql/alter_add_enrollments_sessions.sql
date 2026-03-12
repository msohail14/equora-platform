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
