import { Course, CourseEnrollment, User } from '../models/index.js';
import { createNotification } from './notification.service.js';

const enrollmentInclude = [
  {
    model: Course,
    as: 'course',
    attributes: ['id', 'title', 'course_type', 'coach_id', 'is_active', 'status'],
  },
  {
    model: User,
    as: 'rider',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
];

const ensureCourseForEnrollment = async (course_id) => {
  const course = await Course.findByPk(course_id);
  if (!course || !course.is_active) {
    throw new Error('Course not found.');
  }
  return course;
};

const ensureActiveRider = async (riderId) => {
  const rider = await User.findByPk(riderId);
  if (!rider || rider.role !== 'rider') {
    throw new Error('Invalid rider.');
  }
  if (!rider.is_active) {
    throw new Error('Rider account is inactive.');
  }
  return rider;
};

export const createEnrollment = async ({ user, course_id }) => {
  if (user?.role !== 'rider') {
    throw new Error('Only riders can enroll in courses.');
  }
  if (!course_id) {
    throw new Error('course_id is required.');
  }

  const course = await ensureCourseForEnrollment(course_id);
  if (course.max_enrollment) {
    const activeEnrollmentsCount = await CourseEnrollment.count({
      where: { course_id, status: 'active' },
    });
    if (activeEnrollmentsCount >= course.max_enrollment) {
      throw new Error('Course enrollment limit reached.');
    }
  }

  await ensureActiveRider(user.id);

  const existing = await CourseEnrollment.findOne({
    where: { course_id, rider_id: user.id },
  });

  if (existing && existing.status === 'active') {
    throw new Error('You are already enrolled in this course.');
  }

  if (existing && existing.status !== 'active') {
    existing.status = 'active';
    existing.enrolled_at = new Date();
    existing.enrollment_source = 'rider_self';
    existing.enrolled_by_type = 'rider';
    existing.enrolled_by_id = user.id;
    await existing.save();
    return CourseEnrollment.findByPk(existing.id, { include: enrollmentInclude });
  }

  const enrollment = await CourseEnrollment.create({
    course_id,
    rider_id: user.id,
    status: 'active',
    enrollment_source: 'rider_self',
    enrolled_by_type: 'rider',
    enrolled_by_id: user.id,
  });

  // Notify rider of enrollment
  try {
    await createNotification({
      userId: user.id,
      type: 'course_enrolled',
      title: 'Enrollment Confirmed',
      body: `You have been enrolled in "${course.title}".`,
      data: { course_id: course.id, enrollment_id: enrollment.id },
    });
    // Notify course coach
    if (course.coach_id) {
      const rider = await User.findByPk(user.id, { attributes: ['first_name', 'last_name'] });
      const riderName = rider ? `${rider.first_name} ${rider.last_name}`.trim() : 'A rider';
      await createNotification({
        userId: course.coach_id,
        type: 'course_enrolled',
        title: 'New Enrollment',
        body: `${riderName} enrolled in your course "${course.title}".`,
        data: { course_id: course.id, enrollment_id: enrollment.id, rider_id: user.id },
      });
    }
  } catch (_) {
    // Non-critical — don't fail enrollment if notification fails
  }

  return CourseEnrollment.findByPk(enrollment.id, { include: enrollmentInclude });
};

export const createEnrollmentsByAdmin = async ({ user, course_id, rider_ids }) => {
  if (user?.type !== 'admin') {
    throw new Error('Admin access only.');
  }
  if (!course_id) {
    throw new Error('course_id is required.');
  }
  if (!Array.isArray(rider_ids) || rider_ids.length === 0) {
    throw new Error('rider_ids must be a non-empty array.');
  }

  const uniqueRiderIds = [...new Set(rider_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueRiderIds.length) {
    throw new Error('No valid rider ids found in rider_ids.');
  }

  const course = await ensureCourseForEnrollment(course_id);

  const riders = await User.findAll({
    where: {
      id: uniqueRiderIds,
      role: 'rider',
      is_active: true,
    },
    attributes: ['id'],
  });
  const activeRiderIds = riders.map((r) => r.id);

  const result = {
    enrolled: [],
    skipped: [],
  };

  if (!activeRiderIds.length) {
    return {
      message: 'No active riders selected.',
      ...result,
    };
  }

  let activeEnrollmentsCount = await CourseEnrollment.count({
    where: { course_id, status: 'active' },
  });

  for (const riderId of uniqueRiderIds) {
    if (!activeRiderIds.includes(riderId)) {
      result.skipped.push({ rider_id: riderId, reason: 'inactive_or_invalid_rider' });
      continue;
    }

    if (course.max_enrollment && activeEnrollmentsCount >= course.max_enrollment) {
      result.skipped.push({ rider_id: riderId, reason: 'course_enrollment_limit_reached' });
      continue;
    }

    const existing = await CourseEnrollment.findOne({
      where: { course_id, rider_id: riderId },
    });

    if (existing && existing.status === 'active') {
      result.skipped.push({ rider_id: riderId, reason: 'already_enrolled' });
      continue;
    }

    if (existing) {
      existing.status = 'active';
      existing.enrolled_at = new Date();
      existing.enrollment_source = 'admin';
      existing.enrolled_by_type = 'admin';
      existing.enrolled_by_id = user.id;
      await existing.save();
      result.enrolled.push({ rider_id: riderId, enrollment_id: existing.id, reactivated: true });
      activeEnrollmentsCount += 1;
      continue;
    }

    const enrollment = await CourseEnrollment.create({
      course_id,
      rider_id: riderId,
      status: 'active',
      enrollment_source: 'admin',
      enrolled_by_type: 'admin',
      enrolled_by_id: user.id,
    });
    result.enrolled.push({ rider_id: riderId, enrollment_id: enrollment.id, reactivated: false });
    activeEnrollmentsCount += 1;
  }

  return {
    message: 'Bulk enrollment processed.',
    ...result,
  };
};

export const getMyEnrollments = async ({ user }) =>
  CourseEnrollment.findAll({
    where: { rider_id: user.id },
    include: enrollmentInclude,
    order: [['id', 'DESC']],
  });

export const getCourseEnrollments = async ({ user, courseId }) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new Error('Course not found.');
  }

  if (user.role === 'coach' && course.coach_id !== user.id) {
    throw new Error('Access denied. You can only view enrollments for your own course.');
  }
  if (!['coach', 'admin'].includes(user.role) && user.type !== 'admin') {
    throw new Error('Access denied.');
  }

  return CourseEnrollment.findAll({
    where: { course_id: courseId },
    include: enrollmentInclude,
    order: [['id', 'DESC']],
  });
};

export const getAllEnrollments = async ({ user }) => {
  if (user.type !== 'admin') {
    throw new Error('Admin access only.');
  }

  return CourseEnrollment.findAll({
    include: enrollmentInclude,
    order: [['id', 'DESC']],
  });
};

export const updateEnrollmentStatus = async ({ user, enrollmentId, status }) => {
  if (!['active', 'cancelled', 'completed'].includes(status)) {
    throw new Error('Invalid enrollment status.');
  }

  const enrollment = await CourseEnrollment.findByPk(enrollmentId, {
    include: [{ model: Course, as: 'course', attributes: ['id', 'coach_id'] }],
  });
  if (!enrollment) {
    throw new Error('Enrollment not found.');
  }

  const isRiderOwner = user.role === 'rider' && enrollment.rider_id === user.id;
  const isCourseCoach = user.role === 'coach' && enrollment.course?.coach_id === user.id;
  const isAdmin = user.type === 'admin';

  if (!isRiderOwner && !isCourseCoach && !isAdmin) {
    throw new Error('Access denied.');
  }

  enrollment.status = status;
  await enrollment.save();

  return CourseEnrollment.findByPk(enrollment.id, { include: enrollmentInclude });
};

export const withdrawEnrollment = async ({ user, enrollmentId }) => {
  const enrollment = await CourseEnrollment.findByPk(enrollmentId, {
    include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'coach_id'] }],
  });
  if (!enrollment) {
    throw new Error('Enrollment not found.');
  }

  const isRiderOwner = user.role === 'rider' && enrollment.rider_id === user.id;
  const isAdmin = user.type === 'admin';
  if (!isRiderOwner && !isAdmin) {
    throw new Error('Access denied.');
  }

  if (enrollment.status === 'cancelled') {
    throw new Error('Enrollment already cancelled.');
  }

  enrollment.status = 'cancelled';
  await enrollment.save();

  return { message: 'Enrollment withdrawn successfully.' };
};
