import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  transaction_id: { type: DataTypes.STRING(255), unique: true, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'SAR' },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
  },
  provider: {
    type: DataTypes.ENUM('tappay', 'hyperpay', 'manual'),
    allowNull: false,
  },
  provider_reference: { type: DataTypes.STRING(255), allowNull: true },
  payment_type: {
    type: DataTypes.ENUM('subscription', 'session', 'course', 'tip'),
    allowNull: false,
  },
  related_id: { type: DataTypes.INTEGER, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Payment;
