import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Course = sequelize.define(
  'Course',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    discipline_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'disciplines',
        key: 'id',
      },
    },
    course_type: {
      type: DataTypes.ENUM('one_to_one', 'group'),
      allowNull: false,
      defaultValue: 'one_to_one',
    },
    difficulty_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
    },
    focus_type: {
      type: DataTypes.ENUM('rider_focused', 'horse_focused', 'balanced'),
      allowNull: true,
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_session_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    total_sessions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_enrollment: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    thumbnail_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    layout_image_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    layout_drawing_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    obstacles_layout: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM('public', 'my_riders', 'private'),
      allowNull: false,
      defaultValue: 'public',
    },
    allowed_rider_ids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'courses',
    timestamps: false,
  }
);

export default Course;
