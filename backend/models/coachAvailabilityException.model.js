import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CoachAvailabilityException = sequelize.define(
  'CoachAvailabilityException',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    exception_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    exception_type: {
      type: DataTypes.ENUM('unavailable', 'available'),
      allowNull: false,
      defaultValue: 'unavailable',
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING(255),
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
    tableName: 'coach_availability_exceptions',
    timestamps: false,
  }
);

export default CoachAvailabilityException;
