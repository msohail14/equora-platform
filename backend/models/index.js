import Admin from './admin.model.js';
import Arena from './arena.model.js';
import CoachAvailabilityException from './coachAvailabilityException.model.js';
import CoachWeeklyAvailability from './coachWeeklyAvailability.model.js';
import Invitation from './invitation.model.js';
import MagicLinkToken from './magicLinkToken.model.js';
import CoachPayout from './coachPayout.model.js';
import CoachReview from './coachReview.model.js';
import CoachStable from './coachStable.model.js';
import CoachStableSchedule from './coachStableSchedule.model.js';
import Course from './course.model.js';
import CourseEnrollment from './courseEnrollment.model.js';
import CourseSession from './courseSession.model.js';
import CourseTemplate from './courseTemplate.model.js';
import Discipline from './discipline.model.js';
import Horse from './horse.model.js';
import HorseAvailability from './horseAvailability.model.js';
import LessonBooking from './lessonBooking.model.js';
import LessonPackage from './lessonPackage.model.js';
import Notification from './notification.model.js';
import ObstacleType from './obstacleType.model.js';
import Payment from './payment.model.js';
import PlatformSetting from './platformSetting.model.js';
import RiderPackageBalance from './riderPackageBalance.model.js';
import SessionFeedback from './sessionFeedback.model.js';
import Stable from './stable.model.js';
import StableRegistration from './stableRegistration.model.js';
import Subscription from './subscription.model.js';
import CoachFavouriteRider from './coachFavouriteRider.model.js';
import RiderHorse from './riderHorse.model.js';
import User from './user.model.js';

Admin.hasMany(Stable, { foreignKey: 'admin_id', as: 'stables' });
Stable.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

Stable.hasMany(Arena, { foreignKey: 'stable_id', as: 'arenas', onDelete: 'CASCADE' });
Arena.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Discipline.hasMany(Arena, { foreignKey: 'discipline_id', as: 'arenas' });
Arena.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

Stable.hasMany(Horse, { foreignKey: 'stable_id', as: 'horses', onDelete: 'CASCADE' });
Horse.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Stable.hasMany(Course, { foreignKey: 'stable_id', as: 'courses' });
Course.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Discipline.hasMany(Horse, { foreignKey: 'discipline_id', as: 'horses' });
Horse.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

User.hasMany(Course, { foreignKey: 'coach_id', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

Discipline.hasMany(Course, { foreignKey: 'discipline_id', as: 'courses' });
Course.belongsTo(Discipline, { foreignKey: 'discipline_id', as: 'discipline' });

Course.hasMany(CourseEnrollment, { foreignKey: 'course_id', as: 'enrollments', onDelete: 'CASCADE' });
CourseEnrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

User.hasMany(CourseEnrollment, { foreignKey: 'rider_id', as: 'course_enrollments' });
CourseEnrollment.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

Course.hasMany(CourseSession, { foreignKey: 'course_id', as: 'sessions', onDelete: 'CASCADE' });
CourseSession.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

User.hasMany(CourseSession, { foreignKey: 'coach_id', as: 'coached_sessions' });
CourseSession.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

User.hasMany(CourseSession, { foreignKey: 'rider_id', as: 'rider_sessions' });
CourseSession.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

User.hasMany(CourseSession, { foreignKey: 'created_by_user_id', as: 'created_sessions', onDelete: 'SET NULL' });
CourseSession.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'created_by_user' });

User.hasMany(CourseSession, { foreignKey: 'cancelled_by_user_id', as: 'cancelled_sessions', onDelete: 'SET NULL' });
CourseSession.belongsTo(User, { foreignKey: 'cancelled_by_user_id', as: 'cancelled_by_user' });

Horse.hasMany(CourseSession, { foreignKey: 'horse_id', as: 'sessions' });
CourseSession.belongsTo(Horse, { foreignKey: 'horse_id', as: 'horse' });

Arena.hasMany(CourseSession, { foreignKey: 'arena_id', as: 'sessions' });
CourseSession.belongsTo(Arena, { foreignKey: 'arena_id', as: 'arena' });

CourseTemplate.hasMany(CourseSession, { foreignKey: 'course_template_id', as: 'sessions' });
CourseSession.belongsTo(CourseTemplate, { foreignKey: 'course_template_id', as: 'course_template' });

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

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Admin.hasMany(Notification, { foreignKey: 'admin_id', as: 'notifications' });
Notification.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin' });

User.hasMany(LessonBooking, { foreignKey: 'rider_id', as: 'rider_bookings' });
LessonBooking.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

User.hasMany(LessonBooking, { foreignKey: 'coach_id', as: 'coach_bookings' });
LessonBooking.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

Stable.hasMany(LessonBooking, { foreignKey: 'stable_id', as: 'bookings' });
LessonBooking.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

Arena.hasMany(LessonBooking, { foreignKey: 'arena_id', as: 'bookings' });
LessonBooking.belongsTo(Arena, { foreignKey: 'arena_id', as: 'arena' });

Horse.hasMany(LessonBooking, { foreignKey: 'horse_id', as: 'bookings' });
LessonBooking.belongsTo(Horse, { foreignKey: 'horse_id', as: 'horse' });

CourseSession.hasOne(LessonBooking, { foreignKey: 'session_id', as: 'booking' });
LessonBooking.belongsTo(CourseSession, { foreignKey: 'session_id', as: 'session' });

Payment.hasOne(LessonBooking, { foreignKey: 'payment_id', as: 'booking' });
LessonBooking.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

Horse.hasMany(HorseAvailability, { foreignKey: 'horse_id', as: 'availability', onDelete: 'CASCADE' });
HorseAvailability.belongsTo(Horse, { foreignKey: 'horse_id', as: 'horse' });

User.hasMany(LessonPackage, { foreignKey: 'coach_id', as: 'lesson_packages' });
LessonPackage.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

User.hasMany(RiderPackageBalance, { foreignKey: 'rider_id', as: 'package_balances' });
RiderPackageBalance.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

LessonPackage.hasMany(RiderPackageBalance, { foreignKey: 'package_id', as: 'balances' });
RiderPackageBalance.belongsTo(LessonPackage, { foreignKey: 'package_id', as: 'package' });

Payment.hasOne(RiderPackageBalance, { foreignKey: 'payment_id', as: 'package_balance' });
RiderPackageBalance.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

User.hasMany(CourseTemplate, { foreignKey: 'coach_id', as: 'course_templates' });
CourseTemplate.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

CourseSession.hasOne(SessionFeedback, { foreignKey: 'session_id', as: 'feedback' });
SessionFeedback.belongsTo(CourseSession, { foreignKey: 'session_id', as: 'session' });

User.hasMany(SessionFeedback, { foreignKey: 'coach_id', as: 'given_feedback' });
SessionFeedback.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

User.hasMany(SessionFeedback, { foreignKey: 'rider_id', as: 'received_feedback' });
SessionFeedback.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

User.belongsToMany(Stable, { through: CoachStable, foreignKey: 'coach_id', otherKey: 'stable_id', as: 'linkedStables' });
Stable.belongsToMany(User, { through: CoachStable, foreignKey: 'stable_id', otherKey: 'coach_id', as: 'linkedCoaches' });

CoachStable.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });
CoachStable.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

CoachStable.hasMany(CoachStableSchedule, { foreignKey: 'coach_stable_id', as: 'schedules', onDelete: 'CASCADE' });
CoachStableSchedule.belongsTo(CoachStable, { foreignKey: 'coach_stable_id', as: 'coachStableLink' });

Admin.hasMany(StableRegistration, { foreignKey: 'reviewed_by', as: 'reviewedRegistrations' });
StableRegistration.belongsTo(Admin, { foreignKey: 'reviewed_by', as: 'reviewer' });

Admin.hasMany(Invitation, { foreignKey: 'inviter_id', as: 'sentInvitations' });
Invitation.belongsTo(Admin, { foreignKey: 'inviter_id', as: 'inviter' });

Stable.hasMany(Invitation, { foreignKey: 'stable_id', as: 'invitations' });
Invitation.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

User.hasMany(CoachWeeklyAvailability, { foreignKey: 'coach_id', as: 'weeklyAvailability' });
CoachWeeklyAvailability.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

User.hasMany(CoachAvailabilityException, { foreignKey: 'coach_id', as: 'availabilityExceptions' });
CoachAvailabilityException.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });

// Coach-Favourite-Rider relationships
User.hasMany(CoachFavouriteRider, { foreignKey: 'coach_id', as: 'favouriteRiders' });
CoachFavouriteRider.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });
User.hasMany(CoachFavouriteRider, { foreignKey: 'rider_id', as: 'favouritedByCoaches' });
CoachFavouriteRider.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });

// Rider-Horse relationships
User.hasMany(RiderHorse, { foreignKey: 'rider_id', as: 'riderHorses' });
RiderHorse.belongsTo(User, { foreignKey: 'rider_id', as: 'rider' });
Horse.hasMany(RiderHorse, { foreignKey: 'horse_id', as: 'riderHorseLinks' });
RiderHorse.belongsTo(Horse, { foreignKey: 'horse_id', as: 'horse' });
Stable.hasMany(RiderHorse, { foreignKey: 'stable_id', as: 'riderHorseLinks' });
RiderHorse.belongsTo(Stable, { foreignKey: 'stable_id', as: 'stable' });

export {
  Admin, Arena, CoachAvailabilityException, CoachFavouriteRider, CoachPayout, CoachReview, CoachStable,
  CoachStableSchedule, CoachWeeklyAvailability, Course, CourseEnrollment, CourseSession,
  CourseTemplate, Discipline, Horse, HorseAvailability, Invitation, LessonBooking, LessonPackage,
  MagicLinkToken, Notification, ObstacleType, Payment, PlatformSetting, RiderHorse, RiderPackageBalance,
  SessionFeedback, Stable, StableRegistration, Subscription, User,
};
