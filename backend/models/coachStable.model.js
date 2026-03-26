import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CoachStable = sequelize.define(
  'CoachStable',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'user', key: 'id' },
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'stables', key: 'id' },
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    visibility: {
      type: DataTypes.ENUM('public', 'featured_riders_only'),
      allowNull: false,
      defaultValue: 'public',
    },
    request_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'coach_stables',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['coach_id', 'stable_id'] },
    ],
  }
);

export default CoachStable;
