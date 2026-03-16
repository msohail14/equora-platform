import { Arena, Course, CourseSession, Horse, HorseAvailability, LessonBooking, Payment, Stable, User } from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ensureStableOwnedByAdmin = async (adminId, stableId) => {
  const stable = await Stable.findOne({
    where: { id: stableId, admin_id: adminId },
  });
  if (!stable) {
    throw new Error('Stable not found or access denied.');
  }
  return stable;
};

const getAdminStableIds = async (adminId) => {
  const stables = await Stable.findAll({
    attributes: ['id'],
    where: { admin_id: adminId },
  });
  return stables.map((s) => s.id);
};

export const getStableDashboardOverview = async ({ adminId }) => {
  const stableIds = await getAdminStableIds(adminId);

  if (stableIds.length === 0) {
    return {
      totalStables: 0,
      totalHorses: 0,
      totalArenas: 0,
      totalBookings: 0,
      totalCourses: 0,
      totalRevenue: 0,
      stables: [],
    };
  }

  const stables = await Stable.findAll({
    where: { id: { [Op.in]: stableIds } },
    attributes: ['id', 'name', 'location_address', 'logo_url'],
  });

  const [totalHorses, totalArenas, totalBookings, totalCourses] = await Promise.all([
    Horse.count({ where: { stable_id: { [Op.in]: stableIds } } }),
    Arena.count({ where: { stable_id: { [Op.in]: stableIds } } }),
    LessonBooking.count({ where: { stable_id: { [Op.in]: stableIds } } }),
    Course.count({ where: { stable_id: { [Op.in]: stableIds } } }),
  ]);

  const revenueResult = await Payment.findOne({
    attributes: [[sequelize.fn('SUM', sequelize.col('Payment.amount')), 'total']],
    where: { status: 'completed' },
    include: [
      {
        model: LessonBooking,
        as: 'booking',
        attributes: [],
        required: true,
        where: { stable_id: { [Op.in]: stableIds } },
      },
    ],
    raw: true,
  });

  const totalRevenue = parseFloat(revenueResult?.total || 0);

  const stableDetails = await Promise.all(
    stables.map(async (stable) => {
      const [horses, arenas, bookings, courses] = await Promise.all([
        Horse.count({ where: { stable_id: stable.id } }),
        Arena.count({ where: { stable_id: stable.id } }),
        LessonBooking.count({ where: { stable_id: stable.id } }),
        Course.count({ where: { stable_id: stable.id } }),
      ]);
      return {
        id: stable.id,
        name: stable.name,
        location_address: stable.location_address,
        logo_url: stable.logo_url,
        horses,
        arenas,
        bookings,
        courses,
      };
    })
  );

  return {
    totalStables: stableIds.length,
    totalHorses,
    totalArenas,
    totalBookings,
    totalCourses,
    totalRevenue,
    stables: stableDetails,
  };
};

export const getArenaSchedule = async ({ adminId, stableId, startDate, endDate }) => {
  if (!stableId) {
    throw new Error('stable_id is required.');
  }
  if (!startDate || !endDate) {
    throw new Error('start_date and end_date are required.');
  }

  await ensureStableOwnedByAdmin(adminId, stableId);

  const courses = await Course.findAll({
    attributes: ['id'],
    where: { stable_id: stableId },
    raw: true,
  });

  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) {
    return { schedule: {} };
  }

  const sessions = await CourseSession.findAll({
    where: {
      course_id: { [Op.in]: courseIds },
      session_date: { [Op.between]: [startDate, endDate] },
    },
    include: [
      { model: Arena, as: 'arena', attributes: ['id', 'name', 'capacity'] },
      { model: Course, as: 'course', attributes: ['id', 'name', 'stable_id'] },
      { model: User, as: 'coach', attributes: ['id', 'first_name', 'last_name'] },
      { model: User, as: 'rider', attributes: ['id', 'first_name', 'last_name'] },
      { model: Horse, as: 'horse', attributes: ['id', 'name'] },
    ],
    order: [['session_date', 'ASC'], ['start_time', 'ASC']],
  });

  const grouped = {};
  for (const session of sessions) {
    const date = session.session_date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(session);
  }

  return { schedule: grouped };
};

export const getStableRevenue = async ({ adminId, stableId, months }) => {
  if (!stableId) {
    throw new Error('stable_id is required.');
  }

  await ensureStableOwnedByAdmin(adminId, stableId);

  const safeMonths = Number(months) > 0 ? Number(months) : 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - safeMonths);

  const payments = await Payment.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('Payment.created_at'), '%Y-%m'), 'month'],
      [sequelize.fn('SUM', sequelize.col('Payment.amount')), 'revenue'],
      [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'count'],
    ],
    where: {
      status: 'completed',
      created_at: { [Op.gte]: startDate },
    },
    include: [
      {
        model: LessonBooking,
        as: 'booking',
        attributes: [],
        required: true,
        where: { stable_id: stableId },
      },
    ],
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('Payment.created_at'), '%Y-%m')],
    order: [[sequelize.fn('DATE_FORMAT', sequelize.col('Payment.created_at'), '%Y-%m'), 'ASC']],
    raw: true,
  });

  return {
    months: safeMonths,
    revenue: payments.map((p) => ({
      month: p.month,
      revenue: parseFloat(p.revenue || 0),
      count: parseInt(p.count || 0, 10),
    })),
  };
};

export const getHorseUtilization = async ({ adminId, stableId }) => {
  if (!stableId) {
    throw new Error('stable_id is required.');
  }

  await ensureStableOwnedByAdmin(adminId, stableId);

  const horses = await Horse.findAll({
    where: { stable_id: stableId },
    attributes: ['id', 'name', 'breed', 'image_url'],
  });

  const utilization = await Promise.all(
    horses.map(async (horse) => {
      const [sessionCount, bookingCount] = await Promise.all([
        CourseSession.count({ where: { horse_id: horse.id } }),
        LessonBooking.count({ where: { horse_id: horse.id } }),
      ]);
      return {
        id: horse.id,
        name: horse.name,
        breed: horse.breed,
        image_url: horse.image_url,
        sessionCount,
        bookingCount,
        totalUsage: sessionCount + bookingCount,
      };
    })
  );

  return { horses: utilization };
};
