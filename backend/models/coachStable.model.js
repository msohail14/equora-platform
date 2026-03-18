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
