import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RiderHorse = sequelize.define(
  'RiderHorse',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rider_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    horse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relationship_type: {
      type: DataTypes.ENUM('owner', 'assigned', 'favorite'),
      allowNull: false,
      defaultValue: 'favorite',
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
    tableName: 'rider_horses',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['rider_id', 'horse_id'],
      },
    ],
  }
);

export default RiderHorse;
