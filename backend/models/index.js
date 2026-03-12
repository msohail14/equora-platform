import Admin from './admin.model.js';
import Arena from './arena.model.js';
import CoachPayout from './coachPayout.model.js';
import CoachReview from './coachReview.model.js';
import Course from './course.model.js';
import CourseEnrollment from './courseEnrollment.model.js';
import CourseSession from './courseSession.model.js';
import Discipline from './discipline.model.js';
import Horse from './horse.model.js';
import Payment from './payment.model.js';
import Stable from './stable.model.js';
import Subscription from './subscription.model.js';
import User from './user.model.js';

Admin.hasMany(Stable, { foreignKey: 'admin_id', as: 'stables' });
Stable.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

Stable.hasMany(Arena, { foreignKey: 'stable_id', as: 'arenas' });
Arena.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Discipline.hasMany(Arena, { foreignKey: 'discipline_id', as: 'arenas' });
Arena.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

Stable.hasMany(Horse, { foreignKey: 'stable_id', as: 'horses' });
Horse.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Stable.hasMany(Course, { foreignKey: 'stable_id', as: 'courses' });
Course.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Discipline.hasMany(Horse, { foreignKey: 'discipline_id', as: 'horses' });
Horse.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

User.hasMany(Course, { foreignKey: 'coach_id', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

Discipline.hasMany(Course, { foreignKey: 'discipline_id', as: 'courses' });
Course.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

Course.hasMany(CourseEnrollment, { foreignKey: 'course_id', as: 'enrollments' });
CourseEnrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

User.hasMany(CourseEnrollment, { foreignKey: 'rider_id', as: 'course_enrollments' });
CourseEnrollment.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

Course.hasMany(CourseSession, { foreignKey: 'course_id', as: 'sessions' });
CourseSession.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

User.hasMany(CourseSession, { foreignKey: 'coach_id', as: 'coached_sessions' });
CourseSession.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

User.hasMany(CourseSession, { foreignKey: 'rider_id', as: 'rider_sessions' });
CourseSession.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

User.hasMany(CourseSession, { foreignKey: 'created_by_user_id', as: 'created_sessions' });
CourseSession.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'created_by_user' });

User.hasMany(CourseSession, { foreignKey: 'cancelled_by_user_id', as: 'cancelled_sessions' });
CourseSession.belongsTo(User, { foreignKey: 'cancelled_by_user_id', as: 'cancelled_by_user' });

User.hasMany(CoachReview, { foreignKey: 'coach_id', as: 'coach_reviews' });
CoachReview.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

Course.hasMany(CoachReview, { foreignKey: 'course_id', as: 'coach_reviews' });
CoachReview.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

User.hasMany(CoachReview, { foreignKey: 'reviewer_user_id', as: 'submitted_coach_reviews' });
CoachReview.belongsTo(User, { foreignKey: 'reviewer_user_id', as: 'reviewer_user' });

Admin.hasMany(CoachReview, { foreignKey: 'reviewer_admin_id', as: 'submitted_coach_reviews' });
CoachReview.belongsTo(Admin, { foreignKey: 'reviewer_admin_id', as: 'reviewer_admin' });

User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Payment.hasOne(Subscription, { foreignKey: 'payment_id', as: 'subscription' });
Subscription.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

User.hasMany(CoachPayout, { foreignKey: 'coach_id', as: 'payouts' });
CoachPayout.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

CourseSession.hasMany(CoachPayout, { foreignKey: 'session_id', as: 'payouts' });
CoachPayout.belongsTo(CourseSession, { foreignKey: 'session_id', as: 'session' });

export {
  Admin, Arena, CoachPayout, CoachReview, Course, CourseEnrollment,
  CourseSession, Discipline, Horse, Payment, Stable, Subscription, User,
};
