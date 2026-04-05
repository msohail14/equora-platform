import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HorseMaintenance = sequelize.define(
  'HorseMaintenance',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    horse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('vet_visit', 'farrier', 'vaccination', 'deworming', 'dental', 'injury', 'general'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    provider_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    date_performed: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    next_due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
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
    tableName: 'horse_maintenance_logs',
    timestamps: false,
  }
);

export default HorseMaintenance;
