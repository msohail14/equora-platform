import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  plan_type: {
    type: DataTypes.ENUM('basic', 'premium', 'pro'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired', 'past_due'),
    allowNull: false,
    defaultValue: 'active',
  },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  auto_renew: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  payment_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Subscription;
