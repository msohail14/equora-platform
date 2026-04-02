import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CoachFavouriteRider = sequelize.define(
  'CoachFavouriteRider',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rider_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'coach_favourite_riders',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['coach_id', 'rider_id'],
      },
    ],
  }
);

export default CoachFavouriteRider;
