import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MagicLinkToken = sequelize.define(
  'MagicLinkToken',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    purpose: {
      type: DataTypes.ENUM('login', 'signup'),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('stable_owner', 'coach', 'rider'),
      allowNull: true,
      comment: 'Role for signup purpose',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to User table (for rider/coach)',
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Admin table (for stable_owner)',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'magic_link_token',
    timestamps: false,
  }
);

export default MagicLinkToken;
