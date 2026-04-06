import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LessonBooking = sequelize.define(
  'LessonBooking',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rider_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stables',
        key: 'id',
      },
    },
    arena_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'arenas',
        key: 'id',
      },
    },
    booking_type: {
      type: DataTypes.ENUM('lesson', 'arena_only'),
      allowNull: false,
      defaultValue: 'lesson',
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    horse_assignment: {
      type: DataTypes.ENUM('rider_selected', 'stable_assigns'),
      allowNull: false,
      defaultValue: 'stable_assigns',
    },
    payment_method: {
      type: DataTypes.ENUM('online', 'pay_at_stable'),
      allowNull: true,
      defaultValue: 'online',
      comment: 'How rider intends to pay: online (card) or pay_at_stable (cash)',
    },
    horse_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'horses',
        key: 'id',
      },
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'course_sessions',
        key: 'id',
      },
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    lesson_type: {
      type: DataTypes.ENUM('private', 'group'),
      allowNull: false,
      defaultValue: 'private',
    },
    status: {
      type: DataTypes.ENUM(
        'pending_horse_approval',
        'pending_payment',
        'pending_review',
        'confirmed',
        'declined',
        'in_progress',
        'cancelled',
        'completed',
        'waitlisted'
      ),
      allowNull: false,
      defaultValue: 'pending_review',
    },
    waitlist_position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    series_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      comment: 'Groups multi-session bookings together (UUID)',
    },
    decline_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'lesson_bookings',
    timestamps: false,
  }
);

export default LessonBooking;
