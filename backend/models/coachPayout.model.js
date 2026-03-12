import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CoachPayout = sequelize.define('CoachPayout', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  coach_id: { type: DataTypes.INTEGER, allowNull: false },
  session_id: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'SAR' },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  payout_date: { type: DataTypes.DATEONLY, allowNull: true },
  reference: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'coach_payouts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default CoachPayout;
