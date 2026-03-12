import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CourseEnrollment = sequelize.define(
  'CourseEnrollment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    rider_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'active',
    },
    enrollment_source: {
      type: DataTypes.ENUM('rider_self', 'admin'),
      allowNull: false,
      defaultValue: 'rider_self',
    },
    enrolled_by_type: {
      type: DataTypes.ENUM('rider', 'admin'),
      allowNull: true,
    },
    enrolled_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    enrolled_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'course_enrollments',
    timestamps: false,
  }
);

export default CourseEnrollment;
