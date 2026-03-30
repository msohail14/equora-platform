import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CourseTemplate = sequelize.define(
  'CourseTemplate',
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
    },
    obstacles: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    distances: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    arena_layout: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'course_templates',
    timestamps: false,
  }
);

export default CourseTemplate;
