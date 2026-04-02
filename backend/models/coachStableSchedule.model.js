import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CoachStableSchedule = sequelize.define(
  'CoachStableSchedule',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    coach_stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'coach_stables',
        key: 'id',
      },
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 7 },
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    slot_duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    valid_to: {
      type: DataTypes.DATEONLY,
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
    tableName: 'coach_stable_schedules',
    timestamps: false,
  }
);

export default CoachStableSchedule;
