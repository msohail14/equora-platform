import { CoachPayout, Course, CourseSession, Horse, LessonBooking, User } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const getCoachDashboard = async ({ coachId }) => {
  const today = new Date().toISOString().split('T')[0];

  let todaySessions = [];
  let upcomingSessionsCount = 0;
  let totalEarnings = 0;
  let pendingPayouts = 0;
  let totalRiders = 0;

  try {
    todaySessions = await CourseSession.findAll({
      where: {
        coach_id: coachId,
        session_date: today,
      },
      include: [
        { model: User, as: 'rider', attributes: ['id', 'first_name', 'last_name', 'profile_picture_url'] },
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: Horse, as: 'horse', attributes: ['id', 'name'] },
      ],
      order: [['start_time', 'ASC']],
    });
  } catch (e) {
    console.error('Coach dashboard - todaySessions error:', e.message);
  }

  try {
    upcomingSessionsCount = await CourseSession.count({
      where: {
        coach_id: coachId,
        status: 'scheduled',
        session_date: { [Op.gt]: today },
      },
    });
  } catch (e) {
    console.error('Coach dashboard - upcomingCount error:', e.message);
  }

  try {
    const totalEarningsResult = await CoachPayout.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      where: { coach_id: coachId, status: 'paid' },
      raw: true,
    });
    totalEarnings = parseFloat(totalEarningsResult?.total || 0);
  } catch (e) {
    console.error('Coach dashboard - totalEarnings error:', e.message);
  }

  try {
    const pendingPayoutsResult = await CoachPayout.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      where: { coach_id: coachId, status: 'pending' },
      raw: true,
    });
    pendingPayouts = parseFloat(pendingPayoutsResult?.total || 0);
  } catch (e) {
    console.error('Coach dashboard - pendingPayouts error:', e.message);
  }

  try {
    totalRiders = await CourseSession.count({
      where: { coach_id: coachId, rider_id: { [Op.ne]: null } },
      distinct: true,
      col: 'rider_id',
    });
  } catch (e) {
    console.error('Coach dashboard - totalRiders error:', e.message);
  }

  return {
    todaySessions,
    upcomingSessionsCount,
    totalEarnings,
    pendingPayouts,
    totalRiders,
  };
};

export const getCoachEarnings = async ({ coachId, months }) => {
  const safeMonths = Number(months) > 0 ? Number(months) : 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - safeMonths);

  const monthly = await CoachPayout.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'earnings'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      coach_id: coachId,
      created_at: { [Op.gte]: startDate },
    },
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
    order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ASC']],
    raw: true,
  });

  const totals = await CoachPayout.findAll({
    attributes: [
      'status',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: { coach_id: coachId },
    group: ['status'],
    raw: true,
  });

  const byStatus = {};
  for (const row of totals) {
    byStatus[row.status] = {
      total: parseFloat(row.total || 0),
      count: parseInt(row.count || 0, 10),
    };
  }

  return {
    months: safeMonths,
    earnings: monthly.map((m) => ({
      month: m.month,
      earnings: parseFloat(m.earnings || 0),
      count: parseInt(m.count || 0, 10),
    })),
    byStatus,
  };
};
