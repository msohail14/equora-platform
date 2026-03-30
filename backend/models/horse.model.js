import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Horse = sequelize.define(
  'Horse',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    breed: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discipline_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profile_picture_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    training_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
    },
    temperament: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    injury_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rider_suitability: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fei_pedigree_link: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    max_daily_sessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    min_rest_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      comment: 'Minimum hours between sessions',
    },
    max_weekly_sessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      comment: 'Maximum sessions per week',
    },
    last_session_end: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the horse last session ended',
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'busy', 'resting', 'injured'),
      allowNull: false,
      defaultValue: 'available',
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
    tableName: 'horses',
    timestamps: false,
  }
);

export default Horse;
