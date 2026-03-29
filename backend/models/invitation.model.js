import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Invitation = sequelize.define(
  'Invitation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    inviter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Admin who sent the invitation',
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stable the coach is being invited to',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('coach'),
      allowNull: false,
      defaultValue: 'coach',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'invitation',
    timestamps: false,
  }
);

export default Invitation;
