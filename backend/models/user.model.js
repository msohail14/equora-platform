import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    mobile_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    firebase_uid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true,
    },
    auth_method: {
      type: DataTypes.ENUM('email_password', 'firebase_phone', 'firebase_email', 'magic_link'),
      allowNull: false,
      defaultValue: 'email_password',
    },
    role: {
      type: DataTypes.ENUM('rider', 'coach'),
      allowNull: false,
    },
    coach_type: {
      type: DataTypes.ENUM('stable_employed', 'freelancer', 'independent'),
      allowNull: true,
      defaultValue: null,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    fei_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    riding_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
    },
    specialties: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fcm_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    profile_picture_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    approval_mode: {
      type: DataTypes.ENUM('auto', 'manual'),
      allowNull: true,
      defaultValue: 'manual',
      comment: 'Coach-only: auto-approve bookings or require manual review',
    },
    default_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 45,
      comment: 'Coach-only: default lesson duration in minutes',
    },
    allowed_durations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [30, 45, 60],
      comment: 'Coach-only: array of allowed duration options in minutes',
    },
    email_verification_otp: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'user',
    timestamps: false,
  }
);

export default User;
